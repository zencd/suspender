# tips

## storage

    chrome.storage.local.get((result)=>{console.log(Object.keys(result))})
    
    chrome.storage.local.get((result)=>{console.log(result)})
    
    chrome.storage.local.remove(keys, ()=>{console.log('removed')})
    
    chrome.storage.local.clear();

##### refs

- Chrome prohibits redirects to data URI scheme: "Not allowed to navigate top frame to data URL"
- https://stackoverflow.com/questions/4573956/taking-screenshot-using-javascript-for-chrome-extensions/4574782
- https://gist.github.com/Rob--W/9654450
- https://developer.chrome.com/extensions/tabCapture#method-captureOffscreenTab
- http://html2canvas.hertzen.com/configuration/
- injecting ext's JS into a data uri html directly isn't possible (symbols aren't available) so using iframe still 
- https://developers.google.com/web/updates/2015/09/tab-discarding

##### refer to background page

chrome.runtime.getBackgroundPage(function (bgpage)

##### list all windows and tabs within them

    chrome.windows.getAll({'populate': true}, function (windows) {
        for (var wi in windows) {
            if (windows.hasOwnProperty(wi)) {
                var tabs = [];
                for (var j in windows[wi].tabs) {
                    if (windows[wi].tabs.hasOwnProperty(j)) {

##### content script injection

	"content_scripts": [
    {
		"matches": ["https://*/*","http://*/*", "<all_urls>"],
		"js": ["lib/h2c.js","inject.js"],
		"run_at": "document_end",
		"all_frames" : false
    }

##### favicon

    "permissions": ["chrome://favicon/"],
    "content_security_policy": "img-src chrome://favicon;"
    
    chrome://favicon/http://ya.ru/

##### check ext installed

`chrome.management.get`

https://developer.chrome.com/extensions/management

##### easings

https://gist.github.com/gre/1650294

##### detecting form editing

    window.addEventListener('keydown', formInputListener);
    
    function formInputListener(e) {
    if (!isReceivingFormInput && !tempWhitelist) {
      if (event.keyCode >= 48 && event.keyCode <= 90 && event.target.tagName) {
        if (
          event.target.tagName.toUpperCase() === 'INPUT' ||
          event.target.tagName.toUpperCase() === 'TEXTAREA' ||
          event.target.tagName.toUpperCase() === 'FORM' ||
          event.target.isContentEditable === true
        ) {
          isReceivingFormInput = true;
          if (!isBackgroundConnectable()) {
            return false;
          }
          chrome.runtime.sendMessage(buildReportTabStatePayload());
        }
      }
    }
    }

##### pack ext

    chrome.exe --pack-extension=c:\myext --pack-extension-key=c:\myext.pem --no-message-box

http://www.adambarth.com/experimental/crx/docs/crx.html

## get manifest parsed

    chrome.runtime.getManifest()

## misc

https://developer.chrome.com/extensions/user_interface

## log array

    function log() {
        const args = Array.prototype.slice.call(arguments);
        args.unshift('BTS:');
        window.console.log.apply(null, args);
    }

    const logArray = function (args) {
        console.log.apply(null, args);
    };

## detect form editing

      if (event.keyCode >= 48 && event.keyCode <= 90 && event.target.tagName) {
        if (
          event.target.tagName.toUpperCase() === 'INPUT' ||
          event.target.tagName.toUpperCase() === 'TEXTAREA' ||
          event.target.tagName.toUpperCase() === 'FORM' ||
          event.target.isContentEditable === true ||
          event.target.type === "application/pdf"
