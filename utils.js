"use strict";

class Utils {

    static MESSAGE_LOG = 'MESSAGE_LOG';
    static LOG_PREFIX = 'BTS:';

    static logToCurrentTab() {
        const logArgs = arguments;
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            const msg = {message: Utils.MESSAGE_LOG, arguments: logArgs};
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
                });
            }
        });
    }

    static b64EncodeUnicode(str) {
        // https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
        // first we use encodeURIComponent to get percent-encoded UTF-8,
        // then we convert the percent encodings into raw bytes which
        // can be fed into btoa.
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
    }

    static expandStringTemplate(tplContent, vars) {
        let res = tplContent;
        for (let key in vars) {
            if (vars.hasOwnProperty(key)) {
                res = res.replaceAll(key, vars[key]);
            }
        }
        return res;
    }

    static cutFromBeginning(inp, pattern) {
        if (!inp) {
            return inp;
        }
        return inp.startsWith(pattern) ? inp.substring(pattern.length) : inp;
    }

    static cutFromEnd(inp, pattern) {
        if (!inp) {
            return inp;
        }
        return inp.endsWith(pattern) ? inp.substring(0, inp.length - pattern.length) : inp;
    }

    static toReadableUrl(s) {
        s = Utils.cutFromBeginning(s, 'http://');
        s = Utils.cutFromBeginning(s, 'https://');
        s = Utils.cutFromBeginning(s, 'www.');
        const i = s.indexOf('/');
        if (i >= 0) {
            s = s.substring(0, i);
        }
        return Utils.cutFromEnd(s, '/');
    }

    static limit(s, numChars) {
        if (!s) return s;
        if (numChars < s.length) s = s.substring(0, numChars);
        return s;
    }

    static formatHumanReadableDateTime(date) {
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

    static injectScriptsIntoTab(tabId, runAt, files) {
        if (files.length <= 0) {
            return;
        }
        let cur = 0;

        function inject_one() {
            if (cur <= files.length - 1) {
                chrome.tabs.executeScript(tabId, {
                    file: files[cur],
                    runAt: runAt
                }, (injectResult) => {
                    // console.log("file injected", js_files[current_js_file], injectResult);
                    cur++;
                    inject_one();
                });
            }
        }

        inject_one();
    }

    static toMB(bytes) {
        return Math.ceil(bytes / 1024 / 1024);
    }

    static qs(selector) {
        return document.querySelector(selector);
    }

    static qsa(selector) {
        return document.querySelectorAll(selector);
    }

}

if (typeof String.prototype.replaceAll === 'undefined') {
    // todo don't alter String prototype
    String.prototype.replaceAll = function (search, replacement) {
        return this.split(search).join(replacement);
    };
}

window.qs = Utils.qs;
window.qsa = Utils.qsa;