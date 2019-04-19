var backgroundScriptBts = {
    // a global object to be accessible from other scripts like `browser_action.js`
    // XXX `var` is mandatory to be accessible
    getNS: function () {
        return Utils.getNS();
    },
};

(function () {
    "use strict";

    const ns = Utils.getNS()
        .export(onContextMenuDiscardDataUriTabs)
        .export(findOldTabsAndSuspendThem)
        .export(addThisSiteToWhitelist)
        .export(onContextMenuDebugTabs);

    const console = chrome.extension.getBackgroundPage().console; // really needed?

    const OLD_TAB_CHECK_INTERVAL_MILLIS = 64 * 1000;

    const options = new Options();

    const urls = {
        parkHtml: ChromeUtils.getURL('web/park.html'),
        parkCss: ChromeUtils.getURL('web/park.css'),
        parkFrame: ChromeUtils.getURL('web/park-frame.html'),
        parkJs: ChromeUtils.getURL('web/park.js'),
        tempParkPage: ChromeUtils.getURL('/park.html'),
        optionsHtml: ChromeUtils.getURL('/options.html'),
    };

    ns.urls = urls;

    ns.prefetchResources();
    initOptions();
    ns.initMenus();
    ns.initWebRequestListeners();
    ns.initTabListeners();
    initTabWatchTimer();
    initMessageListener();
    ns.inspectExistingTabs();
    ns.initCommandListener();

    function initOptions() {
        options.load(function () {
            console.log("options loaded from storage", options);
        });
        ChromeUtils.chromeStorageOnChangedAddListener(function (changes, areaName) {
            options.processChanges(changes, areaName);
        });
    }

    function findOldTabsAndSuspendThem() {
        const now = new Date();
        const tt = ns.getTabs().getAllTabs();
        for (let i = 0; i < tt.length; i++) {
            const tabObj = tt[i];
            const diffSec = (now - tabObj.lastSeen) / 1000;
            const timeoutOk = tabObj.lastSeen && diffSec >= options.suspendTimeout;
            const schemaOk = CommonUtils.isUrlSuspendable(tabObj.url);
            const activeTabOk = options.suspendActive || !tabObj.active;
            const pinnedOk = options.suspendPinned || !tabObj.pinned;
            const audibleOk = options.suspendAudible || !tabObj.audible;
            const doSuspend = timeoutOk && activeTabOk && !tabObj.suspended && schemaOk && pinnedOk && audibleOk;
            // const doSuspend = (tabObj.url === 'https://zencd.github.io/charted/');
            // console.log("tab", tabObj.url, "suspending?", doSuspend);
            if (doSuspend) {
                console.log("suspending tab", tabObj);
                ns.suspendTab(tabObj, false);
            }
        }
    }

    function addThisSiteToWhitelist() {
    }

    function initTabWatchTimer() {
        setInterval(findOldTabsAndSuspendThem, OLD_TAB_CHECK_INTERVAL_MILLIS);
        // setTimeout(findOldTabsAndSuspendThem, 9000); // temp
    }

    function onContextMenuDebugTabs() {
        const tt = ns.getTabs().getAllTabs();
        console.log("===== DEBUG " + tt.length + " TABS =====");
        for (let i = 0; i < tt.length; i++) {
            const tab = tt[i];
            const ls = Math.floor((new Date() - tab.lastSeen) / 1000);
            console.log("" + (i + 1) + ".", tab.id, Utils.limit(tab.url, 60));
            console.log(" ", (tab.suspended ? 'Su' : '_'), (tab.active ? 'Ac' : '_'), (tab.pinned ? 'Pi' : '_'), (tab.audible ? 'Au' : '_'), (tab.discarded ? 'Di' : '_'), ls, "s");
            console.log(" ", tab);
            if (!tab.url) {
                ChromeUtils.chromeTabsGet(tab.id, (chrTab) => {
                    console.warn("BAD TAB", chrTab);
                });
            }
        }
    }

    function onContextMenuDiscardDataUriTabs() {
        console.log("onContextMenuDiscardDataUriTabs");
        const tt = ns.getTabs().getAllTabs();
        for (let i = 0; i < tt.length; i++) {
            const tab = tt[i];
            if (tab.url && Utils.isDataUri(tab.url)) {
                ChromeUtils.chromeTabsDiscard(tab.id, function (resTab) {
                    console.log("discarded tab", resTab);
                });
            }
        }
    }

    function initMessageListener() {
        ChromeUtils.chromeExtensionOnMessageAddListener(function (msg, sender, sendResponse) {
            // console.log("BG: incoming msg", msg);
            if (msg.message === CommonUtils.MESSAGE_SCREENSHOT_READY) {
                // console.log("screenshot is ready!!!", msg);
                ns.suspendTabPhase2(msg.screenshotId, msg.tabId, msg.tabUrl, msg.htmlDataUri, msg.imageDataUri, false);
            }
        });
    }

}());