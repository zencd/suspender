function scaleDownRetinaImageXX(origDataUri, onload) {
    const dpr = window.devicePixelRatio;
    if (dpr === 1) {
        return onload(origDataUri);
    }

    const $canvas = document.createElement('canvas');
    document.body.appendChild($canvas);
    const ctx = $canvas.getContext('2d');
    const img = new window.Image();
    img.onload = function () {
        const w2 = img.width / dpr;
        const h2 = img.height / dpr;
        console.log("img", img.width, 'x', img.height);
        $canvas.width = w2;
        $canvas.height = h2;
        // ctx.globalAlpha = 0.5;
        ctx.drawImage(img, 0, 0, w2, h2);
        const dataUri = $canvas.toDataURL("image/png");
        console.log("final dataUri", dataUri.length);
        console.log("final dataUri", dataUri);
        onload(dataUri);
    };
    img.src = origDataUri;
}

console.log("screenshotLarge", screenshotLarge.length);

// scaleDownRetinaImage(screenshotLarge, (dataUri) => {
//     // console.log("got dataUri", dataUri);
// });


