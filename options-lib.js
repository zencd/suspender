function Options() {
    this.meta = {};
    this.mapForGetRequest = {};
    this.defineOption('suspendTimeout', 900);
    this.defineOption('suspendPinned', false);
    this.defineOption('unsuspendOnView', false);
    this.defineOption('suspendActive', false);
    this.defineOption('suspendUnsavedForm', false);
    this.defineOption('suspendOffline', false);
    this.onPersisted = null; // function
    return this;
}

Options.STORAGE_PREFIX = 'options.';

Options.prototype = {
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
    save: function (name, value) {
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
