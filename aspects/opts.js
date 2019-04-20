'use strict';

import {Utils} from '../utils.js';
import {Options} from '../options_lib.js';

const options = new Options();

initOptionsAspect();

function initOptionsAspect() {
    options.load(function () {
        console.log("options loaded from storage", options);
    });
    chrome.storage.onChanged.addListener(function (changes, areaName) {
        options.processChanges(changes, areaName);
    });
}

export function getOptions() {
    return options;
}

export function addThisSiteToWhitelist() {
}