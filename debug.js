const extBg = chrome.extension.getBackgroundPage().extBg;

const $btnDebug = document.querySelector('#debugTabs');
$btnDebug.onclick = () => {
    log('hi ' + new Date());
};

const $log = document.querySelector('.log');

function log() {
    const args = Array.prototype.slice.call(arguments);
    const s = args.join(' ');
    $log.innerText += s + '\n';
}