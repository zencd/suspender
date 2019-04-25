"use strict";

import {Utils} from '../lib/Utils.js';
import {BtsUtils} from './BtsUtils.js';
import {getCurrentTab} from './tabs.js';
import {} from './resources.js';
import {
    suspendTabPhase2,
    suspendCurrentTab,
    suspendCurrentWindow,
    unsuspendCurrentWindow
} from './suspension.js';

const console = chrome.extension.getBackgroundPage().console; // really needed?

export const EXT_URLS = {
    parkHtml: chrome.runtime.getURL('park/park.html'),
    parkCss: chrome.runtime.getURL('park/park.css'),
    parkFrame: chrome.runtime.getURL('park/park_frame.html'),
    parkJs: chrome.runtime.getURL('park/park.js'),
    tempParkPage: chrome.runtime.getURL('/park.html'),
    optionsHtml: chrome.runtime.getURL('/options.html'),
};

extBg = {
    urls: EXT_URLS,
    Utils: Utils,
    CommonUtils: BtsUtils,
    suspendCurrentTab: suspendCurrentTab,
    suspendCurrentWindow: suspendCurrentWindow,
    unsuspendCurrentWindow: unsuspendCurrentWindow,
    getCurrentTab: getCurrentTab,
    suspendTabPhase1: suspendTabPhase2,
};

initAll();

function initAll() {
    initMessageListener();
}

function initMessageListener() {
    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.message === BtsUtils.MESSAGE_H2C_SCREENSHOT_READY) {
            const screenshotId = Utils.uidString();
            const bg = msg.backgroundColor;
            suspendTabPhase2(msg.tabId, screenshotId, bg, msg.imageDataUri);
        } else if (msg.message === BtsUtils.MESSAGE_LOG_TO_BG) {
            console.log.apply(null, msg.args);
        }
    });
}