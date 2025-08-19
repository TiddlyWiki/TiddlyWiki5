/*\
title: $:/core/modules/info/windowdimensions.js
type: application/javascript
module-type: info
\*/

exports.getInfoTiddlerFields = function(updateInfoTiddlersCallback) {
	if(!$tw.browser) {
		return [];
	}

	class WindowDimensionsTracker {
		constructor(updateCallback) {
			this.updateCallback = updateCallback;
			this.resizeHandlers = new Map();
			this.dimensionsInfo = [
				["outer/width", win => win.outerWidth],
				["outer/height", win => win.outerHeight],
				["inner/width", win => win.innerWidth],
				["inner/height", win => win.innerHeight],
				["client/width", win => win.document.documentElement.clientWidth],
				["client/height", win => win.document.documentElement.clientHeight]
			];
		}

		buildTiddlers(win,windowId) {
			const prefix = `$:/info/browser/window/${windowId}/`;
			return this.dimensionsInfo.map(([suffix, getter]) => ({
				title: prefix + suffix,
				text: String(getter(win))
			}));
		}

		clearTiddlers(windowId) {
			const prefix = `$:/info/browser/window/${windowId}/`,
				deletions = this.dimensionsInfo.map(([suffix]) => prefix + suffix);
			this.updateCallback([], deletions);
		}

		getUpdateHandler(win,windowId) {
			let scheduled = false;
			return () => {
				if(!scheduled) {
					scheduled = true;
					requestAnimationFrame(() => {
						this.updateCallback(this.buildTiddlers(win,windowId), []);
						scheduled = false;
					});
				}
			};
		}

		trackWindow(win,windowId) {
			const handler = this.getUpdateHandler(win, windowId);
			handler(); // initial update
			win.addEventListener("resize",handler,{passive:true});
			this.resizeHandlers.set(windowId,{win, handler});
		}

		untrackWindow(windowId) {
			const entry = this.resizeHandlers.get(windowId);
			if(entry) {
				entry.win.removeEventListener("resize", entry.handler);
				this.resizeHandlers.delete(windowId);
			}
			this.clearTiddlers(windowId);
		}
	}

	const tracker = new WindowDimensionsTracker(updateInfoTiddlersCallback);

	// Track main window
	tracker.trackWindow(window,"system/main");

	// Hook into event bus for user windows
	if($tw.eventBus) {
		$tw.eventBus.on("window:opened", ({window: win, windowID}) => {
			tracker.trackWindow(win, "user/" + windowID);
		});
		$tw.eventBus.on("window:closed", ({windowID}) => {
			tracker.untrackWindow("user/" + windowID);
		});
	}

	return [];
};
