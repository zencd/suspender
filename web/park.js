function easeInOutQuad(t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function generateAndSetGradient() {
    const gradientStartColor = document.body.dataset.bgColorDarken.split(',').map((s) => parseInt(s));
    console.log("gradientStartColor", gradientStartColor);

    const gradientTopPadding = 50;
    const gradientHeight = 500;
    const gradientSteps = 10;
    const startColor = [gradientStartColor[0], gradientStartColor[1], gradientStartColor[2], 1.0];
    const endColor = [gradientStartColor[0], gradientStartColor[1], gradientStartColor[2], 0.1];
    const ranges = [
        (endColor[0] - startColor[0]),
        (endColor[1] - startColor[1]),
        (endColor[2] - startColor[2]),
        (endColor[3] - startColor[3]),
    ];

    const stops = [];
    for (let i = 0; i <= gradientSteps; i++) {
        const x = i / gradientSteps;
        const y = easeInOutQuad(x);
        const r = Math.round(startColor[0] + ranges[0] * y);
        const g = Math.round(startColor[1] + ranges[1] * y);
        const b = Math.round(startColor[2] + ranges[2] * y);
        const a = (startColor[3] + ranges[3] * y).toFixed(4);
        const pos = (gradientTopPadding + gradientHeight * x) + "px";
        const s = "rgba(" + r + "," + g + "," + b + "," + a + ") " + pos;
        // console.log("s", s);
        stops.push(s);
    }

    const gradientText = "linear-gradient(to bottom, " + stops.join(", ") + ")";
    // console.log(gradientText);
    document.querySelector('.overlay').style.background = gradientText;
}

function fadeInScreenshot($screenshot) {
    const maxOpacity = 0.8;
    const numFrames = 25;
    let frame = 0;
    requestAnimationFrame(function doFrame() {
        const x = frame / numFrames;
        const opacity = Math.pow(x, 2) * maxOpacity; // looks like a non linear formula feels better
        $screenshot.style.opacity = opacity;
        if (frame++ < numFrames) {
            requestAnimationFrame(doFrame);
        }
    });
}

const messageListener = window.addEventListener('message', function (messageEvent) {
    if (typeof messageEvent.data === 'object' && messageEvent.data.call === 'setScreenshot') {
        const dataUri = messageEvent.data.dataUri;
        const $screenshot = document.querySelector('.screenshot');
        fadeInScreenshot($screenshot);
        $screenshot.style.backgroundImage = 'url(' + dataUri + ')';
        // document.querySelector('.screenshot-parent').style.backgroundImage = undefined;
        $frame.remove();
        document.querySelector('#main-script').remove();
        document.querySelector('#park-js-script').remove();
        window.removeEventListener('message', messageListener);
    }
});

const loadListener = $frame.addEventListener("load", function () {
    // pass the original url to the frame, so we can redirect user to it onlick
    $frame.contentWindow.postMessage({call: 'setFrameParams', url: $anchor.href, tabId: gTabId}, '*');
    $frame.removeEventListener("load", loadListener);
});

generateAndSetGradient();