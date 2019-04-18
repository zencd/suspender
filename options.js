(function () {

    'use strict';

    const options = new Options(optionsPersisted);

    let notifierFadeOutTimer;

    const ogm = new OptionsToGuiMapping(options);

    disableLabelsForDisabledElements();

    const manifest = chrome.runtime.getManifest();
    // console.log("manifest", manifest);
    document.title = manifest.name;
    qs('h1').childNodes[0].nodeValue = manifest.name + ' '; // set text node
    qs('.version').innerText = '' + manifest.version;

    document.addEventListener('DOMContentLoaded', function () {
        ogm.init();
        setControlsAsByStorage();
    });

    CommonUtils.makeSpecialLinkClickable(qs('#open-keyboard-shortcuts'), true);

    function optionsPersisted() {
        clearTimeout(notifierFadeOutTimer);
        qs('.notify').style.display = 'block';
        notifierFadeOutTimer = setTimeout(function () {
            qs('.notify').style.display = 'none';
        }, 2500);
    }

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
                        options.saveOne(cbx.dataset.storageName, cbx.checked);
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
                        const propName = $control.dataset.storageName;
                        let value = options.parsePropertyFromString(propName, $control.value);
                        options.saveOne(propName, value);
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
        options.load(function () {
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
})();
