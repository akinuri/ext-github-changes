let alertEl = null;
let isError = false;
let activeTab = null;
let isPull = false;
let isCommit = false;

let buttons = {
    fold: null,
    sort: null,
    mark: null,
    unmark: null,
};

function handleError(error) {
    isError = error;
    alertEl.textContent = "Error: " + error;
    alertEl.classList.remove("hidden");
    alertEl.nextElementSibling.classList.add("disabled");
}

function sendMessage(message) {
    if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, message);
    }
}

// https://github.com/XXX/XXX/pull/92/files
// https://github.com/XXX/XXX/pull/92/commits/XXX
// https://github.com/XXX/XXX/commit/XXX

let patterns = {
    pullChanges: /^https:\/\/(?:www\.)?github.com\/[\w-]+\/[\w-]+\/pull\/\d+\/changes(?:\/)?/,
    pullCommit: /^https:\/\/(?:www\.)?github.com\/[\w-]+\/[\w-]+\/pull\/\d+\/changes\/\w+/,
    commit: /^https:\/\/(?:www\.)?github.com\/[\w-]+\/[\w-]+\/commit\/\w+/,
};

window.addEventListener("load", function () {
    alertEl = document.querySelector("#alert");

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        activeTab = tabs[0];
        someCode(activeTab);
    });

    function someCode(activeTab) {
        if (!activeTab) {
            return;
        }

        isPull = patterns.pullChanges.test(activeTab.url);
        if (!isPull) {
            isCommit = patterns.pullCommit.test(activeTab.url) || patterns.commit.test(activeTab.url);
        }

        if (!isPull && !isCommit) {
            handleError("Invalid target page/url.");
            return;
        }

        chrome.scripting.executeScript(
            {
                target: { tabId: activeTab.id },
                files: ["content.js"],
            },
            function () {
                if (chrome.runtime.lastError) {
                    handleError(chrome.runtime.lastError.message);
                }
            },
        );

        if (isError) {
            return;
        }

        buttons.fold = document.querySelector("button#fold");
        buttons.unfold = document.querySelector("button#unfold");
        buttons.sortChangesAsc = document.querySelector("button#sort-changes-asc");
        buttons.sortChangesDesc = document.querySelector("button#sort-changes-desc");
        buttons.mark = document.querySelector("button#mark");
        buttons.unmark = document.querySelector("button#unmark");

        if (isCommit) {
            buttons.mark.classList.add("disabled");
            buttons.unmark.classList.add("disabled");
        }

        [buttons.fold, buttons.unfold, buttons.sortChangesAsc, buttons.sortChangesDesc].forEach((button) => {
            button.addEventListener("click", () => sendMessage(button.id));
        });

        if (isPull) {
            [buttons.mark, buttons.unmark].forEach((button) => {
                button.addEventListener("click", () => sendMessage(button.id));
            });
        }
    }
});
