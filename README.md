# suspender

## todo p1

- test it with multiple windows
- implement chrome.windows.onFocusChanged
- don't suspend tabs which needs "Confirm Form Resubmission" (POST)
- call chrome.tabs.discard() on suspended tabs after timeout
- encode variables passed to template `park.html`
- implement a job to cleanup unused local storage objects
- whitelist
- after laptop's lid opened: make sure to add some timeout

## todo p2

- parked page: selecting text with mouse leads to tab unsuspended
- open an url with no internet, reload ext => Unchecked runtime.lastError: Cannot access contents of url "chrome-error://chromewebdata/". Extension manifest must request permission to access this host.

## todo p3

- find favicon via tag like <link rel="icon" href="https://***/4c23c.ico">
- try inject large lib H2C asynchronously
- all jobs: start using an "already running" flag to prevent interference
- pre-build parking html template for the zip version
- implement error handling/reporting?
- idea: add some visual indication the suspension process has started
- a feature to move really old tabs to bookmarks
- check for presence of TGS because it hooks on discard()
- make unique extension icons
- when user unfreezes a tab make sure the content is still there, and warn maybe
- check: Chrome's feature: multi-tab selection
- maybe there is a better place for 500KB objects than local storage
- try find safe colors for gradient (maybe prebuilt image) - currently it looks distinguishably stepped
- try obtain favicon from the actual html first
- park.js starts executing in 60+ ms - try reduce it
+ parking page: make sure the "file" protocol works ok

## bugs

- uninstall the ext, install it again - "unsuspend window" has no effect as db removed

## done

+ check how redirect to data uri works offline (works ok)
+ not needed: consider onSuspend event: https://developer.chrome.com/extensions/runtime#event-onSuspend
+ maybe check `suspensionMap` periodically for old entries to avoid memory leaks
+ wont fix: remove screenshots from storage when tab closed
+ inject content scripts into existing tabs
+ Unchecked runtime.lastError: Cannot access contents of url "http://127.0.0.1:5000/". Extension manifest must request permission to access this host.
+ https://support.google.com/chrome/thread/2047906 "The message port closed"
+ suspend all
+ a job to remove possible stale redirects 
+ browser action: show options: try to switch to existing tab first
+ parking: wait till screenshot get appeared in DB (because it is persisted asynchronously now)
+ don't wait till screenshot is finished to store into DB
+ minimize permissions
+ OPTI: inject the content script programmatically, and only when it's time to take a screenshot (a Google's suggestion)
+ in BG page: need to close suspended tabs' ports somehow: The message port closed before a response was received.
+ "never" suspend does not work
+ park.html: minify template
+ park.html: inline CSS to work smoothly even without the extension
+ try different gradients for bright/dark sites
+ park: bg color: darken it because of gradients applied
+ park: gradient: calc gradient's start color from the bg color: the pure black gradient looks too dark for white backgrounds
+ BUG: unsuspend all; in 1 minute the bg tabs gonna be auto suspended again (refresh the date!)
+ DENIED: try detect scrollbar presence and cut it off, or take screenshot without it initially
+ cannot be suspended: https://www.vinyl-digital.com/
+ disable RMB click on screenshots (park.html)
+ limit screenshot height with H2C opts, otherwise it weights 2MB plus
+ I manually rescale retina images, pass 'scale: 1' to H2C instead 
+ H2C: it renders full page - need to shrink it to limit image's weight
+ park: substitute favicon with a pale version data uri
+ the data uri page: use a pale favicon to distinct suspended tabs easier
+ minimize screenshot size when pixel ratio is 2+

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
