const $suspendPinned = document.querySelector('#suspend-pinned');
const options = new Options();
options.onsave = function () {
    console.log("options saved", options);
};
console.log("options initially", options);

const ogm = new OptionsGuiMapping();

function OptionsGuiMapping() {
    this.checkboxByName = {};
    this.init = function (options) {
        const checkboxes = qsa('input[type="checkbox"]');
        for (let i = 0; i < checkboxes.length; i++) {
            const cbx = checkboxes[i];
            if (cbx.dataset.storageName) {
                this.checkboxByName[cbx.dataset.storageName] = cbx;
                cbx.addEventListener('click', function () {
                    options.save(cbx.dataset.storageName, cbx.checked);
                });
            }
        }
    };
    this.gotOptions = function (options) {
        for (const name in this.checkboxByName) {
            if (this.checkboxByName.hasOwnProperty(name)) {
                const $cbx = this.checkboxByName[name];
                if ($cbx) {
                    $cbx.checked = options[name];
                }
            }
        }
    };
    return this;
}

function setControlsAsByStorage() {
    chrome.storage.sync.get(options.mapForGetRequest, function (items) {
        options.parseStorage(items);
        ogm.gotOptions(options);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    ogm.init(options);
    setControlsAsByStorage();
});
