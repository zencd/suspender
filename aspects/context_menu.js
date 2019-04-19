(() => {
    "use strict";

    const ns = Utils.getNS().export(initMenus);

    function initMenus() {
        chrome.runtime.onInstalled.addListener(function () {
            initContextMenu();
            initBrowserActionMenu();
        });
    }

    function initBrowserActionMenu() {
        const contexts = ['browser_action'];

        makeContextMenu({
            title: "Suspend",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.suspendTab(tab, true);
            }
        });
        makeContextMenu({
            title: "Suspend this window",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.suspendWindow(tab.windowId);
            }
        });
        makeContextMenu({
            title: "Unsuspend this window",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.unsuspendWindow(tab.windowId);
            }
        });
        makeContextMenu({
            title: "Never suspend this site",
            contexts: contexts,
            onclick: (info, tab) => {
            }
        });
    }

    function initContextMenu() {
        const contexts = [
            "page", "frame", "selection", "link", "editable", "image", "video", "audio"
        ];

        makeContextMenu({
            title: "Suspend",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.suspendTab(tab, true);
            }
        });
        makeContextMenu({
            type: 'separator',
            contexts: contexts,
        });
        makeContextMenu({
            title: "Suspend this window",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.suspendWindow(tab.windowId);
            }
        });
        makeContextMenu({
            title: "Unsuspend this window",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.unsuspendWindow(tab.windowId);
            }
        });
        makeContextMenu({
            type: 'separator',
            contexts: contexts,
        });
        makeContextMenu({
            title: "Never suspend this site",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.addThisSiteToWhitelist();
            }
        });
        makeContextMenu({
            type: 'separator',
            contexts: contexts,
        });
        makeContextMenu({
            title: "Debug Tabs",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.onContextMenuDebugTabs();
            }
        });
        makeContextMenu({
            title: "Discard Data URI Tabs",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.onContextMenuDiscardDataUriTabs();
            }
        });
        makeContextMenu({
            title: "Suspend via H2C",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.suspendTab(tab, false);
            }
        });
        makeContextMenu({
            title: "Suspend Old Tabs",
            contexts: contexts,
            onclick: (info, tab) => {
                ns.findOldTabsAndSuspendThem();
            }
        });
    }
    
    function makeContextMenu(params) {
        return chrome.contextMenus.create(params);
    }

})();