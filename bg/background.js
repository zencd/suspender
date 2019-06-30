"use strict";

import {Utils} from '../lib/Utils.js';
import {BtsUtils} from './BtsUtils.js';
import {getCurrentTab} from './tabs.js';
import {} from './resources.js';
import {
    suspendTabPhase2,
    suspendCurrentTab,
    suspendCurrentWindow,
    unsuspendCurrentWindow,
    captureVisibleTab_Scale_Persist
} from './suspension.js';

// const console = chrome.extension.getBackgroundPage().console; // really needed?

const SCREENSHOT_THREAD_INTERVAL = Utils.getRandomInt(60, 70) * 1000;

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
    initScreenshotThread();
}

function initMessageListener() {
    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
        console.debug("BG got message:", msg);
        if (msg.message === BtsUtils.MESSAGE_H2C_SCREENSHOT_READY) {
            suspendTabPhase2(msg.tabId, Utils.uidString(), msg.backgroundColor, msg.imageDataUri);
        } else if (msg.message === BtsUtils.MESSAGE_LOG_TO_BG) {
            console.log.apply(null, msg.args);
        }
    });
}

function initScreenshotThread() {
    function onePass() {
        console.debug("taking periodic screenshot of an active tab");
        //captureVisibleTab_Scale_Persist();
    }
    setInterval(onePass, SCREENSHOT_THREAD_INTERVAL);
}