(() => {
    "use strict";

    const ns = Utils.getNS()
        .export(getTabs)
        .export(inspectExistingTabs)
        .export(getCurrentTab)
        .export(initTabListeners);

    const cs0 = chrome.runtime.getManifest().content_scripts[0];
    const CONTENT_SCRIPTS = cs0.js;
    const CONTENT_SCRIPTS_RUN_AT = cs0.run_at;

    const tabs = new TabList();

    let currentTab = null;

    function getTabs() {
        return tabs;
    }

    function getCurrentTab() {
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

        chrome.windows.getAll({'populate': true}, function (windows) {
            for (let i in windows) {
                if (windows.hasOwnProperty(i)) {
                    const window = windows[i];
                    // console.log("window", window);
                    inspectWindow(window);
                }
            }
        });
    }

    function injectContentScriptIntoTab(chrTab) {
        if (CommonUtils.isUrlSuspendable(chrTab.url)) {
            console.log("injecting into", chrTab.url);
            Utils.injectScriptsIntoTab(chrTab.id, CONTENT_SCRIPTS_RUN_AT, CONTENT_SCRIPTS);
        }
    }

    function initTabListeners() {
        chrome.tabs.onActivated.addListener(function (activeInfo) {
            // Fires when the active tab in a window changes.
            // https://developer.chrome.com/extensions/tabs#event-onActivated
            // logToCurrentTab("tab activated", activeInfo.windowId, activeInfo.tabId);
            const myTab = tabs.getTab(activeInfo.tabId); // nullable
            tabs.tabActivated(activeInfo.windowId, activeInfo.tabId);
            currentTab = myTab;
            console.log("onActivated", "wid", activeInfo.windowId, "id", activeInfo.tabId, 'tab', myTab);
        });
        chrome.tabs.onAttached.addListener(function (tabId, attachInfo) {
            // Fired when a tab is attached to a window
            console.log("onAttached:", tabId, attachInfo);
        });
        chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
            // Fired when a tab is detached from a window
            console.log("onDetached", tabId, detachInfo);
        });
        chrome.tabs.onCreated.addListener(function (tab) {
            // Fired when a tab is created. Note that the tab's URL may not be set at the time this event is fired,
            // but you can listen to onUpdated events so as to be notified when a URL is set.
            console.log("onCreated", tab);
            const myTab = tabs.getOrCreateTab(tab.id);
            myTab.updateFromChromeTab(tab);
        });
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            // Fired when a tab is updated.
            console.log("onUpdated", tabId, changeInfo, tab);
            const myTab = tabs.getOrCreateTab(tabId);
            myTab.updateFromChromeTab(tab);
            // console.log("onUpdated: myTab after all", myTab);
        });
        chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
            // Fired when a tab is replaced with another tab due to prerendering or instant.
            console.log("onReplaced", "addedTabId", addedTabId, "removedTabId", removedTabId);
            tabs.removeById(removedTabId);
        });
        chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
            // Fired when a tab is closed.
            console.log("onRemoved", tabId, removeInfo);
            tabs.removeById(tabId);
        });
    }

})();