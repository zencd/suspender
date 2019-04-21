"use strict";

import {Utils} from '../utils.js';
import {CommonUtils} from '../common.js';
import {EXT_URLS} from '../background.js';
import {getTabs} from './tabs.js';
import {getOptions} from './opts.js';
import {addToSuspensionMap} from './webrequest.js';
import {isResourcesLoaded, getParkCssText, getParkHtmlText} from './resources.js';

const OLD_TAB_CHECK_INTERVAL_MILLIS = 64 * 1000;

const JPEG_QUALITY = 40;

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
    if (!isResourcesLoaded()) {
        console.info("internal resources not loaded yet - aborting");
        return;
    }

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
    chrome.tabs.executeScript(tab.id, {
        file: 'content_fg_tab.js',
        runAt: 'document_idle'
    }, (injected) => {
        chrome.tabs.executeScript(tab.id, {
            code: 'continueCapturing(' + tab.id + ');'
        });
    });
}

function suspendBackgroundTab(tab) {
    const files = ['html2canvas.min.js', 'content_bg_tab.js'];
    const runAt = 'document_idle';
    chrome.tabs.executeScript(tab.id, {
        file: files[0],
        runAt: runAt
    }, (injected1) => {
        chrome.tabs.executeScript(tab.id, {
            file: files[1],
            runAt: runAt
        }, (injected2) => {
            chrome.tabs.executeScript(tab.id, {
                code: 'continueCapturing(' + tab.id + ');'
            });
        });
    });
}

export function suspendTabPhase1(tabId, backgroundColor, imageDataUri) {
    const tab = getTabs().getTab(tabId);

    function next(imageDataUri, scaleDown) {
        const screenshotId = Utils.uidString();
        getSuspendedPageContent(screenshotId, tab.url, tab.title, backgroundColor, (htmlDataUri) => {
            scaleStoreRedirect(screenshotId, tab.id, tab.url, htmlDataUri, imageDataUri, scaleDown);
        });
    }

    if (imageDataUri) {
        next(imageDataUri, false);
    } else {
        // XXX png takes 3+ MB on retina and 1+ sec time, so should not use it in that case
        const imageFormat = (window.devicePixelRatio > 1) ? "jpeg" : "png";
        const opts = {format: imageFormat, quality: JPEG_QUALITY};
        chrome.tabs.captureVisibleTab(tab.windowId, opts, (imageDataUri) => {
            next(imageDataUri, true);
        });
    }
}

function scaleStoreRedirect(screenshotId, tabId, tabUrl, htmlDataUri, imageDataUri, scaleDown) {
    CommonUtils.scaleDownRetinaImage(scaleDown, imageDataUri, (imageDataUri2) => {
        const nowMillis = new Date() - 0; // GMT epoch millis
        const urlHash = Utils.fastIntHash(htmlDataUri);
        const redirUrl = EXT_URLS.tempParkPage + '?uniq=' + Utils.getRandomInt();
        const storageItems = {
            ['screenshot.id=' + screenshotId]: {
                created: nowMillis,
                urlHash: urlHash,
                content: imageDataUri2,
            },
            ['suspended.urlHash=' + urlHash]: {
                screenshotId: screenshotId,
                created: nowMillis,
                urlHash: urlHash,
                url: tabUrl,
                tabId: tabId,
            },
        };
        chrome.storage.local.set(storageItems, ()=>{});
        addToSuspensionMap(redirUrl, tabId, htmlDataUri, nowMillis);
        chrome.tabs.update(tabId, {url: redirUrl});
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
    CommonUtils.loadAndProcessFavicon(faviconUrl, function (faviconDataUri) {
        // todo do replace more effectively, probably via joining a set of strings
        let tplVars = {
            '$BG_COLOR$': bgColor,
            '$BG_DARKEN$': bgDarkenStr,
            '$TITLE$': pageTitle,
            '$LINK_URL$': pageUrl,
            '$LINK_TEXT$': Utils.toReadableUrl(pageUrl),
            '$IFRAME_URL$': EXT_URLS.parkFrame,
            //'$CSS_URL$': '',
            '$CSS_TEXT$': getParkCssText(),
            '$SCREENSHOT_ID$': screenshotId,
            '$FAVICON_DATA_URI$': faviconDataUri,
            // '$DATE$': Utils.formatHumanReadableDateTime(),
            '$PARK_JS_URL$': EXT_URLS.parkJs,
        };
        const htmlStr = Utils.expandStringTemplate(getParkHtmlText(), tplVars);
        const b64 = Utils.b64EncodeUnicode(htmlStr);
        const htmlDataUri = 'data:text/html;base64,' + b64;
        callback(htmlDataUri);
    });
}


export function suspendWindow(windowId) {
    // todo start iterating my tab objects, not chrome's
}

export function unsuspendWindow(windowId) {
    // todo start iterating my tab objects, not chrome's
    chrome.windows.get(windowId, {'populate': true}, function (window) {
        const tabs = window.tabs;
        for (let i in tabs) {
            if (tabs.hasOwnProperty(i)) {
                const chrTab = tabs[i];
                if (Utils.isDataUri(chrTab.url)) {
                    unsuspendTab(chrTab);
                }
            }
        }
    });
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