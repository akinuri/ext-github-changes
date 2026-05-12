// #region ==================== QSA

function qs(...selectors) {
    if (!selectors.length) {
        return null;
    }
    let scopes = [document];
    if (typeof selectors[0] !== "string") {
        let customScopes = normalizeScopes(selectors[0]);
        if (customScopes.length) {
            scopes = customScopes;
            selectors = selectors.slice(1);
        }
    }
    for (let selectorToken of selectors) {
        if (typeof selectorToken !== "string" || !selectorToken.trim()) {
            continue;
        }
        let selector = selectorToken.trim();
        let nextScopes = [];
        scopes.forEach((scope) => {
            let match = scope.querySelector(selector);
            if (match) {
                nextScopes.push(match);
            }
        });
        scopes = nextScopes;
        if (!scopes.length) {
            return null;
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
        let customScopes = normalizeScopes(selectors[0]);
        if (customScopes.length) {
            scopes = customScopes;
            selectors = selectors.slice(1);
        }
    }
    selectors.forEach((selectorToken) => {
        if (typeof selectorToken !== "string" || !selectorToken.trim()) {
            return;
        }
        let { selector, nthIndex } = parseSelectorToken(selectorToken.trim());
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

function parseSelectorToken(selector) {
    let match = selector.match(/^(.*):nth-of\((\d+)\)$/);
    if (!match) {
        return {
            selector: selector,
            nthIndex: null,
        };
    }
    return {
        selector: match[1].trim(),
        nthIndex: parseInt(match[2], 10),
    };
}

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

// #endregion

function foldFiles() {
    document.querySelectorAll("[class*=DiffFileHeader-module__diff-file-header]").forEach((header) => {
        let button = header.querySelector("button");
        button?.click();
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
    document.querySelectorAll("#files input[type=checkbox].js-reviewed-checkbox").forEach((cb) => {
        if (!cb.checked) {
            cb.click();
        }
    });
}

function unmarkFiles() {
    document.querySelectorAll("#files input[type=checkbox].js-reviewed-checkbox").forEach((cb) => {
        if (cb.checked) {
            cb.click();
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
