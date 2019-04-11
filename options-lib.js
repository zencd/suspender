class StorageOptions {
    constructor(storagePrefix) {
        this.__storagePrefix = storagePrefix;
        this.__meta = {};
        this.__mapForGetRequest = {};
        this.__storageKeyToPropertyName = {};
        this.__storage = chrome.storage.sync;
        this.onPersisted = null; // function
    }

    defineOptionsFromProperties() {
        const INTERNAL_PROPERTIES = new Set(['onPersisted']);
        for (const propName in this) {
            if (this.hasOwnProperty(propName)) {
                if (!INTERNAL_PROPERTIES.has(propName) && !propName.startsWith('__')) {
                    this.defineOption(propName, this[propName]);
                }
            }
        }
    }

    defineOption(propName, defVal) {
        this.__meta[propName] = {
            name: propName,
            defVal: defVal,
            type: (defVal === null || defVal === undefined) ? null : typeof defVal,
        };
        const storageKey = this.__storagePrefix + propName;
        this.__mapForGetRequest[storageKey] = defVal;
        this.__storageKeyToPropertyName[storageKey] = propName;
        this[propName] = defVal;
    }

    parseStorage(items) {
        for (const storageKey in items) {
            if (items.hasOwnProperty(storageKey)) {
                const propName = this.__storageKeyToPropertyName[storageKey];
                if (propName) {
                    const meta = this.__meta[propName];
                    if (meta) {
                        this[meta.name] = items[storageKey];
                    }
                }
            }
        }
        // console.log("options parsed", this);
    }

    load(onload) {
        const thisOptions = this;
        thisOptions.__storage.get(thisOptions.__mapForGetRequest, function (items) {
            thisOptions.parseStorage(items);
            if (typeof onload !== 'undefined') {
                onload();
            }
        });
    }

    parsePropertyFromString(propName, stringValue) {
        const meta = this.__meta[propName];
        if (stringValue != null && meta != null && meta['type'] === 'number') {
            return Number(stringValue);
        }
        return stringValue;
    }

    saveOne(propName, value) {
        const thisOptions = this;
        this[propName] = value;
        const map = {};
        const storageKey = this.__storagePrefix + propName;
        map[storageKey] = value;
        thisOptions.__storage.set(map, function () {
            if (thisOptions.onPersisted) {
                thisOptions.onPersisted();
            }
        });
    }

    processChanges(changes, areaName) {
        // todo consider areaName
        for (const storageKey in changes) {
            if (changes.hasOwnProperty(storageKey)) {
                const newValue = changes[storageKey].newValue;
                const propName = this.__storageKeyToPropertyName[storageKey];
                if (propName) {
                    this[propName] = newValue;
                    console.log("options changed", propName, newValue);
                }
            }
        }
    }
}

class Options extends StorageOptions {
    constructor() {
        super('options.');
        this.suspendTimeout = 900; // seconds
        this.suspendPinned = false;
        this.unsuspendOnView = false;
        this.suspendActive = false;
        this.suspendAudible = false;
        this.suspendOffline = false;
        this.defineOptionsFromProperties(); // XXX call it AFTER all properties defined
    }
}
