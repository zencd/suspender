class TabList {
    constructor() {
        this.tabById = {}; // tab id => TabHandle object
        this.currentTabs = {}; // window id => tab id
    }

    getTab(tabId) {
        return this.tabById[tabId];
    }

    getOrCreateTab(tabId) {
        let tab = this.tabById[tabId];
        if (!tab) {
            // console.log("creating TabHandle on demand", tabId);
            tab = new TabHandle(tabId);
            this.tabById[tabId] = tab;
        }
        return tab;
    }

    tabActivated(windowId, curTabId) {
        const prevTabId = this.currentTabs[windowId];
        this.currentTabs[windowId] = curTabId;
        if (prevTabId && prevTabId !== curTabId) {
            const prevTab = this.getTab(prevTabId);
            if (prevTab) {
                // absence of `prevTab` may mean it just has been closed, this is normal
                prevTab.lastSeen = new Date();
                prevTab.active = false;
            }
        }
        const curTab = this.getOrCreateTab(curTabId);
        curTab.active = true;
    }

    getAllTabs() {
        return Object.values(this.tabById);
    }

    removeById(tabId) {
        delete this.tabById[tabId];
    }

}

class TabHandle {
    constructor(tabId) {
        this.id = tabId; // Chrome's tab id, integer
        this.windowId = null; // Chrome's window id, integer
        this.url = null;
        this.lastSeen = new Date(); // Date
        this.active = false;
        this.suspended = false;
        this.discarded = false;
        this.audible = false;
        this.favIconUrl = null; // string
        this.pinned = false;
    }

    updateFromChromeTab(chromeTab) {
        if (chromeTab.url && chromeTab.url !== this.url) {
            this.suspended = false;
        }
        const propNames = ['active', 'discarded', 'audible', 'pinned', 'url', 'title', 'windowId', 'favIconUrl'];
        for (let i = 0; i < propNames.length; i++) {
            const propName = propNames[i];
            this[propName] = chromeTab[propName];
        }
    }
}
