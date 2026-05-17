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

// #region ==================== UTILS

function getIndexOfElement(el) {
    if (!el || !el.parentElement) {
        return null;
    }
    return Array.from(el.parentElement.children).indexOf(el);
}

function generateRandomId(length = 4) {
    let id = Math.random()
        .toString(36)
        .substring(2, 2 + length);
    if (generateRandomId.ids.has(id)) {
        id = generateRandomId(length);
    } else {
        generateRandomId.ids.add(id);
    }
    return id;
}
generateRandomId.ids = new Set();

// #endregion

// #region ==================== FILES

FILE_EL_SELECTOR = "[class*=PullRequestDiffsList-module__diffEntry__]";

function getFileFromChild(childEl) {
    return childEl.closest(FILE_EL_SELECTOR);
}

function getFileStats(fileEl) {
    let result = {
        container: fileEl,
        index: fileEl.dataset.index || getIndexOfElement(fileEl),
        id: fileEl.dataset.id || generateRandomId(),
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
    result.container.dataset.index = result.index;
    result.container.dataset.id = result.id;
    result.collapseToggleTooltip = result.collapseToggle?.nextElementSibling;
    result.isCollapsed = result.collapseToggleTooltip?.innerText.trim() === "Expand file";
    result.isViewed = result.markViewedToggle?.getAttribute("aria-label") === "Viewed";
    if (result.diff.el) {
        let diffText = result.diff.el.textContent.trim();
        result.diff.add = parseInt(diffText.match(/(\d+)\s*additions?/)?.[1] || "0", 10);
        result.diff.del = parseInt(diffText.match(/(\d+)\s*deletions?/)?.[1] || "0", 10);
        result.diff.total = result.diff.add + result.diff.del;
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

// #endregion

function foldFiles() {
    let files = getFiles();
    files.forEach((file) => {
        if (!file.isCollapsed) {
            file.collapseToggle.click();
        }
    });
}

function unfoldFiles() {
    let files = getFiles();
    files.forEach((file) => {
        if (file.isCollapsed) {
            file.collapseToggle.click();
        }
    });
}

function sortFiles(dir = "asc") {
    let files = getFiles();
    let currentOrder = files.map((file) => file.id).join(", ");
    let fileList = files[0].container.parentElement;
    let placeholderEl = fileList.querySelectorAll(":scope > svg");
    placeholderEl.forEach((el) => el.remove());
    if (dir === "restore") {
        files.sort((a, b) => a.index - b.index);
    } else {
        files.sort((a, b) => {
            return (a.diff.total - b.diff.total) * (dir === "asc" ? 1 : -1);
        });
    }
    let newOrder = files.map((file) => file.id).join(", ");
    if (currentOrder === newOrder) {
        return;
    }
    files.forEach((file) => fileList.append(file.container));
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

isExListenerAdded = window.isExListenerAdded || false;
if (!isExListenerAdded) {
    chrome.runtime.onMessage?.addListener(function (request, sender, sendResponse) {
        let allowedMessages = [
            "unmark",
            "mark",
            "fold",
            "unfold",
            "sort-changes-asc",
            "sort-changes-desc",
            "sort-restore",
        ];
        if (!allowedMessages.includes(request)) {
            return;
        }
        switch (request) {
            case "fold":
                foldFiles();
                break;
            case "unfold":
                unfoldFiles();
                break;
            case "sort-changes-asc":
                sortFiles();
                break;
            case "sort-restore":
                sortFiles("restore");
                break;
            case "sort-changes-desc":
                sortFiles("desc");
                break;
            case "mark":
                markFiles();
                break;
            case "unmark":
                unmarkFiles();
                break;
        }
    });
}
window.isExListenerAdded = true;
