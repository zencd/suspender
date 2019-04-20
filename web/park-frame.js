"use strict";

const root = chrome.extension.getBackgroundPage().root;

function fetchAndSetImage(screenshotId) {
    const storageKey = 'screenshot.id=' + screenshotId;
    const d1 = new Date();
    chrome.storage.local.get([storageKey], function (items) {
        const obj = items[storageKey];
        if (obj) {
            const dataUri = obj.content;
            if (dataUri) {
                console.log("screenshot fetched for", (new Date() - d1), "ms, " + Math.ceil(dataUri.length/1024) + " KB data uri");
                window.parent.postMessage({
                    call: 'setScreenshot',
                    dataUri: dataUri,
                    startTime: root.startTime,
                }, '*');
            } else {
                console.warn("no screenshot found for screenshotId", screenshotId);
            }
        } else {
            console.warn("no screenshot found for screenshotId", screenshotId);
        }
    });
}

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
