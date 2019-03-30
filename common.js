"use strict";

const MESSAGE_LOG = 'MESSAGE_LOG';
const MESSAGE_SHOW_PARK = 'MESSAGE_SHOW_PARK';

function logToCurrentTab() {
    const logArgs = arguments;
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const msg = {message: MESSAGE_LOG, arguments: logArgs};
        chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {});
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