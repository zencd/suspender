class __BtsSharedNamespace {
    static METHOD_NOT_EXPORTED = "method must be replaced by actual implementation";

    constructor() {
        function notExported() {
            throw __BtsSharedNamespace.METHOD_NOT_EXPORTED;
        }
        this.prefetchResources = notExported;
        this.initMenus = notExported;
        this.initWebRequestListeners = notExported;
        this.initTabListeners = notExported;
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
    }

    export(method) {
        if (this[method.name]) {
            const s = this[method.name].toString();
            // console.log("s", s);
            if (s.indexOf('METHOD_NOT_EXPORTED') < 0) {
                console.warn("method with this name is already exported:", method.name);
            }
        }
        this[method.name] = method;
        return this;
    }
}
