(function () {
    "use strict";

    const logArray = function (args) {
        console.log.apply(console, args);
    };

    logArray(['hello from content script', window.location.href]);

    function suspendThisTab() {
        const url = chrome.runtime.getURL('iframed.html');
        console.log("url", url);
        fetch(url)
            .then((response) => {
                response.text().then((htmlStr) => {
                    console.log("htmlStr bytes", htmlStr.length);
                    const b64 = b64EncodeUnicode(htmlStr);
                    const b64Prefixed = 'data:text/html;base64,' + b64;
                    console.log("b64Prefixed", b64Prefixed);
                    document.location.href = b64Prefixed;
                });
            });
    }

    setTimeout(function () {
        document.body.addEventListener('click', function () {
            console.log("body clicked");
            suspendThisTab();
            // document.location.href = 'https://ya.ru/';
            // $.get(url, function (data) {
            //     console.log("Load was performed.", data);
            // });
        });
    }, 300);

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
