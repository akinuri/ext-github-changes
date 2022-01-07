let alertEl   = null;
let isError   = false;
let activeTab = null;
let isPull    = false;
let isCommit  = false;
let pageType  = null;

let buttons = {
    fold   : null,
    sort   : null,
    mark   : null,
    unmark : null,
};

function handleError(error) {
    isError = error;
    alertEl.innerHTML = "<b>Error</b>: " + error;
    alertEl.hidden = false;
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
    pull        : /^https:\/\/(?:www)?github.com\/\w+\/\w+\/pull\/\d+\/files/,
    pullCommit  : /^https:\/\/(?:www)?github.com\/\w+\/\w+\/pull\/\d+\/commits\/\w+/,
    commit      : /^https:\/\/(?:www)?github.com\/\w+\/\w+\/commit\/\w+/,
};

window.addEventListener("load", function () {
    
    alertEl = document.querySelector("p.alert");
    
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        activeTab = tabs[0];
    });
    
    setTimeout(() => {
        
        if (!activeTab) {
            return;
        }
        
        isPull = patterns.pull.test(activeTab.url);
        if (!isPull) {
            isCommit = patterns.pullCommit.test(activeTab.url) || patterns.commit.test(activeTab.url);
        }
        
        if (!isPull && !isCommit) {
            handleError("Invalid target page/url.");
            return;
        }
        
        chrome.tabs.executeScript(activeTab.id, {
            file: "content.js",
        }, function (result) {
            if (chrome.extension.lastError) {
                handleError(chrome.extension.lastError.message);
            }
        });
        
        if (isError) {
            return;
        }
        
        buttons.fold   = document.querySelector("button#fold");
        buttons.sort   = document.querySelector("button#sort");
        buttons.mark   = document.querySelector("button#mark");
        buttons.unmark = document.querySelector("button#unmark");
        
        if (isCommit) {
            buttons.mark.classList.add("disabled");
            buttons.unmark.classList.add("disabled");
        }
        
        [buttons.fold, buttons.sort].forEach(button => {
            button.addEventListener("click", () => sendMessage(button.id));
        });
        
        if (isPull) {
            [buttons.mark, buttons.unmark].forEach(button => {
                button.addEventListener("click", () => sendMessage(button.id));
            });
        }
        
    }, 100);
    
});