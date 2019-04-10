function Options() {
    this.meta = {};
    this.mapForGetRequest = {};
    this.defineOption('suspendTimeout', 900);
    this.defineOption('suspendPinned', false);
    return this;
}

Options.STORAGE_PREFIX = 'options.';

Options.prototype = {
    STORAGE_PREFIX: 'options.',
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
        console.log("options parsed", this);
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
        this[name] = value;
        const map = {};
        map[this.makeStorageKey(name)] = value;
        chrome.storage.sync.set(map, function () {
            console.log("options saved", map);
        });
    },
};

function initControls() {
    $suspendPinned.addEventListener('click', function () {
        options.save('suspendPinned', $suspendPinned.checked);
    });
}

function setControlsAsByStorage() {
    chrome.storage.sync.get(options.mapForGetRequest, function (items) {
        options.parseStorage(items);
        $suspendPinned.checked = options.suspendPinned;
    });
}

const $suspendPinned = document.querySelector('#suspend-pinned');
const options = new Options();
console.log("options initially", options);
document.addEventListener('DOMContentLoaded', function () {
    initControls();
    setControlsAsByStorage();
});
