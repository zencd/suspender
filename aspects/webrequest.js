"use strict";

import {Utils} from '../utils.js';
import {EXT_URLS} from '../background.js';
import {getTabs} from './tabs.js';

const suspensionMap = {};

initWebRequestAspect();

function initWebRequestAspect() {
    initWebRequestListeners();
}

function initWebRequestListeners() {
    const urlPattern = EXT_URLS.tempParkPage + '*';
    chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest,
        {
            urls: [urlPattern],
            types: ["main_frame"],
        },
        ["blocking"]
    );
}

export function addToSuspensionMap(redirUrl, tabId, htmlDataUri, nowMillis) {
    suspensionMap[redirUrl] = {
        tabId: tabId,
        htmlDataUri: htmlDataUri,
        date: nowMillis,
    };
}

function onBeforeRequest(details) {
    const suspensionInfo = suspensionMap[details.url];
    if (suspensionInfo) {
        const dataUri = suspensionInfo.htmlDataUri;
        const tabId = suspensionInfo.tabId;
        if (dataUri) {
            delete suspensionMap[details.url];
            const myTab = getTabs().getTab(tabId);
            if (myTab) {
                myTab.suspended = true;
            }
            console.log("redirecting to data uri at", (new Date() - extBg.startTime));
            return {redirectUrl: dataUri};
        }
    }
    return {};
}