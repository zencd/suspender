function loadAndProcessFavicon(favIconUrl, onload) {
    const $canvas = document.createElement('canvas');
    // document.body.appendChild($iconCanvas);
    const ctx = $canvas.getContext('2d');
    const img = new window.Image();
    img.onload = function () {
        console.log("img", img.width, 'x', img.height);
        $canvas.width = img.width;
        $canvas.height = img.height;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(img, 0, 0);
        const dataUri = $canvas.toDataURL("image/png");
        onload(dataUri);
    };
    img.src = favIconUrl;
}

/**
 * converts 'https://mail.google.com/mail/u/0/#inbox'
 * into 'chrome://favicon/https://mail.google.com/'
 * @param url
 * @returns {string}
 */
function getChromeFaviconUrl(url) {
    const i = url.indexOf('/', 8);
    url = (i >= 0) ? url.substring(0, i + 1) : url;
    console.log("tmp", url);
    return 'chrome://favicon/' + url
}

loadAndProcessFavicon('https://ssl.gstatic.com/ui/v1/icons/mail/images/2/unreadcountfavicon/0_2x.png', (dataUri) => {
    console.log("got dataUri", dataUri);
});

console.log("getChromeFaviconUrl", getChromeFaviconUrl('https://mail.google.com/mail/u/0/#inbox'));