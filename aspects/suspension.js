(()=>{
    const ns = Utils.getNS()
        .export(suspendTab)
        .export(suspendTabPhase2)
        .export(suspendWindow)
        .export(unsuspendWindow)
        .export(suspendCurrentTab)
        .export(suspendCurrentWindow)
        .export(unsuspendCurrentWindow);

    function suspendTab(tab, isActiveTab) {
        console.log("suspendTab", tab);
        if (!CommonUtils.isUrlSuspendable(tab.url)) {
            return;
        }
        console.log("gonna reload", tab);
        chrome.tabs.sendMessage(tab.id, {message: CommonUtils.MESSAGE_GET_DOCUMENT_BG_COLOR}, function (bgResp) {
            const screenshotId = Utils.uidString();
            getSuspendedPageContent(screenshotId, tab.url, tab.title, bgResp.backgroundColor, function (htmlDataUri) {
                if (isActiveTab) {
                    // todo use windowId
                    const opts = {format: "png"}; // also "jpeg"
                    chrome.tabs.captureVisibleTab(null, opts, function (imageDataUri) {
                        const scaleDown = isActiveTab;
                        suspendTabPhase2(screenshotId, tab.id, tab.url, htmlDataUri, imageDataUri, scaleDown);
                    });
                } else {
                    const msg = {
                        message: CommonUtils.MESSAGE_TAKE_SCREENSHOT,
                        screenshotId: screenshotId,
                        htmlDataUri: htmlDataUri,
                        tabId: tab.id,
                        tabUrl: tab.url,
                    };
                    console.log("sending message", tab.id, msg);
                    chrome.tabs.sendMessage(tab.id, msg, function (response) {
                        // console.log("response from CS:", response);
                    });
                }
            });
        });
    }

    function unsuspendTab(chrTab) {
        const urlHash = Utils.fastIntHash(chrTab.url);
        const storageKey = 'suspended.urlHash=' + urlHash;
        chrome.storage.local.get(storageKey, function (items) {
            const obj = items[storageKey];
            if (obj) {
                chrome.tabs.update(chrTab.id, {url: obj.url});
                const myTab = ns.getTabs().getTab(chrTab.id);
                if (myTab) {
                    myTab.lastSeen = new Date();
                }
            }
        });
    }

    function getSuspendedPageContent(screenshotId, pageUrl, pageTitle, bgColor, callback) {
        const bgRgb = Utils.parseRgb(bgColor);
        const bgDarkenRgb = Utils.alterBrightness(bgRgb, -0.75);
        const bgDarkenStr = bgDarkenRgb.join(',');

        const faviconUrl = CommonUtils.getChromeFaviconUrl(pageUrl);
        CommonUtils.loadAndProcessFavicon(faviconUrl, function (faviconDataUri) {
            // console.log("htmlTplStr bytes", htmlTplStr.length);
            let tplVars = {
                '$BG_COLOR$': bgColor,
                '$BG_DARKEN$': bgDarkenStr,
                '$TITLE$': pageTitle,
                '$LINK_URL$': pageUrl,
                '$LINK_TEXT$': Utils.toReadableUrl(pageUrl),
                '$IFRAME_URL$': ns.urls.parkFrame,
                //'$CSS_URL$': '',
                '$CSS_TEXT$': ns.getParkCssText(),
                '$SCREENSHOT_ID$': screenshotId,
                '$FAVICON_DATA_URI$': faviconDataUri,
                // '$DATE$': Utils.formatHumanReadableDateTime(),
                '$PARK_JS_URL$': ns.urls.parkJs,
            };
            // console.log("tplVars", tplVars);
            const htmlStr = Utils.expandStringTemplate(ns.getParkHtmlText(), tplVars);
            // console.log("htmlStr:", htmlStr);
            const b64 = Utils.b64EncodeUnicode(htmlStr);
            const dataUri = 'data:text/html;base64,' + b64;
            // console.log("dataUri", dataUri);
            callback(dataUri);
            // document.location.href = dataUri;
        });
    }

    function suspendTabPhase2(screenshotId, tabId, tabUrl, htmlDataUri, imageDataUri, scaleDown) {
        CommonUtils.scaleDownRetinaImage(scaleDown, imageDataUri, function (imageDataUri2) {
            const nowMillis = new Date() - 0; // GMT epoch millis
            const urlHash = Utils.fastIntHash(htmlDataUri);
            const storage = chrome.storage.local;
            const storageItems = {
                ['screenshot.id=' + screenshotId]: {
                    created: nowMillis,
                    urlHash: urlHash,
                    content: imageDataUri2,
                }
            };
            storage.set(storageItems, function () {
                const redirUrl = ns.urls.tempParkPage + '?uniq=' + Utils.getRandomInt();
                ns.addToSuspensionMap(redirUrl, tabId, htmlDataUri, nowMillis);

                chrome.tabs.update(tabId, {url: redirUrl});

                const storageItems2 = {
                    ['suspended.urlHash=' + urlHash]: {
                        screenshotId: screenshotId,
                        created: nowMillis,
                        urlHash: urlHash,
                        url: tabUrl,
                        tabId: tabId,
                    }
                };
                storage.set(storageItems2, function () {
                });
            });
        });
    }

    function suspendWindow(windowId) {
        // todo start iterating my tab objects, not chrome's
    }

    function unsuspendWindow(windowId) {
        // todo start iterating my tab objects, not chrome's
        chrome.windows.get(windowId, {'populate': true}, function (window) {
            for (let i in window.tabs) {
                if (window.tabs.hasOwnProperty(i)) {
                    const chrTab = window.tabs[i];
                    if (Utils.isDataUri(chrTab.url)) {
                        unsuspendTab(chrTab);
                    }
                }
            }
        });
    }

    function suspendCurrentWindow() {
        Utils.getCurrentWindowIdFromBackgroundScript(function (windowId) {
            suspendWindow(windowId)
        });
    }

    function unsuspendCurrentWindow() {
        Utils.getCurrentWindowIdFromBackgroundScript(function (windowId) {
            unsuspendWindow(windowId)
        });
    }

    function suspendCurrentTab() {
        Utils.getCurrentTabFromBackgroundScript((chtTab)=>{
            suspendTab(chtTab);
        });
    }

})();