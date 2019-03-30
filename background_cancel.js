(function () {
    "use strict";

    const console = chrome.extension.getBackgroundPage().console;

    function logToContentScript() {
        const logArgs = arguments;
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            const msg = {message: MESSAGE_LOG, arguments: logArgs};
            chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {});
        });
    }

    chrome.webRequest.onBeforeRequest.addListener(function(details) {
            //
            // example of details:
            // frameId: 0, method: "GET", parentFrameId: -1, requestId: "177149", tabId: 3320
            // timeStamp: 1553804074191.074, type: "main_frame", url: "https://github.com/zencd/charted"
            //
            const tabId = details.tabId;
            const github = details.url.indexOf("github") >= 0;
            if (!github) {
                return {cancel: false};
            }
            logToContentScript("details", details);
            console.log("details", details);
            // const msg = {message: MESSAGE_SHOW_PARK};
            // chrome.tabs.sendMessage(tabId, msg, function (response) {});
            // chrome.tabs.get(tabId, function(tab) {
            //     console.log("tab", tab);
            // });
            // return {redirectUrl: "data:text/html;base64,PCFET0NUWVBFIGh0bWw+CjxodG1sPgo8aGVhZD4KICAgIDxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KICAgIDx0aXRsZT5UaXRsZTwvdGl0bGU+CiAgICA8c3R5bGU+CiAgICAgICAgaHRtbCwgYm9keSB7CiAgICAgICAgICAgIGhlaWdodDogMTAwJTsKICAgICAgICB9CgogICAgICAgIGJvZHkgewogICAgICAgICAgICBtYXJnaW46IDA7CiAgICAgICAgICAgIHBhZGRpbmc6IDA7CiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNkZGQ7CiAgICAgICAgfQoKICAgICAgICAuYm94IHsKICAgICAgICAgICAgZGlzcGxheTogZmxleDsKICAgICAgICAgICAgZmxleC1mbG93OiBjb2x1bW47CiAgICAgICAgICAgIGhlaWdodDogMTAwJTsKICAgICAgICB9CgogICAgICAgIC5oZWFkZXIgewogICAgICAgICAgICBmbGV4OiAwIDEgYXV0bzsKICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyOwogICAgICAgICAgICBwYWRkaW5nOiAyMHB4IDIwcHggMCAyMHB4OwogICAgICAgIH0KCiAgICAgICAgLm1haW4gewogICAgICAgICAgICBmbGV4OiAxIDEgYXV0bzsKICAgICAgICAgICAgcGFkZGluZzogMjBweDsKICAgICAgICB9CgogICAgICAgIGlmcmFtZSB7CiAgICAgICAgICAgIC8qb3V0bGluZTogMXB4IGRhc2hlZCBncmF5OyovCiAgICAgICAgICAgIHdpZHRoOiAxMDAlOwogICAgICAgICAgICBoZWlnaHQ6IDEwMCU7CiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDIwcHg7CiAgICAgICAgfQoKICAgICAgICBoMSB7CiAgICAgICAgICAgIG1hcmdpbjogMDsKICAgICAgICAgICAgZm9udDogYm9sZCAyNHB4LzMycHggc2Fucy1zZXJpZjsKICAgICAgICAgICAgaGVpZ2h0OiAzMnB4OwogICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuOwogICAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsKICAgICAgICB9CgogICAgICAgIC5saW5rIHsKICAgICAgICAgICAgZm9udDogMTZweC8yMnB4IHNhbnMtc2VyaWY7CiAgICAgICAgICAgIGhlaWdodDogMjJweDsKICAgICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjsKICAgICAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7CiAgICAgICAgfQoKICAgICAgICAubGluayBhIHsKICAgICAgICAgICAgY29sb3I6IGJsYWNrOwogICAgICAgIH0KICAgIDwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+Cgo8ZGl2IGNsYXNzPSJib3giPgoKICAgIDxkaXYgY2xhc3M9ImhlYWRlciI+CiAgICAgICAgPGgxPgogICAgICAgICAgICBIb3cgdG8gZW5jb2RlIGJhc2U2NCB2aWEgY29tbWFuZCBsaW5lPwogICAgICAgIDwvaDE+CiAgICAgICAgPGRpdiBjbGFzcz0ibGluayI+CiAgICAgICAgICAgIDxhIGhyZWY9IiMiPgogICAgICAgICAgICAgICAgaHR0cHM6Ly9zdXBlcnVzZXIuY29tL3F1ZXN0aW9ucy8xMjA3OTYvaG93LXRvLWVuY29kZS1iYXNlNjQtdmlhLWNvbW1hbmQtbGluZQogICAgICAgICAgICA8L2E+CiAgICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJtYWluIj4KICAgICAgICA8aWZyYW1lIHNyYz0iaHR0cHM6Ly93dGZpc215aXAuY29tL3RleHQiIGZyYW1lYm9yZGVyPSIwIj48L2lmcmFtZT4KICAgICAgICA8IS0tPGlmcmFtZSBzcmM9ImZpbGU6Ly8vVXNlcnMvcGF2ZWwvRHJvcGJveC9wcm9qZWN0cy9jaHJvbWUtc3VzcGVuZGVyL2lmcmFtZS5odG1sIiBmcmFtZWJvcmRlcj0iMCI+PC9pZnJhbWU+LS0+CiAgICAgICAgPCEtLTxpZnJhbWUgc3JjPSJjaHJvbWUtZXh0ZW5zaW9uOi8vbW1tamhjaW9vbGtuYWZkZ2Flb2ZmY21iZmtoY2NiYW8vcGFyay5odG1sIiBmcmFtZWJvcmRlcj0iMCI+PC9pZnJhbWU+LS0+CiAgICA8L2Rpdj4KPC9kaXY+CjwvYm9keT4KPC9odG1sPg=="};
            return {};
            // return {cancel: true};
        },
        {urls: ["<all_urls>"]},
        ["blocking"]
    );

    chrome.webRequest.onHeadersReceived.addListener(function(details) {
        // console.log("onHeadersReceived", "details", details);
    });

}());