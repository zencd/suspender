"use strict";

import {Utils} from '../utils.js';
import {onContextMenuDebugTabs, onContextMenuDiscardDataUriTabs} from '../background.js';
import {addThisSiteToWhitelist} from './opts.js';
import {suspendTab, suspendWindow, unsuspendWindow} from './suspension.js';

initMenus();

function initMenus() {
    chrome.runtime.onInstalled.addListener(function () {
        initContextMenu();
        initBrowserActionMenu();
    });
}

function initBrowserActionMenu() {
    const contexts = ['browser_action'];

    makeContextMenu({
        title: "Suspend",
        contexts: contexts,
        onclick: (info, tab) => {
            suspendTab(tab, true);
        }
    });
    makeContextMenu({
        title: "Suspend this window",
        contexts: contexts,
        onclick: (info, tab) => {
            suspendWindow(tab.windowId);
        }
    });
    makeContextMenu({
        title: "Unsuspend this window",
        contexts: contexts,
        onclick: (info, tab) => {
            unsuspendWindow(tab.windowId);
        }
    });
    makeContextMenu({
        title: "Never suspend this site",
        contexts: contexts,
        onclick: (info, tab) => {
        }
    });
}

function initContextMenu() {
    const contexts = [
        "page", "frame", "selection", "link", "editable", "image", "video", "audio"
    ];

    makeContextMenu({
        title: "Suspend",
        contexts: contexts,
        onclick: (info, tab) => {
            suspendTab(tab, true);
        }
    });
    makeContextMenu({
        type: 'separator',
        contexts: contexts,
    });
    makeContextMenu({
        title: "Suspend this window",
        contexts: contexts,
        onclick: (info, tab) => {
            suspendWindow(tab.windowId);
        }
    });
    makeContextMenu({
        title: "Unsuspend this window",
        contexts: contexts,
        onclick: (info, tab) => {
            unsuspendWindow(tab.windowId);
        }
    });
    makeContextMenu({
        type: 'separator',
        contexts: contexts,
    });
    makeContextMenu({
        title: "Never suspend this site",
        contexts: contexts,
        onclick: (info, tab) => {
            addThisSiteToWhitelist();
        }
    });
    makeContextMenu({
        type: 'separator',
        contexts: contexts,
    });
    makeContextMenu({
        title: "Debug Tabs",
        contexts: contexts,
        onclick: (info, tab) => {
            onContextMenuDebugTabs();
        }
    });
    makeContextMenu({
        title: "Discard Data URI Tabs",
        contexts: contexts,
        onclick: (info, tab) => {
            onContextMenuDiscardDataUriTabs();
        }
    });
    makeContextMenu({
        title: "Suspend via H2C",
        contexts: contexts,
        onclick: (info, tab) => {
            suspendTab(tab, false);
        }
    });
}

function makeContextMenu(params) {
    return chrome.contextMenus.create(params);
}