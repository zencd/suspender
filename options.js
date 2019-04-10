const options = new Options();
options.onPersisted = function () {
    // console.log("options saved", options);
    qs('.notify').className += ' elementFadeOut';
};

const ogm = new OptionsGuiMapping();

function OptionsGuiMapping() {
    this.controlByName = {};
    this.init = function (options) {
        {
            const controls = qsa('input[type="checkbox"]');
            for (let i = 0; i < controls.length; i++) {
                const cbx = controls[i];
                if (cbx.dataset.storageName) {
                    this.controlByName[cbx.dataset.storageName] = {
                        type: 'checkbox',
                        control: cbx,
                    };
                    cbx.addEventListener('click', function () {
                        options.save(cbx.dataset.storageName, cbx.checked);
                    });
                }
            }
        }
        {
            const $controls = qsa('select');
            for (let i = 0; i < $controls.length; i++) {
                const $control = $controls[i];
                if ($control.dataset.storageName) {
                    this.controlByName[$control.dataset.storageName] = {
                        type: 'select',
                        control: $control,
                    };
                    $control.addEventListener('change', function () {
                        options.save($control.dataset.storageName, $control.value);
                    });
                }
            }
        }
    };
    this.gotOptions = function (options) {
        for (const name in this.controlByName) {
            if (this.controlByName.hasOwnProperty(name)) {
                const data = this.controlByName[name];
                if (data) {
                    if (data.type === 'checkbox') {
                        const $cbx = data.control;
                        $cbx.checked = options[name];
                    } else if (data.type === 'select') {
                        const $cbx = data.control;
                        $cbx.value = options[name];
                    }
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
