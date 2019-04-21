"use strict";

/**
 * XXX Don't rename - it's called from the background script.
 */
function __BTS_continueCapturing(tabId) {
    if (document.body) {
        const extBg = chrome.extension.getBackgroundPage()['extBg'];
        const color = extBg.Utils.findBgColor(document);

        const opts = {
            height: window.innerHeight, // capturing only the visible area
            width: window.innerWidth, // force it, otherwise it will be calculated automatically and slightly wrong
            scale: 1, // scale=1 forces normal size screenshot on retina, ready for CSS pixels
            //imageTimeout: 40*1000,
            //allowTaint: true,
            useCORS: true, // I found, with 'false' it even won't try to fetch images from different domains
        };
        html2canvas(document.body, opts).then(canvas => {
            extBg.suspendTabPhase1(tabId, color, canvas.toDataURL());
        });
    }
}