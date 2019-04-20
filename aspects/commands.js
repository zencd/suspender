"use strict";

import {Utils} from '../utils.js';
import {suspendTab} from './suspension.js';

initCommandsAspect();

function initCommandsAspect() {
    initCommandListener();
}

function initCommandListener() {
    chrome.commands.onCommand.addListener((command) => {
        console.debug("command triggered:", command);
        if (command === 'command-suspend-current-tab') {
            Utils.getCurrentTabFromBackgroundScript((chrTab) => {
                suspendTab(chrTab, true);
            });
        }
    });
}