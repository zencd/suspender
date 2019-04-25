"use strict";

import {Utils} from '../utils.js';
import {CommonUtils} from '../common.js';
import {EXT_URLS} from '../background.js';
import {getTabs} from './tabs.js';
import {getOptions} from './opts.js';
import {addRedirect} from './webrequest.js';
import {getParkCssText, getParkHtmlText} from './resources.js';

const OLD_TAB_CHECK_INTERVAL_MILLIS = 64 * 1000;

const JPEG_QUALITY = 40;

const INJECT_CONTENT_SCRIPT_AT = 'document_idle';

initSuspensionAspect();

function initSuspensionAspect() {
    initTabWatchTimer();
}

function initTabWatchTimer() {
    setInterval(findOldTabsAndSuspendThem, OLD_TAB_CHECK_INTERVAL_MILLIS);
    // setTimeout(findOldTabsAndSuspendThem, 9000); // temp
}

function findOldTabsAndSuspendThem() {
    const options = getOptions();
    const now = new Date();
    const tt = getTabs().getAllTabs();
    for (let i = 0; i < tt.length; i++) {
        const tab = tt[i];
        const diffSec = (now - tab.lastSeen) / 1000;
        const timeoutOk = tab.lastSeen && (diffSec >= options.suspendTimeout) && (options.suspendTimeout > 0);
        const schemaOk = CommonUtils.isUrlSuspendable(tab.url);
        const activeTabOk = options.suspendActive || !tab.active;
        const pinnedOk = options.suspendPinned || !tab.pinned;
        const audibleOk = options.suspendAudible || !tab.audible;
        const doSuspend = timeoutOk && activeTabOk && !tab.suspended && schemaOk && pinnedOk && audibleOk;
        // const doSuspend = (tab.url === 'https://zencd.github.io/charted/');
        // console.log("tab", tab.url, "suspending?", doSuspend);
        if (doSuspend) {
            console.log("suspending tab", tab);
            suspendTab(tab, false);
        }
    }
}

export function suspendTab(tab, isActiveTab) {
    if (!CommonUtils.isUrlSuspendable(tab.url)) {
        return;
    }

    extBg.startTime = new Date() - 0; // for debug only

    if (isActiveTab) {
        suspendForegroundTab(tab);
    } else {
        suspendBackgroundTab(tab);
    }
}

function suspendForegroundTab(tab) {
    const screenshotId = Utils.uidString();
    captureVisibleTab_Scale_Persist(tab, screenshotId);

    chrome.tabs.sendMessage(tab.id, {message: CommonUtils.MESSAGE_GET_PAGE_INFO}, function (response) {
        console.log("response", response);
        const bg = response.backgroundColor;
        suspendTabPhase2(tab.id, screenshotId, bg, null);
    });
}

function suspendBackgroundTab(tab) {
    const msg = {
        tabId: tab.id,
        message: CommonUtils.MESSAGE_TAKE_H2C_SCREENSHOT,
        suspendFilledForms: getOptions().suspendFilledForms,
    };
    console.log("sending msg to tab", msg);
    chrome.tabs.sendMessage(tab.id, msg);
    // the async answer gonna come to the message listener
    // although the answer may not come if the tab cannot be suspended
}

export function suspendTabPhase2(tabId, screenshotId, backgroundColor, imageDataUri) {
    const tab = getTabs().getTab(tabId);
    if (tab) {
        if (imageDataUri) { // H2C
            scaleAndStoreScreenshot(tab, screenshotId, imageDataUri, false);
        } else {
            // captureVisibleTab - screenshot already taken
        }
        storeSuspendedTabAndRedirect(tab, screenshotId, backgroundColor);
    }
}

function captureVisibleTab_Scale_Persist(tab, screenshotId) {
    // XXX png takes 3+ MB on retina and 1+ sec time, so should not use it in that case
    const imageFormat = (window.devicePixelRatio > 1) ? "jpeg" : "png";
    const opts = {format: imageFormat, quality: JPEG_QUALITY};
    chrome.tabs.captureVisibleTab(tab.windowId, opts, (imageDataUri) => {
        console.log("screenshot taken at", (new Date() - extBg.startTime));
        scaleAndStoreScreenshot(tab, screenshotId, imageDataUri, true);
    });
}

function scaleAndStoreScreenshot(tab, screenshotId, imageDataUri, scaleDown) {
    const nowMillis = new Date() - 0; // GMT epoch millis
    CommonUtils.scaleDownRetinaImage(scaleDown, imageDataUri, (imageDataUri2) => {
        const storageItems = {
            ['screenshot.id=' + screenshotId]: {
                created: nowMillis,
                content: imageDataUri2,
            },
        };
        chrome.storage.local.set(storageItems);
    });
}

