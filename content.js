(function () {
    "use strict";

    const logArray = function (args) {
        console.log.apply(console, args);
    };

    logArray(['hello from content script', window.location.href]);

    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
        console.log("Got message", msg.message);
        if (msg.message === MESSAGE_LOG) {
            const argArray = Object.values(msg.arguments);
            argArray.splice(0, 0, "BG:");
            logArray(argArray);
        }
    });

    // chrome.extension.sendMessage({}, function (response) {
    //     var readyStateCheckInterval = setInterval(function () {
    //         if (document.readyState === "complete") {
    //             clearInterval(readyStateCheckInterval);
    //         }
    //     }, 100);
    // });

})();
