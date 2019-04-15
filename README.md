# suspender

## todo p1

- remove screenshots from storage when tab closed
- remove a tab - it still stays in the tab list (debug tabs)
- don't suspend tabs which needs "Confirm Form Resubmission"
- does tabs get restored with the same tab id?
- call chrome.tabs.discard() on suspended tabs after timeout

## todo p2

- whitelist

## todo p3

- a feature to move really old tabs to bookmarks
- check for presence of TGS because it hooks on discard()
- minimize permissions
- park.html: minify template
- park.html: inline CSS to work smoothly even without the extension
- make unique extension icons
- when user unfreezes a tab make sure the content is still there, and warn maybe
- there is a Chrome's feature: multi-tab selection
- try use Chrome's image caching to pick screenshot from cache first, and then from `storage` if missed
- try different gradients for bright/dark sites
- park: bg color: darken it because of gradients applied
- park: gradient: calc gradient's start color from the bg color: the pure black gradient looks too dark for white backgrounds

## bugs

- https://support.google.com/chrome/thread/2047906 "The message port closed"
- currently using domain root's favicon, but pages could use their own ones: https://vk.com/im?sel=c26
- Unchecked runtime.lastError: Cannot access contents of url "http://127.0.0.1:5000/". Extension manifest must request permission to access this host.
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
