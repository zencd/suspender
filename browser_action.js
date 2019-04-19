(() => {
    'use strict';

    const bg = chrome.extension.getBackgroundPage().backgroundScriptBts;

    document.querySelector('#suspend-current-tab').onclick = () => {
        bg.getTheNS().suspendCurrentTab();
        window.close();
    };
    document.querySelector('#suspend-current-window').onclick = () => {
        bg.getTheNS().suspendCurrentWindow();
        window.close();
    };
    document.querySelector('#unsuspend-current-window').onclick = () => {
        bg.getTheNS().unsuspendCurrentWindow();
        window.close();
    };
    document.querySelector('#show-options').onclick = () => {
        chrome.tabs.create({url: bg.getTheNS().urls.optionsHtml});
        window.close();
    };

    function sendMSG() {
        chrome.runtime.sendMessage(null, {
            message: 'MESSAGE_SUSPEND_FROM_BROWSER_ACTION',
        });
    }

})();