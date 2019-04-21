"use strict";

/**
 * XXX Don't rename - it's called from the background script.
 */
function continueCapturing(tabId) {
    const extBg = chrome.extension.getBackgroundPage().extBg;
    const color = extBg.Utils.findBgColor(document);
    extBg.suspendTabPhase1(tabId, color, null);
}