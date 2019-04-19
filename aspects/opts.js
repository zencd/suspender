(() => {
    'use strict';

    const ns = Utils.getNS()
        .export(initOptions)
        .export(getOptions)
        .export(addThisSiteToWhitelist);

    const options = new Options();

    function initOptions() {
        options.load(function () {
            console.log("options loaded from storage", options);
        });
        chrome.storage.onChanged.addListener(function (changes, areaName) {
            options.processChanges(changes, areaName);
        });
    }

    function getOptions() {
        return options;
    }

    function addThisSiteToWhitelist() {
    }

})();