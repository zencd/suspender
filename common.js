"use strict";

/**
 * Extension specific utils.
 */
class CommonUtils {

    static MESSAGE_TAKE_SCREENSHOT = 'MESSAGE_TAKE_SCREENSHOT';
    static MESSAGE_SCREENSHOT_READY = 'MESSAGE_SCREENSHOT_READY';
    static MESSAGE_GET_DOCUMENT_BG_COLOR = 'MESSAGE_GET_DOCUMENT_BG_COLOR';
    static MESSAGE_LOG = 'MESSAGE_LOG';

    static LOG_PREFIX = 'BTS:';

    static logToCurrentTab() {
        const logArgs = arguments;
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            const msg = {message: CommonUtils.MESSAGE_LOG, arguments: logArgs};
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
                });
            }
        });
    }

    static isUrlSuspendable(url) {
        return url && (url.startsWith('http://') || url.startsWith('https://'));
    }

    static scaleDownRetinaImage(scaleDown, origDataUri, onLoad) {
        const dpr = window.devicePixelRatio;
        if (dpr === 1 || !scaleDown) {
            return onLoad(origDataUri);
        }

        const $canvas = document.createElement('canvas');
        document.body.appendChild($canvas);
        const ctx = $canvas.getContext('2d');
        const img = new window.Image();
        img.onload = function () {
            const w2 = img.width / dpr;
            const h2 = img.height / dpr;
            // console.log("img", img.width, 'x', img.height);
            $canvas.width = w2;
            $canvas.height = h2;
            // ctx.globalAlpha = 0.5;
            ctx.drawImage(img, 0, 0, w2, h2);
            const dataUri = $canvas.toDataURL("image/png");
            // console.log("final dataUri", dataUri.length);
            // console.log("final dataUri", dataUri);
            onLoad(dataUri);
        };
        img.src = origDataUri;
    }

    static loadAndProcessFavicon(favIconUrl, onLoad) {
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
        url = (i >= 0) ? url.substring(0, i + 1) : url;
        console.log("tmp", url);
        return 'chrome://favicon/' + url
    }

}
