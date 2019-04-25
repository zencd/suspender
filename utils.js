"use strict";

/**
 * Abstract utils.
 */
export class Utils {

    static iteratePopulatedWindows(onWindow) {
        chrome.windows.getAll({'populate': true}, function (windows) {
            for (let i in windows) {
                if (windows.hasOwnProperty(i)) {
                    onWindow(windows[i]);
                }
            }
        });
    }

    static findBgColor(document) {
        let color = 'rgb(255,255,255)';
        if (document.body) {
            color = getComputedStyle(document.body).backgroundColor;
            if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
                color = 'rgb(255,255,255)';
            }
        }
        return color;
    }

    static setCssClass($elem, addOrRemove, className) {
        if (addOrRemove) {
            $elem.classList.add(className);
        } else {
            $elem.classList.remove(className);
        }
    }

    static getCurrentTabFromBackgroundScript(onTab) {
        // todo try using TabList
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (tabs.length > 0) {
                onTab(tabs[0]);
            }
        });
    }

    static getCurrentWindowIdFromBackgroundScript(onWindowId) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (tabs.length > 0) {
                onWindowId(tabs[0].windowId);
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

    static expandStringTemplate(tplText, vars) {
        return tplText.replace(/\$[a-zA-Z0-9_]+\$/g, function (wholeMatch) {
            const val = vars[wholeMatch];
            return (val === undefined) ? '' : val;
        });
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
        if (!s) return s;
        return s
            .replace(/^https?:\/\/(www\.)?/, '') // cut off uninformative beginning
            .replace(/\/.*/, ''); // cur off trailing stuff
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

    static qs(selector) {
        return document.querySelector(selector);
    }

    static qsa(selector) {
        return document.querySelectorAll(selector);
    }

    static parseRgb(input) {
        const m = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (m) {
            return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
        } else {
            console.log("parseRgb: unrecognized input:", input);
            return [255, 255, 255];
        }
    }

    static alterBrightness(rgb, change) {
        const res = new Array(3);
        for (let i = 0; i < 3; i++) {
            let c = Math.round(rgb[i] + rgb[i] * change);
            if (c < 0) {
                c = 0;
            } else if (c > 255) {
                c = 255;
            }
            res[i] = c;
        }
        return res;
    }

    static uidString(n) {
        // https://stackoverflow.com/a/19964557/207352
        if (typeof n === 'undefined') {
            n = 16;
        }
        const s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return Array(n).join().split(',').map(() => {
            return s.charAt(Math.floor(Math.random() * s.length));
        }).join('');
    }

    static getRandomInt(min, max) {
        if (typeof min === 'undefined') {
            min = 0;
        }
        if (typeof max === 'undefined') {
            max = 1000 * 1000 * 1000;
        }
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static stripCrLf(s) {
        if (!s) return s;
        return s.replace(/[\n\r]/g, '');
    }

    static fastIntHash(s) {
        // Java's hashCode() basically
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash) + s.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    static replaceAll(input, search, replacement) {
        return input.split(search).join(replacement);
    };

    static isDataUri(url) {
        return url && url.startsWith('data:text/html;');
    }
}

export class ResourceOnDemand {
    constructor(url, filter) {
        this.url = url;
        this.filter = filter;
        this.value = null;
    }

    get() {
        const self = this;
        if (self.value) {
            return self.value;
        } else {
            return new Promise((resolve, reject) => {
                fetch(self.url).then((response) => {
                    response.text().then((text) => {
                        if (self.filter) {
                            text = self.filter(text);
                        }
                        self.value = text;
                        resolve(text);
                    });
                });
            });
        }
    }
}

export const qs = Utils.qs;

export const qsa = Utils.qsa;