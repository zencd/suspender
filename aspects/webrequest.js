(() => {
    "use strict";

    const ns = Utils.getNS()
        .export(initWebRequestListeners)
        .export(addToSuspensionMap);

    const suspensionMap = {};

    function addToSuspensionMap(redirUrl, tabId, htmlDataUri, nowMillis) {
        suspensionMap[redirUrl] = {
            tabId: tabId,
            htmlDataUri: htmlDataUri,
            date: nowMillis,
        };
    }

    function initWebRequestListeners() {
        const urlPattern = ns.urls.tempParkPage + '*';
        chrome.webRequest.onBeforeRequest.addListener(function (details) {
                const suspensionInfo = suspensionMap[details.url];
                if (suspensionInfo) {
                    const dataUri = suspensionInfo.htmlDataUri;
                    const tabId = suspensionInfo.tabId;
                    if (dataUri) {
                        delete suspensionMap[details.url];
                        const myTab = ns.getTabs().getTab(tabId);
                        if (myTab) {
                            myTab.suspended = true;
                        }
                        return {redirectUrl: dataUri};
                    }
                }
                return {};
            },
            {
                urls: [urlPattern],
                types: ["main_frame"],
            },
            ["blocking"]
        );
    }

})();