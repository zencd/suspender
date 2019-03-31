"use strict";

const MESSAGE_LOG = 'MESSAGE_LOG';
const MESSAGE_SHOW_PARK = 'MESSAGE_SHOW_PARK';

if (typeof String.prototype.replaceAll === 'undefined') {
    String.prototype.replaceAll = function (search, replacement) {
        return this.split(search).join(replacement);
    };
}

function logToCurrentTab() {
    const logArgs = arguments;
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const msg = {message: MESSAGE_LOG, arguments: logArgs};
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
            });
        }
    });
}

function getSuspendedPageContent(tabId, pageUrl, pageTitle, callback) {
    const tplUrl = chrome.runtime.getURL('iframed.html');
    const cssUrl = chrome.runtime.getURL('iframed.css');
    const iframeUrl = chrome.runtime.getURL('iframe.html') + '?tabId=' + tabId;
    console.log("tplUrl", tplUrl);
    fetch(tplUrl).then((response) => {
        response.text().then((htmlTplStr) => {
            // console.log("htmlTplStr bytes", htmlTplStr.length);
            let tplVars = {
                '$TITLE$': pageTitle,
                '$LINK_URL$': pageUrl,
                '$LINK_TEXT$': toReadableUrl(pageUrl),
                '$IFRAME_URL$': iframeUrl,
                '$CSS_URL$': cssUrl,
            };
            console.log("tplVars", tplVars);
            const htmlStr = expandStringTemplate(htmlTplStr, tplVars);
            // console.log("htmlStr:", htmlStr);
            const b64 = b64EncodeUnicode(htmlStr);
            const dataUri = 'data:text/html;base64,' + b64;
            console.log("dataUri", dataUri);
            callback(dataUri);
            // document.location.href = dataUri;
        });
    });
}

function b64EncodeUnicode(str) {
    // https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
}

function expandStringTemplate(tplContent, vars) {
    let res = tplContent;
    for (let key in vars) {
        if (vars.hasOwnProperty(key)) {
            console.log("res", typeof res);
            res = res.replaceAll(key, vars[key]);
        }
    }
    return res;
}

function cutFromBeginning(inp, pattern) {
    if (!inp) {
        return inp;
    }
    return inp.startsWith(pattern) ? inp.substring(pattern.length) : inp;
}

function cutFromEnd(inp, pattern) {
    if (!inp) {
        return inp;
    }
    return inp.endsWith(pattern) ? inp.substring(0, inp.length - pattern.length) : inp;
}

function toReadableUrl(s) {
    s = cutFromBeginning(s, 'http://');
    s = cutFromBeginning(s, 'https://');
    s = cutFromBeginning(s, 'www.');
    return cutFromEnd(s, '/');
}

function TabList() {
    this.tabById = {}; // tab id => Tab object
    this.currentTabs = {}; // window id => tab id
    return this;
}

TabList.prototype = {
    get: function (tabId) {
        let tab = this.tabById[tabId];
        if (!tab) {
            tab = new Tab(tabId);
            this.tabById[tabId] = tab;
        }
        // console.log("get returning", tab);
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
};

function Tab(tabId) {
    this.tabId = tabId;
    this.lastSeen = null;
    this.active = false;
    this.suspended = false;
    return this;
}

Tab.prototype = {
};