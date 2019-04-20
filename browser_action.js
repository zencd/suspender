(() => {
    'use strict';

    const root = chrome.extension.getBackgroundPage().root;

    function isUrlSuspendable(url) {
        // todo a copy from common.js
        return url && (url.startsWith('http://') || url.startsWith('https://'));
    }

    const $suspendTab = document.querySelector('#suspend-current-tab');

    const tab = root.getCurrentTab();
    if (tab) {
        if (isUrlSuspendable(tab.url)) {
            $suspendTab.classList.remove('disabled');
        } else {
            $suspendTab.classList.add('disabled');
        }
    }

    $suspendTab.onclick = () => {
        root.suspendCurrentTab();
        window.close();
    };
    document.querySelector('#suspend-current-window').onclick = () => {
        root.suspendCurrentWindow();
        window.close();
    };
    document.querySelector('#unsuspend-current-window').onclick = () => {
        root.unsuspendCurrentWindow();
        window.close();
    };
    document.querySelector('#show-options').onclick = () => {
        chrome.tabs.create({url: root.urls.optionsHtml});
        window.close();
    };

    function sendMSG() {
        chrome.runtime.sendMessage(null, {
            message: 'MESSAGE_SUSPEND_FROM_BROWSER_ACTION', // todo unused
        });
    }

})();