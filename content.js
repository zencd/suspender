(function () {
    "use strict";

    console.log('content.js init');

    initMessageListener();

    function initMessageListener() {
        chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
            if (msg.message === 'MESSAGE_TAKE_SCREENSHOT') {
                takeScreenshot(canvas => {
                    console.log("canvas", canvas);
                    const imageDataUri = canvas.toDataURL();
                    chrome.runtime.sendMessage(null, {
                        message: 'MESSAGE_SCREENSHOT_READY',
                        screenshotId: msg.screenshotId,
                        imageDataUri: imageDataUri,
                        htmlDataUri: msg.htmlDataUri,
                        tabId: msg.tabId,
                        tabUrl: msg.tabUrl,
                    });
                });
            } else if (msg.message === 'MESSAGE_GET_DOCUMENT_BG_COLOR') {
                sendResponse({backgroundColor: findBgColor()});
            } else {
                console.debug("Got message", msg.message);
            }
        });
    }

    function takeScreenshot(onCanvas) {
        const opts = {
            height: window.innerHeight, // capturing only the visible area
            width: window.innerWidth, // force it, otherwise it will be calculated automatically and slightly wrong
            scale: 1, // scale=1 forces normal size screenshot on retina, ready for CSS pixels
            //imageTimeout: 40*1000,
            //allowTaint: true,
            useCORS: true, // I found, with 'false' it even won't try to fetch images from different domains
        };
        html2canvas(document.body, opts).then(onCanvas);
    }

    function findBgColor() {
        let color = 'rgb(255,255,255)';
        if (document.body) {
            color = getComputedStyle(document.body).backgroundColor;
            if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
                color = 'rgb(255,255,255)';
            }
        }
        return color;
    }

})();