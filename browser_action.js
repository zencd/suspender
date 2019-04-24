(() => {
    'use strict';

    const extBg = chrome.extension.getBackgroundPage().extBg;

    const $suspendTab = document.querySelector('#suspend-current-tab');
    const $suspendWindow = document.querySelector('#suspend-current-window');
    const $unsuspendWindow = document.querySelector('#unsuspend-current-window');
    const $showOptions = document.querySelector('#show-options');

    const tab = extBg.getCurrentTab();
    if (tab) {
        const suspendable = extBg.CommonUtils.isUrlSuspendable(tab.url);
        extBg.Utils.setCssClass($suspendTab, !suspendable, 'disabled');
    }

    menuClicked($suspendTab, () => extBg.suspendCurrentTab());
    menuClicked($suspendWindow, () => extBg.suspendCurrentWindow());
    menuClicked($unsuspendWindow, () => extBg.unsuspendCurrentWindow());
    menuClicked($showOptions, () => chrome.runtime.openOptionsPage());

    function menuClicked($elem, handler) {
        $elem.onclick = () => {
            handler();
            window.close();
        };
    }

})();