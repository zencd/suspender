(function () {
    "use strict";

    const console = chrome.extension.getBackgroundPage().console;

    const tabIdToSuspend = {};
    const tabDataUriToSuspend = {};

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

    // const tt = tabs.getAllTabs();
    // console.log("tt", tt.length);
    // for (let i = 0; i < tt.length; i++) {
    //     const tabObj = tt[i];
    //     chrome.tabs.executeScript(tabObj.id, {file: "content.js"});
    //     console.log("tab injected", tabObj);
    // }
    // setInterval(findAllTabsAndMessageThem, 10 * 1000);

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

    function findAllTabsAndMessageThem() {
        const now = new Date();
        const tt = tabs.getAllTabs();
        for (let i = 0; i < tt.length; i++) {
            const tabObj = tt[i];
            if (isUrlSuspendable(tabObj.url)) {
                const msg = {message: 'HELLO'};
                console.log("sending HELLO to", tabObj.id, tabObj.url);
                chrome.tabs.sendMessage(tabObj.id, msg, function (response) {
                });
            }
        }
    }

    function initTabWatchTimer() {
        setInterval(findOldTabsAndSuspendThem, OLD_TAB_CHECK_INTERVAL_SECONDS);
        // setTimeout(findOldTabsAndSuspendThem, 9000); // temp
    }

    function initWebRequestListeners() {
        chrome.webRequest.onBeforeRequest.addListener(function (details) {
                // details: frameId: 0, method: "GET", parentFrameId: -1, requestId: "177149", tabId: 3320, timeStamp: 1553804074191.074, type: "main_frame", url: "https://github.com/zencd/charted"
                const tabId = details.tabId;
                const theKey = '' + tabId + '.' + details.url;
                if (tabIdToSuspend[theKey]) {
                    logToCurrentTab("tabIdToSuspend[theKey]", tabIdToSuspend[theKey]);
                    logToCurrentTab("tabId", tabId);
                    logToCurrentTab("details", details);
                    // logToCurrentTab("details", details);
                    // console.log("details", details);
                    const dataUri = tabDataUriToSuspend[theKey];
                    if (dataUri) {
                        tabIdToSuspend[theKey] = false;
                        tabDataUriToSuspend[theKey] = null;
                        tabs.get(tabId).suspended = true;
                        return {redirectUrl: dataUri};
                    }
                }
                return {};
            },
            {urls: ["http://*/*", "https://*/*"]},
            ["blocking"]
        );
    }

    function inspectExistingTabs() {
        chrome.tabs.getAllInWindow(null, function (chromeTabs) {
            for (let i = 0; i < chromeTabs.length; i++) {
                const chrTab = chromeTabs[i];
                const myTab = tabs.get(chrTab.id);
                myTab.updateFromChromeTab(chrTab);
                injectContentScriptIntoTab(chrTab);
            }
        });
    }

    function injectContentScriptIntoTab(chrTab) {
        if (isUrlSuspendable(chrTab.url)) {
            // console.log("injecting into", chrTab);
            chrome.tabs.executeScript(chrTab.id, {
                file: "html2canvas.js",
                runAt: "document_start"
            }, function (injectResult1) {
                chrome.tabs.executeScript(chrTab.id, {
                    file: "utils.js",
                    runAt: "document_start"
                }, function (injectResult2) {
                    chrome.tabs.executeScript(chrTab.id, {
                        file: "common.js",
                        runAt: "document_start"
                    }, function (injectResult3) {
                        chrome.tabs.executeScript(chrTab.id, {
                            file: "content.js",
                            runAt: "document_start"
                        }, function (injectResult4) {
                        });
                    });
                });
            });
        }
    }

    function initTabListeners() {
        chrome.tabs.onActivated.addListener(function (activeInfo) {
            // Fires when the active tab in a window changes.
            // https://developer.chrome.com/extensions/tabs#event-onActivated
            // logToCurrentTab("tab activated", activeInfo.windowId, activeInfo.tabId);
            tabs.tabActivated(activeInfo.windowId, activeInfo.tabId);
            chrome.tabs.get(activeInfo.tabId, function (tab) {
                console.log("onActivated", "wid", activeInfo.windowId, "id", activeInfo.tabId, tab.url);
            });
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
            const myTab = tabs.get(tab.id);
            myTab.updateFromChromeTab(tab);
        });
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            // Fired when a tab is updated.
            console.log("onUpdated", tabId, changeInfo, tab);
            const myTab = tabs.get(tabId);
            myTab.updateFromChromeTab(changeInfo);
        });
        chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
            // Fired when a tab is replaced with another tab due to prerendering or instant.
            console.log("onReplaced", "addedTabId", addedTabId, "removedTabId", removedTabId);
        });
        chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
            // Fired when a tab is closed.
            console.log("onRemoved", tabId, removeInfo);
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
            logToCurrentTab("data saved");
            // logToCurrentTab("imageDataUri", imageDataUri);
            const theKey = '' + tabId + '.' + tabUrl;
            tabIdToSuspend[theKey] = true;
            tabDataUriToSuspend[theKey] = htmlDataUri;
            console.log("reloading", tabUrl);
            chrome.tabs.reload(tabId, {bypassCache: false});
        });
    }

    function onContextMenuSuspendCurrentTab(info, tab) {
        suspendTab(tab, true);
    }

    function onContextMenuSuspendAllTabs(info, tab) {
        findOldTabsAndSuspendThem();
    }

    function initContextMenu() {
        chrome.contextMenus.create({
            title: "Suspend",
            contexts: ["page"],
            onclick: onContextMenuSuspendCurrentTab
        });
        chrome.contextMenus.create({
            title: "Suspend Old Tabs",
            contexts: ["page"],
            onclick: onContextMenuSuspendAllTabs
        });
    }

    function initMessageListener() {
        chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
            if (msg.message === MESSAGE_SCREENSHOT_READY) {
                console.log("screenshot is ready!!!", msg);
                suspendTabPhase2(msg.tabId, msg.tabUrl, msg.htmlDataUri, msg.imageDataUri);
            }
        });
    }
}());