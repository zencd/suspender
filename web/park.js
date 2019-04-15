// https://gist.github.com/gre/1650294
const EasingFunctions = {
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

const gradientStartColor = document.body.dataset.bgColorDarken.split(',').map((s)=>parseInt(s));
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
    const y = EasingFunctions.easeInOutQuad(x);
    const r = Math.round(startColor[0] + ranges[0] * y);
    const g = Math.round(startColor[1] + ranges[1] * y);
    const b = Math.round(startColor[2] + ranges[2] * y);
    const a = (startColor[3] + ranges[3] * y).toFixed(4);
    const pos = (gradientTopPadding + gradientHeight * x) + "px";
    const s = "rgba(" + r + "," + g + "," + b + "," + a + ") " + pos;
    console.log("s", s);
    stops.push(s);
}

const gradientText = "linear-gradient(to bottom, " + stops.join(", ") + ")";
// console.log(gradientText);
document.querySelector('.overlay').style.background = gradientText;
