# suspender

## todo p1

- watch for tabs and suspend them after a timeout
- remove screenshots from storage when tab closed
- try inject ext's JS instead of the iframe

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

## todo p3

- minimize permissions
- iframed.html: minimize template
- iframed.html: inline CSS to work smoothly even without the extension
- minimize screenshot size when pixel ratio is 2+
- make extension icons
- iframed: substitute favicon (a data uri version probably)
- the data uri page: use a pale favicon to distinct suspended tabs easier
- try detect scrollbar presence and cut it off, or take screenshot without it initially
- when user unfreezes a tab make sure the content is still there, and warn maybe

## bugs

- cannot be suspended: gmail - it only refreshes
- cannot be suspended: https://www.vinyl-digital.com/index.php?lang=0&&redirected=1
+ disable RMB click on screenshots (iframed.html)
- retina: switch from background image to IMG to be able to transform scale(0.5, 0.5)

## refs

- Chrome prohibits redirects to data URI scheme: "Not allowed to navigate top frame to data URL"
- https://stackoverflow.com/questions/4573956/taking-screenshot-using-javascript-for-chrome-extensions/4574782
- https://gist.github.com/Rob--W/9654450
- https://developer.chrome.com/extensions/tabCapture#method-captureOffscreenTab
- http://html2canvas.hertzen.com/configuration/

## pro

- honest, precise screenshots, with images rendered (TGS)
- screenshots reflects page as user left it, not just capturing page's top (H2C, TGS)
- instant screenshots instead of the slower TGS (which depends on page size!)
- user should not fear of extension uninstall, update, sessions, etc
- extension uninstall does not discard suspended tabs
- N times faster than TGS
- no user tracking
- works well on retina
- competitors propagate many views (1 per tab) while my ext does not - this should affect memory usage

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
