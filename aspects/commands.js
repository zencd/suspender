(()=>{
    "use strict";

    const ns = Utils.getNS().export(initCommandListener);

    function initCommandListener() {
        chrome.commands.onCommand.addListener((command) => {
            console.log("command", command, typeof command);
            if (command === '1-suspend-tab') {
                Utils.getCurrentTabFromBackgroundScript((chrTab) => {
                    ns.suspendTab(chrTab, true);
                });
            }
        });
    }

})();