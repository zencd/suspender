(function () {
    "use strict";

    console.log("content.js is here");

    const logArray = function (args) {
        console.log.apply(console, args);
    };

    initMessageListener();

    function initMessageListener() {
        chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
            console.log("received msg", msg);
            // return;
            if (msg.message === MESSAGE_LOG) {
                const argArray = Object.values(msg.arguments);
                argArray.splice(0, 0, "BG:");
                logArray(argArray);
            } else if (msg.message === MESSAGE_TAKE_SCREENSHOT) {
                const root = document.body;
                console.log("root", root);
                // sendResponse({xxx: 123});
                const opts = {
                    //imageTimeout: 40*1000,
                    //allowTaint: true,
                    //useCORS: true,
                };
                html2canvas(root, opts).then(canvas => {
                    console.log("canvas", canvas);
                    const imageDataUri = canvas.toDataURL();
                    // console.log("imageDataUri", imageDataUri);
                    // sendResponse({imageDataUri: imageDataUri});
                    chrome.runtime.sendMessage(null, {
                        message: MESSAGE_SCREENSHOT_READY,
                        imageDataUri: imageDataUri,
                        htmlDataUri: msg.htmlDataUri,
                        tabId: msg.tabId,
                        tabUrl: msg.tabUrl,
                    });
                });
            } else {
                console.log("Got message", msg.message);
            }
        });
    }
})();
