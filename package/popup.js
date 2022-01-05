window.addEventListener("load", function () {
    
    let alertEl = document.querySelector("p.alert");
    let isError = false;
    
    function handleError(error) {
        isError = error;
        alertEl.innerHTML = "<b>Error</b>: " + error;
        alertEl.hidden = false;
        alertEl.nextElementSibling.classList.add("disabled");
    }
    
    let activeTab = null;
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        activeTab = tabs[0];
    });
    
    setTimeout(() => {
        
        if (!activeTab) {
            return;
        }
        
        // https://github.com/XXX/XXX/pull/92/files
        // https://github.com/XXX/XXX/commit/2878a22b97c301a401a1c78ca7ca079a51ceb0e9
        
        let patterns = {
            pull : /^https:\/\/(?:www)?github.com\/\w+\/\w+\/pull\/\d+\/files/,
            commit : /^https:\/\/(?:www)?github.com\/\w+\/\w+\/commit\/\d+/,
        };
        
        let isPull = patterns.pull.test(activeTab.url);
        
        if (!isPull) {
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
        
        function sendMessage(message) {
            if (activeTab) {
                chrome.tabs.sendMessage(activeTab.id, message);
            }
        }
        
        let buttons = {
            unmark : document.querySelector("button#unmark"),
            mark   : document.querySelector("button#mark"),
            fold   : document.querySelector("button#fold"),
            sort   : document.querySelector("button#sort"),
        };
        
        for (let button of Object.values(buttons)) {
            button.addEventListener("click", () => sendMessage(button.id));
        }
        
    }, 100);
    
});