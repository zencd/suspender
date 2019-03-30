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
        chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
        });
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
                '$LINK_TEXT$': pageUrl,
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