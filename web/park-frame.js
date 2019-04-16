"use strict";

document.body.dataset.devicePixelRatio = '' + window.devicePixelRatio;

function fetchAndSetImage(tabId) {
    const storageKey = 'screenshot.data-uri.tab.' + tabId;
    const d1 = new Date();
    chrome.storage.local.get([storageKey], function (items) {
        const dataUri = items[storageKey];
        if (dataUri) {
            console.log("screenshot fetched for", (new Date() - d1), "ms, " + Math.ceil(dataUri.length/1024) + " KB data uri");
            window.parent.postMessage({call: 'setScreenshot', dataUri: dataUri}, '*');
        } else {
            console.warn("no screenshot found for tab", tabId);
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
        const url = messageEvent.data.url;
        const tabId = messageEvent.data.tabId;
        fetchAndSetImage(tabId);
        document.body.addEventListener('click', function (clickEvent) {
            if (clickEvent.which === 1) {
                window.parent.location.href = url;
            }
        });
    }
}, false);
