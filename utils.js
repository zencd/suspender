"use strict";

const MESSAGE_LOG = 'MESSAGE_LOG';
const LOG_PREFIX = 'BTS:';

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
    const i = s.indexOf('/');
    if (i >= 0) {
        s = s.substring(0, i);
    }
    return cutFromEnd(s, '/');
}

function limit(s, numChars) {
    if (!s) return s;
    if (numChars < s.length) s = s.substring(0, numChars);
    return s;
}

function qs(selector) {
    return document.querySelector(selector);
}

function qsa(selector) {
    return document.querySelectorAll(selector);
}

function formatDateTime(date) {
    if (typeof date === 'undefined') {
        date = new Date();
    }
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();
    let hrs = '' + date.getHours();
    let min = '' + date.getMinutes();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hrs.length < 2) hrs = '0' + hrs;
    if (min.length < 2) min = '0' + min;

    return year + '-' + month + '-' + day + ' ' + hrs + ':' + min;
}