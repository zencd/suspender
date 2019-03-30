(function () {
    "use strict";

    const console = chrome.extension.getBackgroundPage().console;

    function contextMenuSuspend(info, tab) {
        chrome.tabs.captureVisibleTab(null, {}, function (image) {
            // https://stackoverflow.com/questions/4573956/taking-screenshot-using-javascript-for-chrome-extensions/4574782
            logToCurrentTab('image:', 888);
        });
    }

    chrome.contextMenus.create({
        title: "SUSPENDER",
        contexts: ["page"],
        onclick: contextMenuSuspend
    });

}());