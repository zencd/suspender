"use strict";

/**
 * XXX Don't rename - it's called from background script.
 */
function continueCapturing(tabId) {
    let color = getComputedStyle(document.body).backgroundColor;
    if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
        color = 'rgb(255,255,255)';
    }
    chrome.runtime.sendMessage(null, {
        message: 'MESSAGE_SUSPEND_FG',
        tabId: tabId,
        backgroundColor: color,
    });
}
