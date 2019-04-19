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
        .export(onContextMenuDebugTabs);

    const console = chrome.extension.getBackgroundPage().console; // really needed?

    const urls = {
        parkHtml: chrome.runtime.getURL('web/park.html'),
        parkCss: chrome.runtime.getURL('web/park.css'),
        parkFrame: chrome.runtime.getURL('web/park-frame.html'),
        parkJs: chrome.runtime.getURL('web/park.js'),
        tempParkPage: chrome.runtime.getURL('/park.html'),
        optionsHtml: chrome.runtime.getURL('/options.html'),
    };

    ns.urls = urls;

    ns.prefetchResources();
    ns.initOptions();
    ns.initMenus();
    ns.initWebRequestListeners();
    ns.initTabListeners();
    ns.initTabWatchTimer();
    initMessageListener();
    ns.inspectExistingTabs();
    ns.initCommandListener();

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
                chrome.tabs.get(tab.id, (chrTab) => {
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
                chrome.tabs.discard(tab.id, function (resTab) {
                    console.log("discarded tab", resTab);
                });
            }
        }
    }

    function initMessageListener() {
        chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
            if (msg.message === CommonUtils.MESSAGE_SCREENSHOT_READY) {
                ns.suspendTabPhase2(msg.screenshotId, msg.tabId, msg.tabUrl, msg.htmlDataUri, msg.imageDataUri, false);
            }
        });
    }

}());