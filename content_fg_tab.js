"use strict";

console.log("chrome.extension", chrome.extension);
const extBg = chrome.extension.getBackgroundPage().extBg;

/**
 * XXX Don't rename - it's called from the background script.
 */
function __BTS_continueCapturing(tabId) {
    const color = extBg.Utils.findBgColor(document);
    extBg.suspendTabPhase1(tabId, color, null);
}