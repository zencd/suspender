(function () {
    'use strict';

    console.log("park.js started at", new Date() - startTime);

    function easeInOutQuad(t) {
        return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }

    function generateAndSetGradient() {
        const bg = B.split(',').map((s) => parseInt(s)); // pre-calculated darken bg color

        const gradientTopPadding = 50;
        const gradientHeight = 500;
        const gradientSteps = 10;
        const opacity = [1.0, 0.1];
        const startColor = [bg[0], bg[1], bg[2], opacity[0]];
        const endColor = [bg[0], bg[1], bg[2], opacity[1]];
        const ranges = [
            (endColor[0] - startColor[0]),
            (endColor[1] - startColor[1]),
            (endColor[2] - startColor[2]),
            (endColor[3] - startColor[3])
        ];

        const stops = [];
        for (let i = 0; i <= gradientSteps; i++) {
            const x = i / gradientSteps; // [0..1]
            const y = easeInOutQuad(x); // [0..1]
            const r = Math.round(startColor[0] + ranges[0] * y);
            const g = Math.round(startColor[1] + ranges[1] * y);
            const b = Math.round(startColor[2] + ranges[2] * y);
            const a = (startColor[3] + ranges[3] * y).toFixed(3);
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

    function getFrameUrl() {
        // return url like "chrome-extension://xxx/park/park_frame.html"
        const $script = document.querySelector('script[src^="chrome-extension:"]');
        return $script.src.substring(0, $script.src.indexOf('/', 20)) + '/park/park_frame.html';
    }

    const $screenshot = document.querySelector('.screenshot');
    // const $anchor = document.querySelector('.title a');

    // const $frame = document.querySelector('iframe');
    const $frame = document.createElement('iframe');
    $frame.style.display = 'none';
    $frame.src = getFrameUrl();
    $frame.addEventListener("load", function loadListener() {
        console.log("frame loaded after", (new Date() - startTime));
        // pass the original url to the frame, so we can redirect user to it onlick
        $frame.contentWindow.postMessage({call: 'setFrameParams', screenshotId: S}, '*');
        $frame.removeEventListener("load", loadListener);
    });
    document.body.appendChild($frame);

    window.addEventListener('message', function messageListener(messageEvent) {
        if (typeof messageEvent.data === 'object' && messageEvent.data.call === 'setScreenshot') {
            console.log("park.js received setScreenshot at", (new Date() - messageEvent.data.startTime));
            fadeInScreenshot($screenshot);
            $screenshot.style.backgroundImage = 'url(' + messageEvent.data.dataUri + ')';
            const took = new Date() - messageEvent.data.startTime;
            console.log("from the click it took:", took, "with num tries:", messageEvent.data.numTries);
            // cleaning DOM
            $frame.remove();
            document.querySelector('script').remove();
            document.querySelector('script').remove();
            window.removeEventListener('message', messageListener);
        }
    });

    generateAndSetGradient();
})();