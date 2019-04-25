"use strict";

import {EXT_URLS} from './background.js';
import {getTabs} from './tabs.js';
import {Utils} from '../lib/Utils.js';

const redirects = {}; // url => object

initWebRequestAspect();

function initWebRequestAspect() {
    initWebRequestListeners();
    initRedirectInspectorJob();
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

export function addRedirect(redirUrl, tabId, htmlDataUri) {
    redirects[redirUrl] = {
        tabId: tabId,
        htmlDataUri: htmlDataUri,
        date: new Date() - 0,
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

/**
 * periodically inspects redirects which never happened
 * aimed to avoid memory leaks
 */
function initRedirectInspectorJob() {
    const now = new Date() - 0;
    setInterval(() => {
        console.debug("initRedirectInspectorJob...");
        for (let url in redirects) {
            if (redirects.hasOwnProperty(url)) {
                const redir = redirects[url];
                if (redir.date + Utils.minutes(5) > now) {
                    console.debug("initRedirectInspectorJob: removed a stale redirect");
                    delete redirects[url];
                }
            }
        }
    }, Utils.minutes(30));
}