(function () {
    "use strict";

    // const console = {
    //     log: log,
    //     info: log,
    //     warn: log,
    //     error: log,
    //     debug: log,
    // };

    function log() {
        const args = Array.prototype.slice.call(arguments);
        args.unshift(CommonUtils.LOG_PREFIX);
        window.console.log.apply(null, args);
    }

    const logArray = function (args) {
        console.log.apply(null, args);
    };

    log('content.js init');

    // const jsHeapSizeLimit = toMB(window.performance.memory.jsHeapSizeLimit);
    // const totalJSHeapSize = toMB(window.performance.memory.totalJSHeapSize);
    // const usedJSHeapSize = toMB(window.performance.memory.usedJSHeapSize);
    // log("window.performance.memory", window.performance.memory);
    // log("jsHeapSizeLimit", jsHeapSizeLimit);
    // log("totalJSHeapSize", totalJSHeapSize);
    // log("usedJSHeapSize", usedJSHeapSize);

    initMessageListener();

    function initMessageListener() {
        chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
            // console.debug("received msg", msg);
            if (msg.message === CommonUtils.MESSAGE_LOG) {
                const argArray = Object.values(msg.arguments);
                argArray.splice(0, 0, "BG:");
                logArray(argArray);
            } else if (msg.message === CommonUtils.MESSAGE_TAKE_SCREENSHOT) {
                const root = document.body;
                const opts = {
                    height: window.innerHeight, // capturing only the visible area
                    width: window.innerWidth, // force it, otherwise it will be calculated automatically and slightly wrong
                    scale: 1, // scale=1 forces normal size screenshot on retina, ready for CSS pixels
                    //imageTimeout: 40*1000,
                    //allowTaint: true,
                    useCORS: true, // I found, with 'false' it even won't try to fetch images from different domains
                };
                html2canvas(root, opts).then(canvas => {
                    console.log("canvas", canvas);
                    const imageDataUri = canvas.toDataURL();
                    // console.log("imageDataUri", imageDataUri);
                    // sendResponse({imageDataUri: imageDataUri});
                    chrome.runtime.sendMessage(null, {
                        message: CommonUtils.MESSAGE_SCREENSHOT_READY,
                        screenshotId: msg.screenshotId,
                        imageDataUri: imageDataUri,
                        htmlDataUri: msg.htmlDataUri,
                        tabId: msg.tabId,
                        tabUrl: msg.tabUrl,
                    });
                });
            } else if (msg.message === CommonUtils.MESSAGE_GET_DOCUMENT_BG_COLOR) {
                let color = getComputedStyle(document.body).backgroundColor;
                if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
                    color = 'rgb(255,255,255)';
                }
                sendResponse({backgroundColor: color});
            } else {
                console.debug("Got message", msg.message);
            }
        });
    }
})();
