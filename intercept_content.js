/**
 * code in inject.js
 * added "web_accessible_resources": ["injected.js"] to manifest.json
 */

console.log("intercept_content.js working");

var s = document.createElement('script');
s.src = chrome.extension.getURL('intercept_inject.js');
s.onload = function() {
    //this.remove();
};
(document.head || document.documentElement).appendChild(s);
