"use strict";

import {EXT_URLS} from '../background.js';
import {getTabs} from './tabs.js';

const redirects = {}; // url => object

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

export function addRedirect(redirUrl, tabId, htmlDataUri, nowMillis) {
    redirects[redirUrl] = {
        tabId: tabId,
        htmlDataUri: htmlDataUri,
        date: nowMillis,
    };
}

function onBeforeRequest(details) {
    const redir = redirects[details.url];
    if (redir) {
        const dataUri = redir.htmlDataUri;
        const tabId = redir.tabId;
        if (dataUri) {
            delete redirects[details.url];
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