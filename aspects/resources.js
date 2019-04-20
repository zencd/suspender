"use strict";

import {Utils} from '../utils.js';
import {EXT_URLS} from '../background.js';

const REQUEST_IDLE_CALLBACK_TIMEOUT = 2000;

let gParkHtmlText = ''; // content fetched from `gParkHtmlUrl`
let gParkCssText = ''; // content fetched from `gParkCssUrl`

let parkHtmlLoaded = false;
let parkCssLoaded = false;

initResourcesAspect();

function initResourcesAspect() {
    prefetchResources();
}

function prefetchResources() {
    function prefetchParkPageHtml() {
        fetch(EXT_URLS.parkHtml).then((response) => {
            response.text().then((text) => {
                gParkHtmlText = Utils.stripCrLf(text).trim();
                parkHtmlLoaded = true;
            });
        });
    }

    function prefetchParkPageCss() {
        fetch(EXT_URLS.parkCss).then((response) => {
            response.text().then((text) => {
                gParkCssText = Utils.stripCrLf(text).trim();
                parkCssLoaded = true;
            });
        });
    }

    const t1 = new Date();
    // console.log("t1", t1);
    // console.log("gParkCssText", gParkCssText);
    window.requestIdleCallback(() => {
        // todo never triggered without the timeout
        // console.log("resources requestIdleCallback, started in", (new Date() - t1), "ms");
        prefetchParkPageHtml();
        prefetchParkPageCss();
    }, {timeout: REQUEST_IDLE_CALLBACK_TIMEOUT});
}

export function getParkHtmlText() {
    return gParkHtmlText;
}

export function getParkCssText() {
    return gParkCssText;
}

export function isResourcesLoaded() {
    return parkHtmlLoaded && parkCssLoaded;
}