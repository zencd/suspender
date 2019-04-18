document.querySelector('#suspend-current-tab').onclick = () => {
    const bgExt = chrome.extension.getBackgroundPage().bgExt;
    console.log("bgExt", bgExt);
};
