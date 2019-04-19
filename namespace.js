class __BtsSharedNamespace {
    constructor() {
        function notExported() {}
        this.prefetchResources = notExported;
        this.initMenus = notExported;
        this.initWebRequestListeners = notExported;
        this.initTabListeners = notExported;
        this.initTabWatchTimer = notExported;
        this.inspectExistingTabs = notExported;
        this.initCommandListener = notExported;
        this.getTabs = notExported;
        this.suspendTab = notExported;
        this.suspendWindow = notExported;
        this.suspendTabPhase2 = notExported;
        this.unsuspendWindow = notExported;
        this.addThisSiteToWhitelist = notExported;
        this.onContextMenuDebugTabs = notExported;
        this.onContextMenuDiscardDataUriTabs = notExported;
        this.findOldTabsAndSuspendThem = notExported;
        this.addToSuspensionMap = notExported;
        this.getParkHtmlText = notExported;
        this.getParkCssText = notExported;
        this.suspendCurrentWindow = notExported;
        this.unsuspendCurrentWindow = notExported;
        this.suspendCurrentTab = notExported;
        this.initOptions = notExported;
        this.getOptions = notExported;

        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                const method = this[prop];
                if (method === notExported) {
                    this[prop] = function () {
                        throw 'method `' + prop + '` has not been exported by an aspect';
                    }
                }
            }
        }
    }

    export(method) {
        if (this[method.name]) {
            const s = this[method.name].toString();
            // console.log("s", s);
            if (s.indexOf('has not been exported') < 0) {
                console.warn("method with this name is already exported:", method.name);
            }
        }
        this[method.name] = method;
        return this;
    }
}
