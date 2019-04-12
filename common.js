"use strict";

const MESSAGE_TAKE_SCREENSHOT = 'MESSAGE_TAKE_SCREENSHOT';
const MESSAGE_SCREENSHOT_READY = 'MESSAGE_SCREENSHOT_READY';

function isUrlSuspendable(url) {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
}

function scaleDownRetinaImage(scaleDown, origDataUri, onload) {
    const dpr = window.devicePixelRatio;
    if (dpr === 1 || !scaleDown) {
        return onload(origDataUri);
    }

    const $canvas = document.createElement('canvas');
    document.body.appendChild($canvas);
    const ctx = $canvas.getContext('2d');
    const img = new window.Image();
    img.onload = function () {
        const w2 = img.width / dpr;
        const h2 = img.height / dpr;
        console.log("img", img.width, 'x', img.height);
        $canvas.width = w2;
        $canvas.height = h2;
        // ctx.globalAlpha = 0.5;
        ctx.drawImage(img, 0, 0, w2, h2);
        const dataUri = $canvas.toDataURL("image/png");
        console.log("final dataUri", dataUri.length);
        console.log("final dataUri", dataUri);
        onload(dataUri);
    };
    img.src = origDataUri;
}

function loadAndProcessFavicon(favIconUrl, onload) {
    const $canvas = document.createElement('canvas');
    // document.body.appendChild($iconCanvas);
    const ctx = $canvas.getContext('2d');
    const img = new window.Image();
    img.onload = function () {
        console.log("img", img.width, 'x', img.height);
        $canvas.width = img.width;
        $canvas.height = img.height;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(img, 0, 0);
        const dataUri = $canvas.toDataURL("image/png");
        onload(dataUri);
    };
    img.src = favIconUrl;
}

/**
 * converts 'https://mail.google.com/mail/u/0/#inbox'
 * into 'chrome://favicon/https://mail.google.com/'
 * @param url
 * @returns {string}
 */
function getChromeFaviconUrl(url) {
    const i = url.indexOf('/', 8);
    url = (i >= 0) ? url.substring(0, i + 1) : url;
    console.log("tmp", url);
    return 'chrome://favicon/' + url
}

function getSuspendedPageContent(tabId, pageUrl, pageTitle, callback) {
    const tplUrl = chrome.runtime.getURL('park.html');
    const cssUrl = chrome.runtime.getURL('park.css');
    const iframeUrl = chrome.runtime.getURL('park-frame.html');
    const faviconUrl = getChromeFaviconUrl(pageUrl);
    // console.log("tplUrl", tplUrl);
    fetch(tplUrl).then((response) => { // todo fetch it once
        response.text().then((htmlTplStr) => {
            loadAndProcessFavicon(faviconUrl, function (faviconDataUri) {
                // console.log("htmlTplStr bytes", htmlTplStr.length);
                let tplVars = {
                    '$TITLE$': pageTitle,
                    '$LINK_URL$': pageUrl,
                    '$LINK_TEXT$': toReadableUrl(pageUrl),
                    '$IFRAME_URL$': iframeUrl,
                    '$CSS_URL$': cssUrl,
                    '$TAB_ID$': tabId,
                    '$FAVICON_DATA_URI$': faviconDataUri,
                    '$DATE$': formatDateTime(),
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
            // console.log("creating TabHandle on demand", tabId);
            tab = new TabHandle(tabId);
            this.tabById[tabId] = tab;
        }
        return tab;
    },
    tabActivated: function (windowId, curTabId) {
        const prevTabId = this.currentTabs[windowId];
        this.currentTabs[windowId] = curTabId;
        if (prevTabId && prevTabId !== curTabId) {
            const prevTab = this.getTab(prevTabId);
            if (prevTab) {
                // absence of `prevTab` may mean it just has been closed, this is normal
                prevTab.lastSeen = new Date();
                prevTab.active = false;
            }
        }
        const curTab = this.getOrCreateTab(curTabId);
        curTab.active = true;
    },
    getAllTabs: function () {
        return Object.values(this.tabById);
    },
    removeById: function (tabId) {
        delete this.tabById[tabId];
    },
};

function TabHandle(tabId) {
    this.id = tabId; // Chrome's tab id, integer
    this.windowId = null; // Chrome's window id, integer
    this.url = null;
    this.lastSeen = new Date(); // Date
    this.active = false;
    this.suspended = false;
    this.discarded = false;
    this.audible = false;
    this.favIconUrl = null; // string
    this.pinned = false;
    return this;
}

TabHandle.prototype = {
    updateFromChromeTab: function (chromeTab) {
        if (chromeTab.url && chromeTab.url !== this.url) {
            this.suspended = false;
        }
        this.active = chromeTab.active;
        this.discarded = chromeTab.discarded;
        this.audible = chromeTab.audible;
        this.pinned = chromeTab.pinned;
        this.url = chromeTab.url;
        this.title = chromeTab.title;
        this.windowId = chromeTab.windowId;
        this.favIconUrl = chromeTab.favIconUrl;
    },
};

function toMB(bytes) {
    return Math.ceil(bytes / 1024 / 1024);
}
