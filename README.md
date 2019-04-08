# suspender

## todo p1

- remove screenshots from storage when tab closed
- remove a tab - it still stays in the tab list (debug tabs)
- don't suspend tabs which needs "Confirm Form Resubmission"
- does tabs get restored with the same tab id?
- call chrome.tabs.discard() on suspended tabs after timeout
- check for presence of TGS because it hooks on discard()

## todo p2

- a feature to move really old tabs to bookmarks

## todo p3

- after restart, make the "data uri" tabs connects to background not all at once, maybe request screenshot on demand only
- minimize permissions
- iframed.html: minimize template
- iframed.html: inline CSS to work smoothly even without the extension
- minimize screenshot size when pixel ratio is 2+
- make unique extension icons
- iframed: substitute favicon with a pale version data uri
- the data uri page: use a pale favicon to distinct suspended tabs easier
- try detect scrollbar presence and cut it off, or take screenshot without it initially
- when user unfreezes a tab make sure the content is still there, and warn maybe
- H2C: it renders full page - need to shrink it to limit image's weight
- there is a Chrome's feature: multi-tab selection

## todo options

- never suspend pinned tabs
- never suspend tabs that contain unsaved form inputs
- never suspend tabs that are playing audio
- never suspend active tabs
- never suspend tabs when offline
- never suspend tabs when connected to power source
- whitelist
- automatically unsuspend tab when it is viewed
- implement themes
- sync settings between different systems 

## bugs

+ cannot be suspended: https://www.vinyl-digital.com/
+ disable RMB click on screenshots (iframed.html)
- https://support.google.com/chrome/thread/2047906 "The message port closed"
- currently using domain root's favicon, but pages could use their own ones: https://vk.com/im?sel=c26
- Unchecked runtime.lastError: Cannot access contents of url "http://127.0.0.1:5000/". Extension manifest must request permission to access this host.
+ limit screenshot height with H2C opts, otherwise it weights 2MB plus
+ I manually rescale retina images, pass 'scale: 1' to H2C instead 

## refs

- Chrome prohibits redirects to data URI scheme: "Not allowed to navigate top frame to data URL"
- https://stackoverflow.com/questions/4573956/taking-screenshot-using-javascript-for-chrome-extensions/4574782
- https://gist.github.com/Rob--W/9654450
- https://developer.chrome.com/extensions/tabCapture#method-captureOffscreenTab
- http://html2canvas.hertzen.com/configuration/
- injecting ext's JS into a data uri html directly isn't possible (symbols aren't available) so using iframe still 
- https://developers.google.com/web/updates/2015/09/tab-discarding

## pro

- honest, precise screenshots, with images rendered (TGS)
- screenshots reflects page as user left it, not just capturing page's top (H2C, TGS)
- instant screenshots instead of the slower TGS (which depends on page size!)
- user should not fear of extension uninstall, update, sessions, etc
- fast browser startup (with many tabs frozen)
- extension uninstall does not discard suspended tabs
- N times faster than TGS
- no user tracking with GA/etc
- works well on retina
- competitors propagate many views (1 per tab) while my ext does not - this should affect memory usage
- after my ext installed user doesn't need to refresh tabs (check competitor's behaviour)

## tips

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
