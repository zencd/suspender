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

generateAndSetGradient();
document.querySelector('#park-js-script').remove(); // remove this script element