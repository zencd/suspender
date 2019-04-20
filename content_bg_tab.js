"use strict";

// console.log("content_bg_tab", new Date());

/**
 * XXX Don't rename - it's called from the background script.
 */
function continueCapturing(tabId) {
    if (document.body) {
        capture();
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

    function capture() {
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
                message: 'MESSAGE_SUSPEND_BG',
                tabId: tabId,
                backgroundColor: findBgColor(),
                imageDataUri: imageDataUri,
            });
        });
    }
}
