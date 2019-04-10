const options = new Options();

let notifierFadeOutTimer;
options.onPersisted = function () {
    clearTimeout(notifierFadeOutTimer);
    qs('.notify').style.display = 'block';
    notifierFadeOutTimer = setTimeout(function () {
        qs('.notify').style.display = 'none';
    }, 2500);
};

const ogm = new OptionsToGuiMapping(options);

disableLabelsForDisabledElements();

document.addEventListener('DOMContentLoaded', function () {
    ogm.init();
    setControlsAsByStorage();
});

function OptionsToGuiMapping(options) {
    this.controlByName = {};
    this.init = function () {
        this.initCheckboxes();
        this.initSelects();
    };
    this.initCheckboxes = function () {
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
    };
    this.initSelects = function () {
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
    };
    this.gotOptions = function () {
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
        ogm.gotOptions();
    });
}

function disableLabelsForDisabledElements() {
    const $elems = qsa('[disabled]');
    for (let i = 0; i < $elems.length; i++) {
        const id = $elems[i].id;
        if (id) {
            const $label = qs('label[for="' + id + '"]');
            if ($label) {
                $label.className += ' disabled';
            }
        }
    }
}
