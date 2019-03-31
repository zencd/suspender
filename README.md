# suspender

## todo p1

- watch for tabs and suspend them after a timeout
- remove screenshots from storage when tab closed

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

## bugs

- gmail cannot be suspended - it only refreshes

## refs

- Chrome prohibits redirects to data URI scheme: "Not allowed to navigate top frame to data URL"
- https://stackoverflow.com/questions/4573956/taking-screenshot-using-javascript-for-chrome-extensions/4574782
- https://gist.github.com/Rob--W/9654450
- https://developer.chrome.com/extensions/tabCapture#method-captureOffscreenTab

## pro

- honest, precise screenshots
- screenshots reflects page as user left it, not just capturing page's top
- extension uninstall does not discard suspended tabs
- N times faster than TGS
- no user tracking
- works well on retina
