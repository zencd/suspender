(() => {
    "use strict";

    const ns = Utils.getNS()
        .export(getParkHtmlText)
        .export(getParkCssText)
        .export(prefetchResources);

    let gParkHtmlText = ''; // content fetched from `gParkHtmlUrl`
    let gParkCssText = ''; // content fetched from `gParkCssUrl`

    function prefetchResources() {
        function prefetchParkPageHtml() {
            fetch(ns.urls.parkHtml).then((response) => {
                response.text().then((text) => {
                    gParkHtmlText = Utils.stripCrLf(text).trim();
                });
            });
        }

        function prefetchParkPageCss() {
            fetch(ns.urls.parkCss).then((response) => {
                response.text().then((text) => {
                    gParkCssText = Utils.stripCrLf(text).trim();
                });
            });
        }

        const t1 = new Date();
        // console.log("t1", t1);
        // console.log("gParkCssText", gParkCssText);
        window.requestIdleCallback(() => {
            // console.log("resources requestIdleCallback, started in", (new Date() - t1), "ms");
            prefetchParkPageHtml();
            prefetchParkPageCss();
        }, { timeout: 3000 });
    }

    function getParkHtmlText() {
        return gParkHtmlText;
    }

    function getParkCssText() {
        return gParkCssText;
    }

})();