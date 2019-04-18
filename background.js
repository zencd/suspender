var bgExt = {};

(function () {
    "use strict";

    const console = chrome.extension.getBackgroundPage().console; // really needed?

    const cs0 = chrome.runtime.getManifest().content_scripts[0];
    const CONTENT_SCRIPTS = cs0.js;
    const CONTENT_SCRIPTS_RUN_AT = cs0.run_at;

    const suspensionMap = {};

    const tabs = new TabList();

    const OLD_TAB_CHECK_INTERVAL_MILLIS = 64 * 1000;

    const options = new Options();

    const urls = {
        parkHtml: chrome.runtime.getURL('web/park.html'),
        parkCss: chrome.runtime.getURL('web/park.css'),
        parkFrame: chrome.runtime.getURL('web/park-frame.html'),
        parkJs: chrome.runtime.getURL('web/park.js'),
        tempParkPage: chrome.runtime.getURL('/park.html'),
        optionsHtml: chrome.runtime.getURL('/options.html'),
    };

    bgExt.urls = urls;

    let gParkHtmlText = ''; // content fetched from `gParkHtmlUrl`
    let gParkCssText = ''; // content fetched from `gParkCssUrl`

    prefetchResources();
    loadOptions();
    initOptionsListener();
    initContextMenu();
    initWebRequestListeners();
    initTabListeners();
    initTabWatchTimer();
    initMessageListener();
    inspectExistingTabs();
    initCommandListener();

    function initCommandListener() {
        chrome.commands.onCommand.addListener((command) => {
            console.log("command", command, typeof command);
            if (command === '1-suspend-tab') {
                Utils.getCurrentTabFromBackgroundScript((chrTab) => {
                    suspendTab(chrTab, true);
                });
            }
        });
    }

    function prefetchResources() {
        function prefetchParkPageHtml() {
            fetch(urls.parkHtml).then((response) => {
                response.text().then((text) => {
                    gParkHtmlText = Utils.stripCrLf(text).trim();
                });
            });
        }

        function prefetchParkPageCss() {
            fetch(urls.parkCss).then((response) => {
                response.text().then((text) => {
                    gParkCssText = Utils.stripCrLf(text).trim();
                });
            });
        }

        prefetchParkPageHtml();
        prefetchParkPageCss();
    }

    function loadOptions() {
        options.load(function () {
            console.log("options loaded from storage", options);
        });
    }

    function initOptionsListener() {
        chrome.storage.onChanged.addListener(function (changes, areaName) {
            options.processChanges(changes, areaName);
        });
    }

    function findOldTabsAndSuspendThem() {
        const now = new Date();
        const tt = tabs.getAllTabs();
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
                suspendTab(tabObj, false);
            }
        }
    }

    function suspendWindow(windowId) {
        // todo start iterating my tab objects, not chrome's
        console.log("suspendAll");
    }

    function unsuspendWindow(windowId) {
        // todo start iterating my tab objects, not chrome's
        chrome.windows.get(windowId, {'populate': true}, function (window) {
            for (let i in window.tabs) {
                if (window.tabs.hasOwnProperty(i)) {
                    // todo check the url is suitable first
                    const chrTab = window.tabs[i];
                    unsuspendTab(chrTab);
                }
            }
        });
    }

    function suspendCurrentWindow() {
        console.log("suspendCurrentWindow...");
        Utils.getCurrentWindowIdFromBackgroundScript(function (windowId) {
            suspendWindow(windowId)
        });
    }

    function unsuspendCurrentWindow() {
        console.log("unsuspendCurrentWindow...");
        Utils.getCurrentWindowIdFromBackgroundScript(function (windowId) {
            unsuspendWindow(windowId)
        });
    }

    function suspendCurrentTab() {
        console.log("unsuspendCurrentTab 1");
        Utils.getCurrentTabFromBackgroundScript((chtTab)=>{
            console.log("unsuspendCurrentTab 2", chtTab);
            suspendTab(chtTab);
        });
    }

    bgExt.suspendCurrentTab = suspendCurrentTab;
    bgExt.unsuspendCurrentWindow = unsuspendCurrentWindow;
    bgExt.suspendCurrentWindow = suspendCurrentWindow;

    function unsuspendTab(chrTab) {
        const urlHash = Utils.fastIntHash(chrTab.url);
        const storageKey = 'suspended.urlHash=' + urlHash;
        chrome.storage.local.get(storageKey, function (items) {
            const obj = items[storageKey];
            if (obj) {
                chrome.tabs.update(chrTab.id, {url: obj.url});
                const myTab = tabs.getTab(chrTab.id);
                if (myTab) {
                    myTab.lastSeen = new Date();
                }
            }
        });
    }

    function collectTabsFromWindows(windows) {
        const tabz = [];
        for (let wi in windows) {
            if (windows.hasOwnProperty(wi)) {
                for (let i in windows[wi].tabs) {
                    if (windows[wi].tabs.hasOwnProperty(i)) {
                        const chrTab = windows[wi].tabs[i];
                        tabz.push(chrTab);
                    }
                }
            }
        }
        return tabz;
    }

    function addThisSiteToWhitelist() {

    }

    function initTabWatchTimer() {
        setInterval(findOldTabsAndSuspendThem, OLD_TAB_CHECK_INTERVAL_MILLIS);
        // setTimeout(findOldTabsAndSuspendThem, 9000); // temp
    }

    function initWebRequestListeners() {
        const urlPattern = urls.tempParkPage + '*';
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
            {
                urls: [urlPattern],
                types: ["main_frame"],
            },
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
            const tab = tabs.getTab(activeInfo.tabId); // nullable
            tabs.tabActivated(activeInfo.windowId, activeInfo.tabId);
            console.log("onActivated", "wid", activeInfo.windowId, "id", activeInfo.tabId, 'tab', tab);
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
        if (!CommonUtils.isUrlSuspendable(tab.url)) {
            return;
        }
        console.log("gonna reload", tab);
        chrome.tabs.sendMessage(tab.id, {message: CommonUtils.MESSAGE_GET_DOCUMENT_BG_COLOR}, function (bgResp) {
            const screenshotId = Utils.uidString();
            getSuspendedPageContent(screenshotId, tab.url, tab.title, bgResp.backgroundColor, function (htmlDataUri) {
                if (isActiveTab) {
                    // todo use windowId
                    const opts = {format: "png"}; // also "jpeg"
                    chrome.tabs.captureVisibleTab(null, opts, function (imageDataUri) {
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

    function getSuspendedPageContent(screenshotId, pageUrl, pageTitle, bgColor, callback) {
        const bgRgb = Utils.parseRgb(bgColor);
        const bgDarkenRgb = Utils.alterBrightness(bgRgb, -0.75);
        const bgDarkenStr = bgDarkenRgb.join(',');

        const faviconUrl = CommonUtils.getChromeFaviconUrl(pageUrl);
        CommonUtils.loadAndProcessFavicon(faviconUrl, function (faviconDataUri) {
            // console.log("htmlTplStr bytes", htmlTplStr.length);
            let tplVars = {
                '$BG_COLOR$': bgColor,
                '$BG_DARKEN$': bgDarkenStr,
                '$TITLE$': pageTitle,
                '$LINK_URL$': pageUrl,
                '$LINK_TEXT$': Utils.toReadableUrl(pageUrl),
                '$IFRAME_URL$': urls.parkFrame,
                //'$CSS_URL$': '',
                '$CSS_TEXT$': gParkCssText,
                '$SCREENSHOT_ID$': screenshotId,
                '$FAVICON_DATA_URI$': faviconDataUri,
                '$DATE$': Utils.formatHumanReadableDateTime(),
                '$PARK_JS_URL$': urls.parkJs,
            };
            // console.log("tplVars", tplVars);
            const htmlStr = Utils.expandStringTemplate(gParkHtmlText, tplVars);
            // console.log("htmlStr:", htmlStr);
            const b64 = Utils.b64EncodeUnicode(htmlStr);
            const dataUri = 'data:text/html;base64,' + b64;
            // console.log("dataUri", dataUri);
            callback(dataUri);
            // document.location.href = dataUri;
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
                const redirUrl = urls.tempParkPage + '?uniq=' + Utils.getRandomInt();
                suspensionMap[redirUrl] = {
                    tabId: tabId,
                    htmlDataUri: htmlDataUri,
                    date: nowMillis,
                };

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

    function onContextMenuDebugTabs() {
        const tt = tabs.getAllTabs();
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
        const tt = tabs.getAllTabs();
        for (let i = 0; i < tt.length; i++) {
            const tab = tt[i];
            // console.log("tab", tab.url);
            if (tab.url && tab.url.startsWith('data:text/html')) {
                chrome.tabs.discard(tab.id, function (resTab) {
                    console.log("discarded tab", resTab);
                });
            }
        }
    }

    function initContextMenu() {
        chrome.runtime.onInstalled.addListener(function () {
            initContextMenu2();
        });
    }

    function initContextMenu2() {
        const contexts = [
            "page", "frame", "selection", "link", "editable", "image", "video", "audio"
        ];

        const browserActionContexts = ['browser_action'];

        chrome.contextMenus.create({
            title: "Suspend",
            contexts: browserActionContexts,
            onclick: (info, tab) => {
                suspendTab(tab, true);
            }
        });
        chrome.contextMenus.create({
            title: "Suspend this window",
            contexts: browserActionContexts,
            onclick: (info, tab) => {
                suspendWindow(tab.windowId);
            }
        });
        chrome.contextMenus.create({
            title: "Unsuspend this window",
            contexts: browserActionContexts,
            onclick: (info, tab) => {
                unsuspendWindow(tab.windowId);
            }
        });
        chrome.contextMenus.create({
            title: "Never suspend this site",
            contexts: browserActionContexts,
            onclick: (info, tab) => {
            }
        });

        chrome.contextMenus.create({
            title: "Suspend",
            contexts: contexts,
            onclick: (info, tab) => {
                suspendTab(tab, true);
            }
        });
        chrome.contextMenus.create({
            type: 'separator',
            contexts: contexts,
        });
        chrome.contextMenus.create({
            title: "Suspend this window",
            contexts: contexts,
            onclick: (info, tab) => {
                suspendWindow(tab.windowId);
            }
        });
        chrome.contextMenus.create({
            title: "Unsuspend this window",
            contexts: contexts,
            onclick: (info, tab) => {
                unsuspendWindow(tab.windowId);
            }
        });
        chrome.contextMenus.create({
            type: 'separator',
            contexts: contexts,
        });
        chrome.contextMenus.create({
            title: "Never suspend this site",
            contexts: contexts,
            onclick: (info, tab) => {
                addThisSiteToWhitelist();
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
        chrome.contextMenus.create({
            title: "Discard Data URI Tabs",
            contexts: contexts,
            onclick: (info, tab) => {
                onContextMenuDiscardDataUriTabs();
            }
        });
        chrome.contextMenus.create({
            title: "Suspend via H2C",
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
    }

    function initMessageListener() {
        chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
            // console.log("BG: incoming msg", msg);
            if (msg.message === CommonUtils.MESSAGE_SCREENSHOT_READY) {
                // console.log("screenshot is ready!!!", msg);
                suspendTabPhase2(msg.screenshotId, msg.tabId, msg.tabUrl, msg.htmlDataUri, msg.imageDataUri, false);
            }
        });
    }

}());