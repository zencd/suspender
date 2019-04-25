"use strict";

import {Utils} from "../lib/Utils.js";
import {getTabs} from "./tabs.js";

const SUSPENDED_FAVICON_OPACITY = 0.4;

/**
 * Extension specific utils.
 */
export class CommonUtils {

    static MESSAGE_GET_PAGE_INFO = 'MESSAGE_GET_PAGE_INFO';
    static MESSAGE_TAKE_H2C_SCREENSHOT = 'MESSAGE_TAKE_H2C_SCREENSHOT';
    static MESSAGE_H2C_SCREENSHOT_READY = 'MESSAGE_H2C_SCREENSHOT_READY';
    static MESSAGE_LOG_TO_BG = 'MESSAGE_LOG_TO_BG';

    static isUrlSuspendable(url) {
        return url && (url.startsWith('http://') || url.startsWith('https://'));
    }

    static scaleDownRetinaImage(scaleDown, origDataUri, onResult) {
        const dpr = window.devicePixelRatio;
        if (dpr === 1 || !scaleDown) {
            return onResult(origDataUri);
        }

        const $canvas = document.createElement('canvas');
        document.body.appendChild($canvas);
        const ctx = $canvas.getContext('2d');
        const img = new window.Image();
        img.onload = function () {
            const w2 = img.width / dpr;
            const h2 = img.height / dpr;
            $canvas.width = w2;
            $canvas.height = h2;
            ctx.drawImage(img, 0, 0, w2, h2);
            const dataUri = $canvas.toDataURL("image/png");
            onResult(dataUri);
        };
        img.src = origDataUri;
    }

    static loadAndProcessFavicon(favIconUrl, onLoad) {
        const $canvas = document.createElement('canvas');
        const ctx = $canvas.getContext('2d');
        const img = new window.Image();
        img.onload = function () {
            $canvas.width = img.width;
            $canvas.height = img.height;
            ctx.globalAlpha = SUSPENDED_FAVICON_OPACITY;
            ctx.drawImage(img, 0, 0);
            const dataUri = $canvas.toDataURL("image/png");
            onLoad(dataUri);
        };
        img.src = favIconUrl;
    }

    /**
     * converts 'https://mail.google.com/mail/u/0/#inbox'
     * into 'chrome://favicon/https://mail.google.com/'
     * @param url
     * @returns {string}
     */
    static getChromeFaviconUrl(url) {
        const i = url.indexOf('/', 8);
        url = (i >= 0) ? url.substring(0, i + 1) : url; // cut off protocol
        return 'chrome://favicon/' + url
    }

    /**
     * Makes a link like below clickable:
     *   <a href="chrome://extensions/shortcuts">
     * Because Chrome prohibits following special urls by default.
     * @param $elem
     * @param openInNewTab
     */
    static makeSpecialLinkClickable($elem, openInNewTab) {
        if (openInNewTab === undefined) {
            openInNewTab = false;
        }
        $elem.onclick = (ev) => {
            ev.preventDefault();
            const url = ev.target.href;
            if (openInNewTab) {
                chrome.tabs.create({url: url});
            } else {
                chrome.tabs.update({url: url});
            }
        };

    }

    static debugTabs() {
        const tt = getTabs().getAllTabs();
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

}