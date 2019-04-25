"use strict";

const extBg = chrome.extension.getBackgroundPage()['extBg'];
let numTries = 0; // num of attempts to obtain screenshot
console.log("park-frame.js started at", (new Date() - extBg.startTime));
addMessageListener();

function fetchAndSetImage(screenshotId) {
    const storageKey = 'screenshot.id=' + screenshotId;
    const started = new Date() - 0;
    const WAIT_TIMEOUT = 200;
    const MAX_TOTAL_WAIT = 3000;
    tryObtainScreenshot();

    function tryObtainScreenshot() {
        numTries++;
        chrome.storage.local.get([storageKey], function (items) {
            const totalTimePassed = new Date() - started;
            const obj = items[storageKey];
            if (obj && obj.content) {
                sendScreenshot(obj.content);
            } else {
                if (totalTimePassed < MAX_TOTAL_WAIT) {
                    setTimeout(tryObtainScreenshot, WAIT_TIMEOUT);
                } else {
                    console.warn("no screenshot found for screenshotId", screenshotId, "after", numTries, "tries");
                }
            }
        });
    }
}

function sendScreenshot(dataUri) {
    console.log("sendScreenshot at", (new Date() - extBg.startTime));
    window.parent.postMessage({
        call: 'setScreenshot',
        dataUri: dataUri,
        startTime: extBg.startTime,
        numTries: numTries,
    }, '*');
}

function addMessageListener() {
    window.addEventListener('message', function (messageEvent) {
        // waiting for extended info from the parent frame
        const origin = messageEvent.origin || messageEvent.originalEvent.origin;
        // here `origin` gonna be checked, but it is always 'null' (string!) for me
        // const originOk = !origin || origin === 'null';
        const originOk = true;
        if (originOk && typeof messageEvent.data === 'object' && messageEvent.data.call === 'setFrameParams') {
            fetchAndSetImage(messageEvent.data.screenshotId);
        }
    }, false);
}