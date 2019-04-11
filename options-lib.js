function Options() {
    this.suspendTimeout = 900; // seconds
    this.suspendPinned = false;
    this.unsuspendOnView = false;
    this.suspendActive = false;
    this.suspendAudible = false;
    this.suspendOffline = false;
    this.meta = {};
    this.mapForGetRequest = {};
    this.onPersisted = null; // function
    this.defineOptionsFromProperties(); // XXX call it AFTER all properties defined
    return this;
}

Options.STORAGE_PREFIX = 'options.';

Options.INTERNAL_PROPERTIES = new Set(['meta', 'mapForGetRequest', 'onPersisted']);

Options.prototype = {
    defineOptionsFromProperties: function () {
        for (const propName in this) {
            if (this.hasOwnProperty(propName)) {
                if (!Options.INTERNAL_PROPERTIES.has(propName)) {
                    this.defineOption(propName, this[propName]);
                }
            }
        }
    },
    defineOption: function (name, defVal) {
        this.meta[name] = {
            name: name,
            defVal: defVal,
        };
        this.mapForGetRequest[this.makeStorageKey(name)] = defVal;
        this[name] = defVal;
    },
    parseStorage: function (items) {
        for (const storageKey in items) {
            if (items.hasOwnProperty(storageKey)) {
                const propName = this.parseStorageKey(storageKey);
                if (propName) {
                    const meta = this.meta[propName];
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
    parseStorageKey: function (storageKey) {
        if (storageKey.startsWith(Options.STORAGE_PREFIX)) {
            return storageKey.substr(Options.STORAGE_PREFIX.length);
        }
        return null;
    },
    load: function (onload) {
        const thisOptions = this;
        chrome.storage.sync.get(thisOptions.mapForGetRequest, function (items) {
            thisOptions.parseStorage(items);
            if (typeof onload !== 'undefined') {
                onload();
            }
        });
    },
    saveOne: function (name, value) {
        const thisOptions = this;
        this[name] = value;
        const map = {};
        map[this.makeStorageKey(name)] = value;
        chrome.storage.sync.set(map, function () {
            if (thisOptions.onPersisted) {
                thisOptions.onPersisted();
            }
        });
    },
};
