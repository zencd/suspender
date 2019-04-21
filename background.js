"use strict";

import {Utils} from './utils.js';
import {CommonUtils} from './common.js';
import {getTabs, getCurrentTab} from './aspects/tabs.js';
import {
    suspendTabPhase1,
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
    suspendTabPhase1: suspendTabPhase1,
};

initAll();

function initAll() {
    initMessageListener();
}

function initMessageListener() {
    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    });
}

function showOptions() {
    chrome.tabs.create({url: EXT_URLS.optionsHtml})
}