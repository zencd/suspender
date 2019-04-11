function Options() {
    this.suspendTimeout = 900; // seconds
    this.suspendPinned = false;
    this.unsuspendOnView = false;
    this.suspendActive = false;
    this.suspendAudible = false;
    this.suspendOffline = false;
    this.__meta = {};
    this.__mapForGetRequest = {};
    this.__storageKeyToPropertyName = {};
    this.onPersisted = null; // function
    this.defineOptionsFromProperties(); // XXX call it AFTER all properties defined
    return this;
}

Options.STORAGE_PREFIX = 'options.';

Options.INTERNAL_PROPERTIES = new Set(['onPersisted']);

Options.prototype = {
    defineOptionsFromProperties: function () {
        for (const propName in this) {
            if (this.hasOwnProperty(propName)) {
                if (!Options.INTERNAL_PROPERTIES.has(propName) && !propName.startsWith('__')) {
                    this.defineOption(propName, this[propName]);
                }
            }
        }
    },
    defineOption: function (propName, defVal) {
        this.__meta[propName] = {
            name: propName,
            defVal: defVal,
        };
        const storageKey = this.makeStorageKey(propName);
        this.__mapForGetRequest[storageKey] = defVal;
        this.__storageKeyToPropertyName[storageKey] = propName;
        this[propName] = defVal;
    },
    parseStorage: function (items) {
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
    },
    makeStorageKey: function (optionName) {
        return Options.STORAGE_PREFIX + optionName;
    },
    load: function (onload) {
        const thisOptions = this;
        chrome.storage.sync.get(thisOptions.__mapForGetRequest, function (items) {
            thisOptions.parseStorage(items);
            if (typeof onload !== 'undefined') {
                onload();
            }
        });
    },
    saveOne: function (propName, value) {
        const thisOptions = this;
        this[propName] = value;
        const map = {};
        map[this.makeStorageKey(propName)] = value;
        chrome.storage.sync.set(map, function () {
            if (thisOptions.onPersisted) {
                thisOptions.onPersisted();
            }
        });
    },
};
