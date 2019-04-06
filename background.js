(function () {
    "use strict";

    const console = chrome.extension.getBackgroundPage().console;

    const parkPageUrl = chrome.runtime.getURL('/park.html'); // like chrome-extension://ID/park.html

    const suspensionMap = {};

    const tabs = new TabList();

    const OLD_TAB_CHECK_INTERVAL_SECONDS = 60 * 1000;

    const settings = {
        suspendTimeoutSeconds: 15 * 60,
        // suspendTimeoutSeconds: 4,
        suspendActive: false,
        suspendPinned: false,
    };

    initContextMenu();
    initWebRequestListeners();
    initTabListeners();
    initTabWatchTimer();
    initMessageListener();
    inspectExistingTabs();

    function findOldTabsAndSuspendThem() {
        const now = new Date();
        const tt = tabs.getAllTabs();
        for (let i = 0; i < tt.length; i++) {
            const tabObj = tt[i];
            const diffSec = (now - tabObj.lastSeen) / 1000;
            const timeoutOk = tabObj.lastSeen && diffSec >= settings.suspendTimeoutSeconds;
            const activeTabOk = settings.suspendActive || (!settings.suspendActive && !tabObj.active);
            const schemaOk = isUrlSuspendable(tabObj.url);
            const pinnedOk = settings.suspendPinned || (!settings.suspendPinned && !tabObj.pinned);
            const doSuspend = timeoutOk && activeTabOk && !tabObj.suspended && schemaOk && pinnedOk;
            // const doSuspend = (tabObj.url === 'https://zencd.github.io/charted/');
            // console.log("tab", tabObj.url, "suspending?", doSuspend);
            if (doSuspend) {
                console.log("suspending tab", tabObj);
                suspendTab(tabObj, false);
            }
        }
    }

    function initTabWatchTimer() {
        setInterval(findOldTabsAndSuspendThem, OLD_TAB_CHECK_INTERVAL_SECONDS);
        // setTimeout(findOldTabsAndSuspendThem, 9000); // temp
    }

    function initWebRequestListeners() {
        const urlPattern = parkPageUrl + '*';
        chrome.webRequest.onBeforeRequest.addListener(function (details) {
                const suspensionInfo = suspensionMap[details.url];
                if (suspensionInfo) {
                    const dataUri = suspensionInfo.htmlDataUri;
                    const tabId = suspensionInfo.tabId;
                    if (dataUri) {
                        delete suspensionMap[details.url];
                        const myTab = tabs.getTab(tabId);
                        if (myTab) {
                            myTab.suspended = true;
                        }
                        return {redirectUrl: dataUri};
                    }
                }
                return {};
            },
            {urls: [urlPattern]},
            ["blocking"]
        );
    }

    function inspectExistingTabs() {
        chrome.tabs.getAllInWindow(null, function (chromeTabs) {
            for (let i = 0; i < chromeTabs.length; i++) {
                const chrTab = chromeTabs[i];
                // console.log("chrTab", chrTab);
                const myTab = tabs.getOrCreateTab(chrTab.id);
                myTab.updateFromChromeTab(chrTab);
                if (chrTab.active === true) {
                    tabs.currentTabs[chrTab.windowId] = chrTab.id;
                }
                injectContentScriptIntoTab(chrTab);
            }
            // console.log("tabs.currentTabs", tabs.currentTabs);
        });
    }

    function injectContentScriptIntoTab(chrTab) {
        if (isUrlSuspendable(chrTab.url)) {
            console.log("injecting into", chrTab.url);
            const runAt = "document_start";
            const jsFiles = ["html2canvas.js", "utils.js", "common.js", "content.js"];
            injectScriptsIntoTab(chrTab.id, runAt, jsFiles);
        }
    }

    function initTabListeners() {
        chrome.tabs.onActivated.addListener(function (activeInfo) {
            // Fires when the active tab in a window changes.
            // https://developer.chrome.com/extensions/tabs#event-onActivated
            // logToCurrentTab("tab activated", activeInfo.windowId, activeInfo.tabId);
            const tab = tabs.getTab(activeInfo.tabId);
            tabs.tabActivated(activeInfo.windowId, activeInfo.tabId);
            console.log("onActivated", "wid", activeInfo.windowId, "id", activeInfo.tabId, tab.url);
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

    function suspendTab(tab, isActiveTab) {
        console.log("suspendTab", tab);
        if (!isUrlSuspendable(tab.url)) {
            return;
        }
        console.log("gonna reload", tab);
        getSuspendedPageContent(tab.id, tab.url, tab.title, function (htmlDataUri) {
            // console.log("htmlDataUri", htmlDataUri);
            if (isActiveTab) {
                // todo use windowId
                chrome.tabs.captureVisibleTab(null, {}, function (imageDataUri) {
                    suspendTabPhase2(tab.id, tab.url, htmlDataUri, imageDataUri);
                });
            } else {
                const tabId = tab.id;
                // console.log("tabId", tabId);
                const msg = {
                    message: MESSAGE_TAKE_SCREENSHOT,
                    htmlDataUri: htmlDataUri,
                    tabId: tabId,
                    tabUrl: tab.url,
                };
                console.log("sending message", tabId, msg);
                chrome.tabs.sendMessage(tabId, msg, function (response) {
                    // console.log("response from CS:", response);
                });
            }
        });

    }

    function suspendTabPhase2(tabId, tabUrl, htmlDataUri, imageDataUri) {
        const storageKey = 'screenshot.data-uri.tab.' + tabId;
        chrome.storage.local.set({[storageKey]: imageDataUri}, function () {
            const unixTime = new Date() - 0;
            const redirUrl = parkPageUrl + '?uniq=' + unixTime;
            console.log("redirUrl", redirUrl);
            suspensionMap[redirUrl] = {
                tabId: tabId,
                htmlDataUri: htmlDataUri,
                unixTime: unixTime,
            };
            chrome.tabs.update(tabId, {url: redirUrl});
        });
    }

    function onContextMenuDebugTabs() {
        const tt = tabs.getAllTabs();
        console.log("===== DEBUG " + tt.length + " TABS =====");
        for (let i = 0; i < tt.length; i++) {
            const tab = tt[i];
            const ls = Math.floor((new Date() - tab.lastSeen) / 1000);
            console.log("" + (i + 1) + ".", tab.id, limit(tab.url, 60));
            console.log(" ", (tab.suspended ? 'S' : '_'), (tab.active ? 'A' : '_'), (tab.pinned ? 'P' : '_'), (tab.audible ? 'Au' : '_'), ls, "s");
            if (!tab.url) {
                chrome.tabs.get(tab.id, (chrTab) => {
                    console.log("BAD TAB", chrTab);
                });
            }
        }
    }

    function initContextMenu() {
        const contexts = [
            // todo review them
            'page', 'frame', 'editable', 'image', 'video', 'audio',
        ];
        chrome.contextMenus.create({
            title: "Suspend",
            contexts: contexts,
            onclick: (info, tab) => {
                suspendTab(tab, true);
            }
        });
        chrome.contextMenus.create({
            title: "Suspend H2C",
            contexts: contexts,
            onclick: (info, tab) => {
                suspendTab(tab, false);
            }
        });
        chrome.contextMenus.create({
            title: "Suspend Old Tabs",
            contexts: contexts,
            onclick: (info, tab) => {
                findOldTabsAndSuspendThem();
            }
        });
        chrome.contextMenus.create({
            type: 'separator',
            contexts: contexts,
        });
        chrome.contextMenus.create({
            title: "Debug Tabs",
            contexts: contexts,
            onclick: (info, tab) => {
                onContextMenuDebugTabs();
            }
        });
    }

    function initMessageListener() {
        chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
            // console.log("BG: incoming msg", msg);
            if (msg.message === MESSAGE_SCREENSHOT_READY) {
                // console.log("screenshot is ready!!!", msg);
                suspendTabPhase2(msg.tabId, msg.tabUrl, msg.htmlDataUri, msg.imageDataUri);
            }
        });
    }

    function injectScriptsIntoTab(tabId, runAt, files) {
        if (files.length <= 0) {
            return;
        }
        let cur = 0;

        function inject_one() {
            if (cur <= files.length - 1) {
                chrome.tabs.executeScript(tabId, {
                    file: files[cur],
                    runAt: runAt
                }, (injectResult) => {
                    // console.log("file injected", js_files[current_js_file], injectResult);
                    cur++;
                    inject_one();
                });
            }
        }

        inject_one();
    }

}());