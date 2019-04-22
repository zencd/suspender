"use strict";

/**
 * XXX Don't rename - it's called from the background script.
 */
function __BTS_continueCapturing(tabId) {
    if (document.body) {
        const opts = {
            height: window.innerHeight, // capturing only the visible area
            width: window.innerWidth, // force it, otherwise it will be calculated automatically and slightly wrong
            scale: 1, // scale=1 forces normal size screenshot on retina, ready for CSS pixels
            //imageTimeout: 40*1000,
            //allowTaint: true,
            useCORS: true, // I found, with 'false' it even won't try to fetch images from different domains
        };
        html2canvas(document.body, opts).then(canvas => {
            chrome.runtime.sendMessage(null, {
                message: 'MESSAGE_SUSPEND_BG',
                tabId: tabId,
                backgroundColor: findBgColor(),
                imageDataUri: canvas.toDataURL(),
            });
        });
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
}