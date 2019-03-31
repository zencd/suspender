(function () {
    "use strict";

    const console = chrome.extension.getBackgroundPage().console;

    const tabIdToSuspend = {};
    const tabDataUriToSuspend = {};

    const tabs = new TabList();

    const settings = {
        suspendTimeoutSeconds: 60,
        suspendActive: false,
        suspendPinned: false,
    };

    initContextMenu();
    initWebRequestListeners();
    initTabListeners();
    initTabWatchTimer();

    function findOldTabsAndSuspendThem() {
        const now = new Date();
        const tt = tabs.getAllTabs();
        for (let i = 0; i < tt.length; i++) {
            const tabObj = tt[i];
            const diffSec = (now - tabObj.lastSeen) / 1000;
            const timeoutOk = diffSec >= settings.suspendTimeoutSeconds;
            const activeTabOk = settings.suspendActive || !tabObj.active;
            // const pinnedOk = !settings.suspendPinned
            if (timeoutOk && activeTabOk && !tabObj.suspended) {
                console.log("suspending tab", tabObj);
                chrome.tabs.get(tabObj.tabId, function (chrTab) {
                    suspendTab(chrTab);
                });
            }
        }
    }

    function initTabWatchTimer() {
        // setInterval(findOldTabsAndSuspendThem, 60 * 1000);
        // setTimeout(findOldTabsAndSuspendThem, 1000); // temp
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

    function initTabListeners() {
        chrome.tabs.onActivated.addListener(function (activeInfo) {
            // https://developer.chrome.com/extensions/tabs#event-onActivated
            logToCurrentTab("tab activated", activeInfo.windowId, activeInfo.tabId);
            console.log("tab activated", activeInfo.windowId, activeInfo.tabId);
            tabs.tabActivated(activeInfo.windowId, activeInfo.tabId);
        });
    }

    function suspendTab(tab) {
        if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
            const tabId = tab.id;
            logToCurrentTab("gonna reload", tab);
            getSuspendedPageContent(tab.id, tab.url, tab.title, function (htmlDataUri) {
                chrome.tabs.captureVisibleTab(null, {}, function (imageDataUri) {
                    const storageKey = 'screenshot.data-uri.tab.' + tabId;
                    // const storageKey = 'xxx';
                    logToCurrentTab("storageKey", storageKey);
                    logToCurrentTab("imageDataUri", typeof imageDataUri);
                    // logToCurrentTab("imageDataUri", imageDataUri.substring(0, 40));
                    chrome.storage.local.set({[storageKey]: imageDataUri}, function () {
                        logToCurrentTab("data saved");
                        // logToCurrentTab("imageDataUri", imageDataUri);
                        const theKey = '' + tabId + '.' + tab.url;
                        tabIdToSuspend[theKey] = true;
                        tabDataUriToSuspend[theKey] = htmlDataUri;
                        console.log("reloading", tab.url);
                        chrome.tabs.reload(tab.id, {bypassCache: false});
                    });
                });
            });
        }
    }

    function onContextMenuSuspend(info, tab) {
        suspendTab(tab)
    }

    function initContextMenu() {
        chrome.contextMenus.create({
            title: "SUSPENDER",
            contexts: ["page"],
            onclick: onContextMenuSuspend
        });
    }

}());