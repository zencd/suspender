const bgExt = chrome.extension.getBackgroundPage().bgExt;

document.querySelector('#suspend-current-tab').onclick = () => {
    bgExt.suspendCurrentTab();
    window.close();
};
document.querySelector('#suspend-current-window').onclick = () => {
    bgExt.suspendCurrentWindow();
    window.close();
};
document.querySelector('#unsuspend-current-window').onclick = () => {
    bgExt.unsuspendCurrentWindow();
    window.close();
};
document.querySelector('#show-options').onclick = () => {
    chrome.tabs.create({url: bgExt.urls.optionsHtml});
    window.close();
};

// window.onblur = () => {
//     window.close();
// };