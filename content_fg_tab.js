"use strict";

/**
 * XXX Don't rename - it's called from the background script.
 */
function __BTS_continueCapturing(tabId) {
    chrome.runtime.sendMessage(null, {
        message: 'MESSAGE_SUSPEND_FG',
        tabId: tabId,
        backgroundColor: findBgColor(),
    });

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