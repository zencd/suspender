(function () {
    "use strict";

    const logArray = function (args) {
        console.log.apply(console, args);
    };

    logArray(['hello from content script', window.location.href]);
    addMessageListener();
    // suspendThisTab();

    function suspendThisTab() {
        // document.title is empty here by some reason
        getSuspendedPageContent(document.location.href, 'page title 6732', function () {});
    }

    // setTimeout(function () {
    //     document.body.addEventListener('click', function () {
    //         console.log("body clicked");
    //         suspendThisTab();
    //         // document.location.href = 'https://ya.ru/';
    //         // $.get(url, function (data) {
    //         //     console.log("Load was performed.", data);
    //         // });
    //     });
    // }, 300);

    function addMessageListener() {
        chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
            if (msg.message === MESSAGE_LOG) {
                const argArray = Object.values(msg.arguments);
                argArray.splice(0, 0, "BG:");
                logArray(argArray);
            } else {
                console.log("Got message", msg.message);
            }
        });
    }

    // chrome.extension.sendMessage({}, function (response) {
    //     var readyStateCheckInterval = setInterval(function () {
    //         if (document.readyState === "complete") {
    //             clearInterval(readyStateCheckInterval);
    //         }
    //     }, 100);
    // });

})();
