"use strict";

import {Utils} from './utils.js';
import {CommonUtils} from './common.js';
import {getTabs, getCurrentTab} from './aspects/tabs.js';
import {
    suspendTabPhase1,
    scaleStoreRedirect,
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
    isUrlSuspendable: CommonUtils.isUrlSuspendable,
    Utils: Utils,
    showOptions: showOptions,
    suspendCurrentTab: suspendCurrentTab,
    suspendCurrentWindow: suspendCurrentWindow,
    unsuspendCurrentWindow: unsuspendCurrentWindow,
    getCurrentTab: getCurrentTab,
    urls: EXT_URLS,
    suspendTabPhase1: suspendTabPhase1,
};

initAll();

function initAll() {
    initMessageListener();
}

export function onContextMenuDebugTabs() {
    const tt = getTabs().getAllTabs();
    console.log("===== DEBUG " + tt.length + " TABS =====");
    for (let i = 0; i < tt.length; i++) {
        const tab = tt[i];
        const ls = Math.floor((new Date() - tab.lastSeen) / 1000);
        console.log("" + (i + 1) + ".", tab.id, Utils.limit(tab.url, 60));
        console.log(" ", (tab.suspended ? 'Su' : '_'), (tab.active ? 'Ac' : '_'), (tab.pinned ? 'Pi' : '_'), (tab.audible ? 'Au' : '_'), (tab.discarded ? 'Di' : '_'), ls, "s");
        console.log(" ", tab);
        if (!tab.url) {
            chrome.tabs.get(tab.id, (chrTab) => {
                console.warn("BAD TAB", chrTab);
            });
        }
    }
}

export function onContextMenuDiscardDataUriTabs() {
    console.log("onContextMenuDiscardDataUriTabs");
    const tt = getTabs().getAllTabs();
    for (let i = 0; i < tt.length; i++) {
        const tab = tt[i];
        if (tab.url && Utils.isDataUri(tab.url)) {
            chrome.tabs.discard(tab.id, function (resTab) {
                console.log("discarded tab", resTab);
            });
        }
    }
}

function initMessageListener() {
    chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.message === CommonUtils.MESSAGE_SUSPEND_FG) {
            suspendTabPhase1(msg.tabId, msg.backgroundColor, null);
        } else if (msg.message === CommonUtils.MESSAGE_SUSPEND_BG) {
            suspendTabPhase1(msg.tabId, msg.backgroundColor, msg.imageDataUri);
        }
    });
}

function showOptions() {
    chrome.tabs.create({url: EXT_URLS.optionsHtml})
}