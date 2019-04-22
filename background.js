"use strict";

import {Utils} from './utils.js';
import {CommonUtils} from './common.js';
import {showOptions} from './aspects/opts.js';
import {getCurrentTab} from './aspects/tabs.js';
import {
    suspendTabPhase2,
    suspendCurrentTab,
    suspendCurrentWindow,
    unsuspendCurrentWindow
} from './aspects/suspension.js';

const console = chrome.extension.getBackgroundPage().console; // really needed?

export const EXT_URLS = {
    parkHtml: chrome.runtime.getURL('web/park.html'),
    parkCss: chrome.runtime.getURL('web/park.css'),
    parkFrame: chrome.runtime.getURL('web/park-frame.html'),
    parkJs: chrome.runtime.getURL('web/park.js'),
    tempParkPage: chrome.runtime.getURL('/park.html'),
    optionsHtml: chrome.runtime.getURL('/options.html'),
};

extBg = {
    urls: EXT_URLS,
    Utils: Utils,
    CommonUtils: CommonUtils,
    showOptions: showOptions,
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
        if (msg.message === CommonUtils.MESSAGE_SUSPEND_FG) {
            suspendTabPhase2(msg.tabId, msg.screenshotId, msg.backgroundColor, null);
        } else if (msg.message === CommonUtils.MESSAGE_SUSPEND_BG) {
            suspendTabPhase2(msg.tabId, msg.screenshotId, msg.backgroundColor, msg.imageDataUri);
        }
    });
}