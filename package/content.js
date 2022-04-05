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
        Array.from(fileLists).slice(1).forEach(list => {
            Array.from(list.children).forEach(diffEl => {
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
    files.forEach(file => fileList.append(file));
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

function unmarkFiles() {
    document.querySelectorAll(
        "#files input[type=checkbox].js-reviewed-checkbox"
    ).forEach(cb => {
        if (cb.checked) {
            cb.click();
        }
    });
}

// console.log("GitHub Diff extension script is executed.");

chrome.runtime.onMessage?.addListener(
    function (request, sender, sendResponse) {
        let allowedMessages = ["unmark", "mark", "fold", "sort"];
        if (!allowedMessages.includes(request)) {
            return;
        }
        switch (request) {
            case "fold"   : foldFiles();   break;
            case "sort"   : sortFiles();   break;
            case "mark"   : markFiles();   break;
            case "unmark" : unmarkFiles(); break;
        }
    }
);