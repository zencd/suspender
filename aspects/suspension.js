(()=>{
    "use strict";

    const ns = Utils.getNS()
        .export(initTabWatchTimer)
        .export(suspendTab)
        .export(suspendTabPhase2)
        .export(suspendWindow)
        .export(unsuspendWindow)
        .export(suspendCurrentTab)
        .export(suspendCurrentWindow)
        .export(unsuspendCurrentWindow);

    const OLD_TAB_CHECK_INTERVAL_MILLIS = 64 * 1000;

    function initTabWatchTimer() {
        setInterval(findOldTabsAndSuspendThem, OLD_TAB_CHECK_INTERVAL_MILLIS);
        // setTimeout(findOldTabsAndSuspendThem, 9000); // temp
    }

    function findOldTabsAndSuspendThem() {
        const options = ns.getOptions();
        const now = new Date();
        const tt = ns.getTabs().getAllTabs();
        for (let i = 0; i < tt.length; i++) {
            const tab = tt[i];
            const diffSec = (now - tab.lastSeen) / 1000;
            const timeoutOk = tab.lastSeen && diffSec >= options.suspendTimeout;
            const schemaOk = CommonUtils.isUrlSuspendable(tab.url);
            const activeTabOk = options.suspendActive || !tab.active;
            const pinnedOk = options.suspendPinned || !tab.pinned;
            const audibleOk = options.suspendAudible || !tab.audible;
            const doSuspend = timeoutOk && activeTabOk && !tab.suspended && schemaOk && pinnedOk && audibleOk;
            // const doSuspend = (tab.url === 'https://zencd.github.io/charted/');
            // console.log("tab", tab.url, "suspending?", doSuspend);
            if (doSuspend) {
                console.log("suspending tab", tab);
                ns.suspendTab(tab, false);
            }
        }
    }

    function suspendTab(tab, isActiveTab) {
        if (!CommonUtils.isUrlSuspendable(tab.url)) {
            return;
        }
        const t1 = new Date() - 0;
        console.log("suspend 1");
        chrome.tabs.sendMessage(tab.id, {message: CommonUtils.MESSAGE_GET_DOCUMENT_BG_COLOR}, function (bgResp) {
            console.log("suspend 2", new Date() - t1);
            const screenshotId = Utils.uidString();
            getSuspendedPageContent(screenshotId, tab.url, tab.title, bgResp.backgroundColor, function (htmlDataUri) {
                console.log("suspend 3", new Date() - t1);
                if (isActiveTab) {
                    // XXX png takes 3+ MB on retina and 1+ sec time, so should not use it in that case
                    const imageFormat = (window.devicePixelRatio > 1) ? "jpeg" : "png";
                    const opts = {format: imageFormat, quality: 30};
                    chrome.tabs.captureVisibleTab(tab.windowId, opts, function (imageDataUri) {
                        // todo capture screenshot first (move this atop)
                        console.log("suspend 4", new Date() - t1, "chars:" + imageDataUri.length);
                        const scaleDown = isActiveTab;
                        suspendTabPhase2(screenshotId, tab.id, tab.url, htmlDataUri, imageDataUri, scaleDown);
                    });
                } else {
                    const msg = {
                        message: CommonUtils.MESSAGE_TAKE_SCREENSHOT,
                        screenshotId: screenshotId,
                        htmlDataUri: htmlDataUri,
                        tabId: tab.id,
                        tabUrl: tab.url,
                    };
                    console.log("sending message", tab.id, msg);
                    chrome.tabs.sendMessage(tab.id, msg, function (response) {
                        // console.log("response from CS:", response);
                    });
                }
            });
        });
    }

    function unsuspendTab(chrTab) {
        const urlHash = Utils.fastIntHash(chrTab.url);
        const storageKey = 'suspended.urlHash=' + urlHash;
        chrome.storage.local.get(storageKey, function (items) {
            const obj = items[storageKey];
            if (obj) {
                chrome.tabs.update(chrTab.id, {url: obj.url});
                const myTab = ns.getTabs().getTab(chrTab.id);
                if (myTab) {
                    myTab.lastSeen = new Date();
                }
            }
        });
    }

    function getSuspendedPageContent(screenshotId, pageUrl, pageTitle, bgColor, callback) {
        const bgRgb = Utils.parseRgb(bgColor);
        const bgDarkenRgb = Utils.alterBrightness(bgRgb, -0.75);
        const bgDarkenStr = bgDarkenRgb.join(',');

        const faviconUrl = CommonUtils.getChromeFaviconUrl(pageUrl);
        CommonUtils.loadAndProcessFavicon(faviconUrl, function (faviconDataUri) {
            // todo do replace more effectively, probably via joining a set of strings
            let tplVars = {
                '$BG_COLOR$': bgColor,
                '$BG_DARKEN$': bgDarkenStr,
                '$TITLE$': pageTitle,
                '$LINK_URL$': pageUrl,
                '$LINK_TEXT$': Utils.toReadableUrl(pageUrl),
                '$IFRAME_URL$': ns.urls.parkFrame,
                //'$CSS_URL$': '',
                '$CSS_TEXT$': ns.getParkCssText(),
                '$SCREENSHOT_ID$': screenshotId,
                '$FAVICON_DATA_URI$': faviconDataUri,
                // '$DATE$': Utils.formatHumanReadableDateTime(),
                '$PARK_JS_URL$': ns.urls.parkJs,
            };
            const htmlStr = Utils.expandStringTemplate(ns.getParkHtmlText(), tplVars);
            const b64 = Utils.b64EncodeUnicode(htmlStr);
            const htmlDataUri = 'data:text/html;base64,' + b64;
            callback(htmlDataUri);
        });
    }

    function suspendTabPhase2(screenshotId, tabId, tabUrl, htmlDataUri, imageDataUri, scaleDown) {
        CommonUtils.scaleDownRetinaImage(scaleDown, imageDataUri, function (imageDataUri2) {
            const nowMillis = new Date() - 0; // GMT epoch millis
            const urlHash = Utils.fastIntHash(htmlDataUri);
            const storage = chrome.storage.local;
            const storageItems = {
                ['screenshot.id=' + screenshotId]: {
                    created: nowMillis,
                    urlHash: urlHash,
                    content: imageDataUri2,
                }
            };
            storage.set(storageItems, function () {
                const redirUrl = ns.urls.tempParkPage + '?uniq=' + Utils.getRandomInt();
                ns.addToSuspensionMap(redirUrl, tabId, htmlDataUri, nowMillis);

                chrome.tabs.update(tabId, {url: redirUrl});

                const storageItems2 = {
                    ['suspended.urlHash=' + urlHash]: {
                        screenshotId: screenshotId,
                        created: nowMillis,
                        urlHash: urlHash,
                        url: tabUrl,
                        tabId: tabId,
                    }
                };
                storage.set(storageItems2, function () {
                });
            });
        });
    }

    function suspendWindow(windowId) {
        // todo start iterating my tab objects, not chrome's
    }

    function unsuspendWindow(windowId) {
        // todo start iterating my tab objects, not chrome's
        chrome.windows.get(windowId, {'populate': true}, function (window) {
            const tabs = window.tabs;
            for (let i in tabs) {
                if (tabs.hasOwnProperty(i)) {
                    const chrTab = tabs[i];
                    if (Utils.isDataUri(chrTab.url)) {
                        unsuspendTab(chrTab);
                    }
                }
            }
        });
    }

    function suspendCurrentWindow() {
        Utils.getCurrentWindowIdFromBackgroundScript(function (windowId) {
            suspendWindow(windowId)
        });
    }

    function unsuspendCurrentWindow() {
        Utils.getCurrentWindowIdFromBackgroundScript(function (windowId) {
            unsuspendWindow(windowId)
        });
    }

    function suspendCurrentTab() {
        Utils.getCurrentTabFromBackgroundScript((chtTab)=>{
            suspendTab(chtTab, true);
        });
    }

})();