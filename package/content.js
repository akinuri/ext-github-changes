// #region ==================== QS

/** Query Selector Helpers */
qsh = (() => {
    function isScope(value) {
        return value instanceof Element || value instanceof Document || value instanceof DocumentFragment;
    }

    function normalizeScopes(value) {
        if (isScope(value)) {
            return [value];
        }
        if (Array.isArray(value) || value instanceof NodeList || value instanceof HTMLCollection) {
            return Array.from(value).filter(isScope);
        }
        return [];
    }

    function normalizeSelectorTokens(selectors) {
        return selectors
            .filter((selectorToken) => {
                return typeof selectorToken === "string" && selectorToken.trim().length > 0;
            })
            .map((selectorToken) => {
                return selectorToken.trim();
            });
    }

    function parseSelectorToken(selector) {
        let result = {
            selector: selector,
            nthIndex: null,
        };
        let match = selector.match(/^(.*):nth-of\((\d+)\)$/);
        if (match) {
            result.selector = match[1].trim();
            result.nthIndex = parseInt(match[2], 10);
        }
        return result;
    }

    return {
        isScope,
        normalizeScopes,
        normalizeSelectorTokens,
        parseSelectorToken,
    };
})();

function qs(...selectors) {
    if (!selectors.length) {
        return null;
    }
    let scopes = [document];
    if (typeof selectors[0] !== "string") {
        let customScopes = qsh.normalizeScopes(selectors[0]);
        if (customScopes.length) {
            scopes = customScopes;
            selectors = selectors.slice(1);
        }
    }
    selectors = qsh.normalizeSelectorTokens(selectors);
    for (let selector of selectors) {
        let nextScopes = [];
        scopes.forEach((scope) => {
            let match = scope.querySelector(selector);
            if (match) {
                nextScopes.push(match);
            }
        });
        scopes = nextScopes;
        if (!scopes.length) {
            break;
        }
    }
    return scopes[0] || null;
}

function qsa(...selectors) {
    if (!selectors.length) {
        return [];
    }
    let scopes = [document];
    if (typeof selectors[0] !== "string") {
        let customScopes = qsh.normalizeScopes(selectors[0]);
        if (customScopes.length) {
            scopes = customScopes;
            selectors = selectors.slice(1);
        }
    }
    selectors = qsh.normalizeSelectorTokens(selectors);
    selectors.forEach((selectorToken) => {
        let { selector, nthIndex } = qsh.parseSelectorToken(selectorToken);
        if (!selector) {
            return;
        }
        let nextScopes = [];
        scopes.forEach((scope) => {
            let matches = Array.from(scope.querySelectorAll(selector));
            if (nthIndex === null) {
                nextScopes.push(...matches);
                return;
            }
            if (matches[nthIndex]) {
                nextScopes.push(matches[nthIndex]);
            }
        });
        scopes = nextScopes;
    });
    return scopes;
}

// #endregion

FILE_EL_SELECTOR = "[class*=PullRequestDiffsList-module__diffEntry__]";

function getFileFromChild(childEl) {
    return childEl.closest(FILE_EL_SELECTOR);
}

function getFileStats(fileEl) {
    let result = {
        container: fileEl,
        collapseToggle: qs(fileEl, "[class*=DiffFileHeader-module__diff-file-header]", "button"),
        collapseToggleTooltip: null,
        isCollapsed: null,
        markViewedToggle: qs(fileEl, "[aria-label='Not Viewed']") || qs(fileEl, "[aria-label='Viewed']"),
        isViewed: null,
        diff: {
            el: qs(fileEl, "div[class*=DiffFileHeader-module__hide-on-mobile__]"),
            add: null,
            del: null,
        },
    };
    result.collapseToggleTooltip = result.collapseToggle?.nextElementSibling;
    result.isCollapsed = result.collapseToggleTooltip?.innerText.trim() === "Expand file";
    result.isViewed = result.markViewedToggle?.getAttribute("aria-label") === "Viewed";
    if (result.diff.el) {
        let diffText = result.diff.el.innerText.trim();
        result.diff.add = parseInt(diffText.match(/(\d+)\s*additions?/)?.[1] || "0", 10);
        result.diff.del = parseInt(diffText.match(/(\d+)\s*deletions?/)?.[1] || "0", 10);
    }
    return result;
}

function getFiles() {
    let result = [];
    let fileEls = document.querySelectorAll(FILE_EL_SELECTOR);
    fileEls.forEach((fileEl) => {
        result.push(getFileStats(fileEl));
    });
    return result;
}

function foldFiles() {
    let files = getFiles();
    let collapsedCount = files.filter((file) => file.isCollapsed === true).length;
    let expandedCount = files.filter((file) => file.isCollapsed === false).length;
    let targetCollapsed = collapsedCount <= expandedCount;
    files.forEach((file) => {
        if (!file.collapseToggle || file.isCollapsed === null) {
            return;
        }
        if (file.isCollapsed !== targetCollapsed) {
            file.collapseToggle.click();
        }
    });
}

function getFileChangeCount(fileEl) {
    let count = fileEl.querySelector(".diffstat").innerText.trim();
    count = count.replace(",", "");
    count = parseInt(count);
    if (isNaN(count)) {
        let style = fileEl.getAttribute("style");
        let rowCount = fileEl.getAttribute("style")?.match(/--file-row-count: (\d+)/)[1] ?? null;
        if (rowCount) {
            count = rowCount - 1;
        }
    }
    return count || 0;
}

function normalizeFilesLists() {
    let fileLists = document.querySelectorAll(".js-diff-progressive-container");
    if (fileLists.length > 1) {
        Array.from(fileLists)
            .slice(1)
            .forEach((list) => {
                Array.from(list.children).forEach((diffEl) => {
                    fileLists[0].append(diffEl);
                });
                list.remove();
            });
    }
}

function sortFiles() {
    normalizeFilesLists();
    let fileList = document.querySelector(".js-diff-progressive-container");
    let files = Array.from(fileList.children);
    // files.forEach(file => {
    // console.log(file, file.innerText, getFileChangeCount(file));
    // });
    files.sort((a, b) => {
        return getFileChangeCount(a) - getFileChangeCount(b);
    });
    files.forEach((file) => fileList.append(file));
}

function markFiles() {
    let files = getFiles();
    files.forEach((file) => {
        if (file.markViewedToggle && !file.isViewed) {
            file.markViewedToggle.click();
        }
    });
}

function unmarkFiles() {
    let files = getFiles();
    files.forEach((file) => {
        if (file.markViewedToggle && file.isViewed) {
            file.markViewedToggle.click();
        }
    });
}

// console.log("GitHub Diff extension script is executed.");

chrome.runtime.onMessage?.addListener(function (request, sender, sendResponse) {
    let allowedMessages = ["unmark", "mark", "fold", "sort"];
    if (!allowedMessages.includes(request)) {
        return;
    }
    switch (request) {
        case "fold":
            foldFiles();
            break;
        case "sort":
            sortFiles();
            break;
        case "mark":
            markFiles();
            break;
        case "unmark":
            unmarkFiles();
            break;
    }
});
