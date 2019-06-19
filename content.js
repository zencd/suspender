(function () {
    "use strict";

    console.log('BTS: content.js init');

    let formFilled = false;

    initMessageListener();
    initFormFillingListener();

    function initMessageListener() {
        chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
            if (msg.message === 'MESSAGE_GET_PAGE_INFO') {
                sendResponse({
                    backgroundColor: findBgColor(),
                });
            } else if (msg.message === 'MESSAGE_TAKE_H2C_SCREENSHOT') {
                console.log("BTS: formFilled", formFilled);
                console.log("BTS: msg.suspendFilledForms", msg.suspendFilledForms);
                if (!formFilled || msg.suspendFilledForms === true) {
                    logToBg("gonna suspend tab", "formFilled:", formFilled, "suspendFilledForms:", msg.suspendFilledForms, document.location.href, new Date());
                    takeScreenshot(canvas => {
                        logToBg("h2c screenshot taken");
                        chrome.runtime.sendMessage(null, {
                            message: 'MESSAGE_H2C_SCREENSHOT_READY',
                            tabId: msg.tabId,
                            imageDataUri: canvas.toDataURL(),
                            backgroundColor: findBgColor(),
                        });
                    });
                } else {
                    logToBg("tab won't be suspended because of a form", document.location.href);
                    console.debug("BTS: won't suspend this tab: form filling noticed");
                }
            }
        });
    }

    function logToBg() {
        const args = Array.prototype.slice.call(arguments);
        chrome.runtime.sendMessage(null, {message: 'MESSAGE_LOG_TO_BG', args: args});
    }

    function takeScreenshot(onCanvas) {
        const opts = {
            height: window.innerHeight, // capturing only the visible area
            width: window.innerWidth, // force it, otherwise it will be calculated automatically and slightly wrong
            scale: 1, // scale=1 forces normal size screenshot on retina, ready for CSS pixels
            //imageTimeout: 40*1000,
            //allowTaint: true,
            useCORS: true, // I found, with 'false' it even won't try to fetch images from different domains
        };
        html2canvas(document.body, opts).then(onCanvas);
    }

    function findBgColor() {
        let color = 'rgb(255,255,255)';
        if (document.body) {
            color = getComputedStyle(document.body).backgroundColor;
            if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
                color = 'rgb(255,255,255)';
            }
        }
        return color;
    }

    function initFormFillingListener() {
        const evName = 'keypress';
        // String.fromCharCode(charcode);
        window.addEventListener(evName, function lookForFormFilling(event) {
            if (event.target.tagName) {
                const tagUpper = event.target.tagName.toUpperCase();
                if (tagUpper === 'INPUT' || tagUpper === 'TEXTAREA' || event.target.isContentEditable === true || event.target.type === "application/pdf") {
                    formFilled = true;
                    console.debug("BTS: form filling noticed");
                    window.removeEventListener(evName, lookForFormFilling);
                }
            }
        });
    }

})();