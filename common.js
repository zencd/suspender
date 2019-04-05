"use strict";

const MESSAGE_TAKE_SCREENSHOT = 'MESSAGE_TAKE_SCREENSHOT';
const MESSAGE_SCREENSHOT_READY = 'MESSAGE_SCREENSHOT_READY';

function isUrlSuspendable(url) {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
}

function getSuspendedPageContent(tabId, pageUrl, pageTitle, callback) {
    const tplUrl = chrome.runtime.getURL('iframed.html');
    const cssUrl = chrome.runtime.getURL('iframed.css');
    const iframeUrl = chrome.runtime.getURL('iframe.html');
    // console.log("tplUrl", tplUrl);
    fetch(tplUrl).then((response) => { // todo fetch it once
        response.text().then((htmlTplStr) => {
            // console.log("htmlTplStr bytes", htmlTplStr.length);
            let tplVars = {
                '$TITLE$': '*' + pageTitle,
                '$LINK_URL$': pageUrl,
                '$LINK_TEXT$': toReadableUrl(pageUrl),
                '$IFRAME_URL$': iframeUrl,
                '$CSS_URL$': cssUrl,
                '$TAB_ID$': tabId,
            };
            // console.log("tplVars", tplVars);
            const htmlStr = expandStringTemplate(htmlTplStr, tplVars);
            // console.log("htmlStr:", htmlStr);
            const b64 = b64EncodeUnicode(htmlStr);
            const dataUri = 'data:text/html;base64,' + b64;
            // console.log("dataUri", dataUri);
            callback(dataUri);
            // document.location.href = dataUri;
        });
    });
}

function TabList() {
    this.tabById = {}; // tab id => TabHandle object
    this.currentTabs = {}; // window id => tab id
    return this;
}

TabList.prototype = {
    getTab: function (tabId) {
        return this.tabById[tabId];
    },
    getOrCreateTab: function (tabId) {
        let tab = this.tabById[tabId];
        if (!tab) {
            tab = new TabHandle(tabId);
            this.tabById[tabId] = tab;
        }
        return tab;
    },
    tabActivated: function (windowId, curTabId) {
        const prevTabId = this.currentTabs[windowId];
        this.currentTabs[windowId] = curTabId;
        if (prevTabId && prevTabId !== curTabId) {
            const prevTab = this.get(prevTabId);
            prevTab.lastSeen = new Date();
            prevTab.active = false;
        }
        const curTab = this.get(curTabId);
        curTab.active = true;
    },
    getAllTabs: function () {
        return Object.values(this.tabById);
    },
    removeById: function(tabId) {
        console.log("this.tabById.length", Object.values(this.tabById).length);
        delete this.tabById[tabId];
        console.log("this.tabById.length", Object.values(this.tabById).length);
    },
};

function TabHandle(tabId) {
    this.id = tabId;
    this.url = null;
    this.lastSeen = new Date(); // Date
    this.active = false;
    this.suspended = false;
    this.audible = false;
    this.favIconUrl = null; // string
    this.pinned = false;
    this.windowId = null;
    return this;
}

TabHandle.prototype = {
    updateFromChromeTab: function (chromeTab) {
        this.active = chromeTab.active;
        this.audible = chromeTab.audible;
        this.pinned = chromeTab.pinned;
        this.url = chromeTab.url;
        this.title = chromeTab.title;
        this.windowId = chromeTab.windowId;
        this.favIconUrl = chromeTab.favIconUrl;
    },
};