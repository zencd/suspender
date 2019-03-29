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

    chrome.webRequest.onBeforeRequest.addListener(function(details) {
            //
            // example of details:
            //
            // frameId: 0
            // method: "GET"
            // parentFrameId: -1
            // requestId: "177149"
            // tabId: 3320
            // timeStamp: 1553804074191.074
            // type: "main_frame"
            // url: "https://github.com/zencd/charted"
            //
            const tabId = details.tabId;
            const github = details.url.indexOf("github") >= 0;
            if (!github) {
                return {cancel: false};
            }
            logToContentScript("details", details);
            console.log("details", details);
            const msg = {message: MESSAGE_SHOW_PARK};
            chrome.tabs.sendMessage(tabId, msg, function (response) {});
            // chrome.tabs.get(tabId, function(tab) {
            //     console.log("tab", tab);
            // });
            return {cancel: true};
        },
        {urls: ["<all_urls>"]},
        ["blocking"]
    );

    chrome.webRequest.onHeadersReceived.addListener(function(details) {
        console.log("onHeadersReceived", "details", details);
    });

}());