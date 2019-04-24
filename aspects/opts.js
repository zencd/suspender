'use strict';

import {Utils} from '../utils.js';
import {Options} from '../options_lib.js';
import {EXT_URLS} from "../background.js";

const options = new Options();

initOptionsAspect();

function initOptionsAspect() {
    options.load(function () {
        console.debug("options loaded from storage", options);
    });
    chrome.storage.onChanged.addListener(function (changes, areaName) {
        options.applyChanges(changes, areaName);
    });
}

export function getOptions() {
    return options;
}

export function addThisSiteToWhitelist() {
}