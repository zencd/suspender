(() => {

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

        prefetchParkPageHtml();
        prefetchParkPageCss();
    }

    function getParkHtmlText() {
        return gParkHtmlText;
    }

    function getParkCssText() {
        return gParkCssText;
    }

})();