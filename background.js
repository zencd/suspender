(function () {
    "use strict";

    const console = chrome.extension.getBackgroundPage().console;

    function logToContentScript() {
        const logArgs = arguments;
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            const msg = {message: MESSAGE_LOG, arguments: logArgs};
            chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {});
        });
    }

    function contextMenuSuspend(info, tab) {
        chrome.tabs.captureVisibleTab(null, {}, function (image) {
            // https://stackoverflow.com/questions/4573956/taking-screenshot-using-javascript-for-chrome-extensions/4574782
            logToContentScript('image:', 888);
        });
    }

    chrome.contextMenus.create({
        title: "SUSPENDER",
        contexts: ["page"],
        onclick: contextMenuSuspend
    });

}());