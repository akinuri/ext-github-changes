function unmarkFiles() {
    document.querySelectorAll(
        "#files input[type=checkbox].js-reviewed-checkbox"
    ).forEach(cb => {
        if (cb.checked) {
            cb.click();
        }
    });
}

function markFiles() {
    document.querySelectorAll(
        "#files input[type=checkbox].js-reviewed-checkbox"
    ).forEach(cb => {
        if (!cb.checked) {
            cb.click();
        }
    });
}

function foldFiles() {
    document.querySelectorAll(
        "#files .file-info > button"
    ).forEach(button => {
        let fileEl = button.closest(".file");
        if (fileEl) {
            if (fileEl.classList.contains("Details--on")) {
                button.click();
            }
        }
    });
}

function getFileChangeCount(fileEl) {
    let count = fileEl.querySelector(".diffstat").innerText.trim();
    count = parseInt(count);
    return count;
}

function sortFiles() {
    let fileLists = document.querySelectorAll(".js-diff-progressive-container");
    if (fileLists.length > 1) {
        Array.from(fileLists).slice(1).forEach(list => {
            Array.from(list.children).forEach(diffEl => {
                fileLists[0].append(diffEl);
            });
            list.remove();
        });
    }
    let files = Array.from(fileLists[0].children);
    files.sort((a, b) => {
        return getFileChangeCount(a) - getFileChangeCount(b);
    });
    files.forEach(file => fileLists[0].append(file));
}

// console.log("GitHub Diff extension script is executed.");

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        let allowedMessages = ["unmark", "mark", "fold", "sort"];
        if (!allowedMessages.includes(request)) {
            return;
        }
        switch (request) {
            case "unmark" : unmarkFiles(); break;
            case "mark"   : markFiles();   break;
            case "fold"   : foldFiles();   break;
            case "sort"   : sortFiles();   break;
        }
    }
);