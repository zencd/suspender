function chromeApiForIDE() {
    window.chrome = {
        commands: {
            onCommand: {
                addListener: ()=>{},
            },
        },
        contextMenus: {
            create: ()=>{},
        },
        extension: {
            getBackgroundPage: ()=>{},
            onMessage: {
                addListener: ()=>{},
            },
        },
        runtime: {
            onInstalled: {
                addListener: ()=>{},
            },
            getManifest: null,
            getURL: null,
        },
        storage: {
            onChanged: {
                addListener: ()=>{},
            },
        },
        tabs: {
            discard: null,
            get: null,
            update: null,
            sendMessage: null,
            captureVisibleTab: ()=>{},
            getAllInWindow: null,
            onActivated: {
                addListener: ()=>{},
            },
            onAttached: {
                addListener: ()=>{},
            },
            onDetached: {
                addListener: ()=>{},
            },
            onCreated: {
                addListener: ()=>{},
            },
            onUpdated: {
                addListener: ()=>{},
            },
            onReplaced: {
                addListener: ()=>{},
            },
            onRemoved: {
                addListener: ()=>{},
            },
            query: null,
            create: null,
            executeScript: null,
        },
        windows: {
            get: () => null,
        },
        webRequest: {
            onBeforeRequest: {
                addListener: ()=>{},
            },
        },
    };
}
