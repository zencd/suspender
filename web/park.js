function parseRgb(input) {
    const m = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (m) {
        return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    } else {
        console.log("parseRgb: unrecognized input:", input);
        return [255, 255, 255];
    }
}


// https://gist.github.com/gre/1650294
const EasingFunctions = {
    // no easing, no acceleration
    linear: function (t) {
        return t
    },
    // accelerating from zero velocity
    easeInQuad: function (t) {
        return t * t
    },
    // decelerating to zero velocity
    easeOutQuad: function (t) {
        return t * (2 - t)
    },
    // acceleration until halfway, then deceleration
    easeInOutQuad: function (t) {
        return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    },
    // accelerating from zero velocity
    easeInCubic: function (t) {
        return t * t * t
    },
    // decelerating to zero velocity
    easeOutCubic: function (t) {
        return (--t) * t * t + 1
    },
    // acceleration until halfway, then deceleration
    easeInOutCubic: function (t) {
        return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    },
    // accelerating from zero velocity
    easeInQuart: function (t) {
        return t * t * t * t
    },
    // decelerating to zero velocity
    easeOutQuart: function (t) {
        return 1 - (--t) * t * t * t
    },
    // acceleration until halfway, then deceleration
    easeInOutQuart: function (t) {
        return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
    },
    // accelerating from zero velocity
    easeInQuint: function (t) {
        return t * t * t * t * t
    },
    // decelerating to zero velocity
    easeOutQuint: function (t) {
        return 1 + (--t) * t * t * t * t
    },
    // acceleration until halfway, then deceleration
    easeInOutQuint: function (t) {
        return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
    }
};

const knownBgColor = parseRgb(document.body.dataset.bgColorDarken);
console.log("knownBgColor", knownBgColor);

const paddingTop = 70;
const height = 600;
const numSteps = 10;
// const startColor = [0, 0, 0, .98];
// const endColor = [0, 0, 0, 0.0];
const startColor = [knownBgColor[0], knownBgColor[1], knownBgColor[2], 1.0];
const endColor = [knownBgColor[0], knownBgColor[1], knownBgColor[2], 0.0];
const ranges = [
    (endColor[0] - startColor[0]),
    (endColor[1] - startColor[1]),
    (endColor[2] - startColor[2]),
    (endColor[3] - startColor[3]),
];
const stops = [];

// console.log("ranges", ranges);

for (let i = 0; i <= numSteps; i++) {
    const x = i / numSteps;
    const y = EasingFunctions.easeOutQuad(x);
    // console.log("x", x, "y", y);
    const r = Math.round(startColor[0] + ranges[0] * y);
    const g = Math.round(startColor[1] + ranges[1] * y);
    const b = Math.round(startColor[2] + ranges[2] * y);
    const a = (startColor[3] + ranges[3] * y).toFixed(4);
    // const pos = (x*100) + "%";
    const pos = paddingTop + (height * x) + "px";
    const s = "rgba(" + r + "," + g + "," + b + "," + a + ") " + pos;
    console.log("s", s);
    stops.push(s);
}

const gradientText = "linear-gradient(to bottom, " + stops.join(", ") + ")";
// console.log(gradientText);
document.querySelector('.overlay').style.background = gradientText;

/*
    background: linear-gradient(
            to bottom,
            hsl(0, 0%, 11%) 0%,
            hsla(0, 0%, 27.1%, 0.878) 11.6%,
*/