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
        console.log("time consumed", (new Date() - d1));
        document.body.style.backgroundImage = 'url(' + dataUri + ')';
    } else {
        console.warn("no screenshot found for tab", tabId);
    }
});



// chrome.runtime.sendMessage({ text: "what is my tab_id?" }, tabId => {
//     console.log('My tabId is', tabId);
// });