function storeSuspendedTabAndRedirect(tab, screenshotId, backgroundColor) {
    console.log("content generating at", (new Date() - extBg.startTime));
    getSuspendedPageContent(screenshotId, tab.url, tab.title, backgroundColor, (htmlDataUri) => {
        console.log("content generated at", (new Date() - extBg.startTime));
        const nowMillis = new Date() - 0; // GMT epoch millis
        const urlHash = Utils.fastIntHash(htmlDataUri);
        const redirUrl = EXT_URLS.tempParkPage + '?uniq=' + Utils.getRandomInt();
        const storageItems = {
            ['suspended.urlHash=' + urlHash]: {
                screenshotId: screenshotId,
                created: nowMillis,
                urlHash: urlHash,
                url: tab.url,
                tabId: tab.id,
            },
        };
        chrome.storage.local.set(storageItems, () => {
        });
        addRedirect(redirUrl, tab.id, htmlDataUri);
        console.log("redirecting to temp page at", (new Date() - extBg.startTime));
        chrome.tabs.update(tab.id, {url: redirUrl});
    });
}

function unsuspendTab(chrTab) {
    const urlHash = Utils.fastIntHash(chrTab.url);
    const storageKey = 'suspended.urlHash=' + urlHash;
    chrome.storage.local.get(storageKey, function (items) {
        const obj = items[storageKey];
        if (obj) {
            chrome.tabs.update(chrTab.id, {url: obj.url});
            const myTab = getTabs().getTab(chrTab.id);
            if (myTab) {
                myTab.lastSeen = new Date();
            }
        }
    });
}

function getSuspendedPageContent(screenshotId, pageUrl, pageTitle, bgColor, callback) {
    const bgRgb = Utils.parseRgb(bgColor);
    const bgDarkenRgb = Utils.alterBrightness(bgRgb, -0.75);
    const bgDarkenStr = bgDarkenRgb.join(',');

    const faviconUrl = CommonUtils.getChromeFaviconUrl(pageUrl);
    CommonUtils.loadAndProcessFavicon(faviconUrl, async (faviconDataUri) => {
        // todo do replace more effectively, probably via joining a set of strings
        let tplVars = {
            '$BG_COLOR$': bgColor,
            '$BG_DARKEN$': bgDarkenStr,
            '$TITLE$': pageTitle,
            '$LINK_URL$': pageUrl,
            '$LINK_TEXT$': Utils.toReadableUrl(pageUrl),
            // '$IFRAME_URL$': EXT_URLS.parkFrame,
            //'$CSS_URL$': '',
            '$CSS_TEXT$': await getParkCssText(),
            '$SCREENSHOT_ID$': screenshotId,
            '$FAVICON_DATA_URI$': faviconDataUri,
            // '$DATE$': Utils.formatHumanReadableDateTime(),
            '$PARK_JS_URL$': EXT_URLS.parkJs,
            '$START_TIME$': extBg.startTime,
        };
        const pht = await getParkHtmlText();
        const htmlStr = Utils.expandStringTemplate(pht, tplVars);
        const b64 = Utils.b64EncodeUnicode(htmlStr);
        const htmlDataUri = 'data:text/html;base64,' + b64;
        callback(htmlDataUri);
    });
}


export function suspendWindow(windowId) {
    console.debug("suspendWindow", "windowId:", windowId);
    const tt = getTabs().getAllTabs();
    for (let i = 0; i < tt.length; i++) {
        const tab = tt[i];
        if (tab.windowId === windowId) {
            suspendTab(tab);
        }
    }
}

export function unsuspendWindow(windowId) {
    const tt = getTabs().getAllTabs();
    for (let i = 0; i < tt.length; i++) {
        const tab = tt[i];
        if (tab.windowId === windowId) {
            if (Utils.isDataUri(tab.url)) {
                unsuspendTab(tab);
            }
        }
    }
}

export function suspendCurrentWindow() {
    Utils.getCurrentWindowIdFromBackgroundScript(function (windowId) {
        suspendWindow(windowId)
    });
}

export function unsuspendCurrentWindow() {
    Utils.getCurrentWindowIdFromBackgroundScript(function (windowId) {
        unsuspendWindow(windowId)
    });
}

export function suspendCurrentTab() {
    Utils.getCurrentTabFromBackgroundScript((chtTab) => {
        suspendTab(chtTab, true);
    });
}