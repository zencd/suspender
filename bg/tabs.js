"use strict";

import {Utils} from '../lib/Utils.js';
import {BtsUtils} from './BtsUtils.js';
import {TabList} from '../lib/TabList.js';

const tabs = new TabList();

let currentTab = null;

const csInfo = parseContentScriptManifest();

initTabsAspect();

function initTabsAspect() {
    initTabListeners();
    inspectExistingTabs();
}

export function getTabs() {
    return tabs;
}

export function getCurrentTab() {
    return currentTab;
}

function inspectExistingTabs() {
    function inspectWindow(window) {
        const chromeTabs = window.tabs;
        for (let i = 0; i < chromeTabs.length; i++) {
            const chrTab = chromeTabs[i];
            const myTab = tabs.getOrCreateTab(chrTab.id);
            myTab.updateFromChromeTab(chrTab);
            if (chrTab.active === true) {
                tabs.currentTabs[chrTab.windowId] = chrTab.id;
            }
            if (window.focused && chrTab.active) {
                currentTab = myTab;
            }
            injectContentScriptIntoTab(chrTab);
        }
    }

    Utils.iteratePopulatedWindows(inspectWindow);
}

function injectContentScriptIntoTab(tab) {
    if (BtsUtils.isUrlSuspendable(tab.url)) {
        console.debug("injecting CS into existing tab", tab.url);
        Utils.injectScriptsIntoTab(tab.id, csInfo.runAt, csInfo.files);
    }
}

function parseContentScriptManifest() {
    const css = chrome.runtime.getManifest().content_scripts;
    if (css.length !== 1) {
        console.warn("expecting a single content script entry in manifest.json");
    }
    const cs = css[0];
    return {
        files: cs.js,
        runAt: cs.run_at,
    }
}

export function discardDataUriTabs() {
    const tt = getTabs().getAllTabs();
    for (let i = 0; i < tt.length; i++) {
        const tab = tt[i];
        if (Utils.isDataUri(tab.url)) {
            chrome.tabs.discard(tab.id, function (resTab) {
                console.log("discarded tab", resTab);
            });
        }
    }
}

function initTabListeners() {

    chrome.windows.onFocusChanged.addListener(function (windowId) {
        // todo handle it
        // handleWindowFocusChanged(windowId);
    });

    chrome.tabs.onActivated.addListener(function (activeInfo) {
        // Fires when the active tab in a window changes.
        // https://developer.chrome.com/extensions/tabs#event-onActivated
        // logToCurrentTab("tab activated", activeInfo.windowId, activeInfo.tabId);
        const myTab = tabs.getTab(activeInfo.tabId); // nullable
        tabs.tabActivated(activeInfo.windowId, activeInfo.tabId);
        currentTab = myTab;
        console.debug("onActivated", "wid", activeInfo.windowId, "id", activeInfo.tabId, 'tab', myTab);
    });
    chrome.tabs.onAttached.addListener(function (tabId, attachInfo) {
        // Fired when a tab is attached to a window
        console.debug("onAttached:", tabId, attachInfo);
    });
    chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
        // Fired when a tab is detached from a window
        console.debug("onDetached", tabId, detachInfo);
    });
    chrome.tabs.onCreated.addListener(function (tab) {
        // Fired when a tab is created. Note that the tab's URL may not be set at the time this event is fired,
        // but you can listen to onUpdated events so as to be notified when a URL is set.
        console.debug("onCreated", tab);
        const myTab = tabs.getOrCreateTab(tab.id);
        myTab.updateFromChromeTab(tab);
    });
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        // Fired when a tab is updated.
        console.debug("onUpdated", tabId, changeInfo, tab);
        const myTab = tabs.getOrCreateTab(tabId);

        const theUrl = tab.url;
        if (myTab.suspended && Utils.isBase64Url(theUrl)) {
            console.debug("deleting Url", theUrl);
            chrome.history.deleteUrl({url: theUrl});
        }

        myTab.updateFromChromeTab(tab);
    });
    chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
        // Fired when a tab is replaced with another tab due to prerendering or instant.
        console.debug("onReplaced", "addedTabId", addedTabId, "removedTabId", removedTabId);
        tabs.removeById(removedTabId);
    });
    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
        // Fired when a tab is closed.
        console.debug("onRemoved", tabId, removeInfo);
        tabs.removeById(tabId);
    });
}