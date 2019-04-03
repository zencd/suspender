// console.log("hi from iframe.js", chrome.extension);

const url = new URL(window.location.href);
const tabId = parseInt(url.searchParams.get("tabId"));
// console.log("MESSAGE_LOG", typeof MESSAGE_LOG);
// console.log("tabId", tabId);

const storageKey = 'screenshot.data-uri.tab.' + tabId;
// const storageKey = 'xxx';
// const storageKey = 'screenshot.data-uri.tab.3178';
const d1 = new Date();
chrome.storage.local.get([storageKey], function (items) {
    // console.log("items", items);
    const dataUri = items[storageKey];
    // console.log("dataUri", dataUri);
    if (dataUri) {
        console.log("time consumed 1", (new Date() - d1));
        document.body.style.backgroundImage = 'url(' + dataUri + ')';
        // document.querySelector('img').src = dataUri;
        console.log("time consumed 2", (new Date() - d1));
    } else {
        console.warn("no screenshot found for tab", tabId);
    }
});

window.addEventListener('message', function(messageEvent) {
    // waiting for extended info from the parent frame
    const origin = messageEvent.origin || messageEvent.originalEvent.origin;
    // here `origin` gonna be checked, but it is always 'null' (string!) for me
    // const originOk = !origin || origin === 'null';
    const originOk = true;
    if (originOk && typeof messageEvent.data === 'object' && messageEvent.data.call==='setFrameParams') {
        const url = messageEvent.data.url;
        // console.log("RECEIVED!", event.data.url);
        document.body.addEventListener('click', function (clickEvent) {
            // console.log("clickEvent", clickEvent);
            if (clickEvent.which === 1) {
                window.parent.location.href = url;
            }
        });
    }
}, false);

// function setUpFrame2(name) {
//     console.log("setUpFrame2...", name);
// }



// chrome.runtime.sendMessage({ text: "what is my tab_id?" }, tabId => {
//     console.log('My tabId is', tabId);
// });
