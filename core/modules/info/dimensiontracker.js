/*\
title: $:/core/modules/info/dimensiontracker.js
type: application/javascript
module-type: info

Initialise $:/info/ tiddlers derived from the measured geometry of DOM elements.

Each info tiddler receives unitless CSS-pixel values in the fields `width`,
`height`, `x`, `y`, `top`, `left`, `right` and `bottom`, plus `found` (yes/no)
so a consumer can distinguish "not present" from "present but zero-sized".

Stylesheets can select the right one with the tv-window-id variable, which
$:/core/modules/startup/windows.js passes to the stylesheet it renders into
each new window:

	{{{ [<tv-window-id>!is[blank]addprefix[user/]] ~[[system/main]]
	    +[addprefix[$:/info/browser/menubar/]get[height]] ~[[0]] +[addsuffix[px]] }}}

Note x/y/top/left are viewport-relative and are NOT recomputed on scroll. That
is deliberate: scroll would produce a write on every frame, and the intended
use is measuring the size and resting position of page furniture.

\*/

"use strict";

exports.getInfoTiddlerFields = function(updateInfoTiddlersCallback) {
	if(!$tw.browser) {
		return [];
	}

	/*
	Pure helpers. They depend only on their arguments, so they live here rather
	than on the class — a method that never touches instance state is not a
	method, and eslint's class-methods-use-this rule says so.
	*/
	function infoTitle(config,windowId) {
		return config.infoTiddler + "/" + windowId;
	}

	function round(value) {
		return Math.round(value * 100) / 100;
	}

	class ElementDimensionsTracker {
		constructor(updateCallback) {
			this.updateCallback = updateCallback;
			this.windows = new Map();     // windowId -> {win, observer, nodes: Map<configTitle,element>}
			this.configs = new Map();     // configTitle -> {selector, infoTiddler}
			this.signatures = new Map();  // infoTitle -> last written signature
			this.scheduled = false;
		}

		measureOne(entry,configTitle,config) {
			var element = null;
			try {
				element = entry.win.document.querySelector(config.selector) || null;
			} catch(e) {
				// A malformed selector must not take the whole tracker down
				element = null;
			}
			// Re-point the observer if a re-render replaced the node
			var previous = entry.nodes.get(configTitle) || null;
			if(element !== previous) {
				if(entry.observer) {
					if(previous) {
						entry.observer.unobserve(previous);
					}
					if(element) {
						entry.observer.observe(element);
					}
				}
				entry.nodes.set(configTitle,element);
			}
			var title = infoTitle(config,entry.windowId),
				fields = {title: title};
			if(element) {
				var rect = element.getBoundingClientRect();
				fields.found = "yes";
				fields.width = "" + round(rect.width);
				fields.height = "" + round(rect.height);
				fields.x = "" + round(rect.left);
				fields.y = "" + round(rect.top);
				fields.top = "" + round(rect.top);
				fields.left = "" + round(rect.left);
				fields.right = "" + round(rect.right);
				fields.bottom = "" + round(rect.bottom);
				fields.text = "" + round(rect.width) + " " + round(rect.height);
			} else {
				fields.found = "no";
				$tw.utils.each(["width","height","x","y","top","left","right","bottom"],function(name) {
					fields[name] = "0";
				});
				fields.text = "";
			}
			var signature = JSON.stringify(fields);
			if(signature === this.signatures.get(title)) {
				return null;
			}
			this.signatures.set(title,signature);
			return fields;
		}

		measureAll() {
			var self = this,
				additions = [];
			this.windows.forEach(function(entry) {
				// A window can be closed between scheduling and running
				if(entry.win.closed) {
					return;
				}
				self.configs.forEach(function(config,configTitle) {
					var fields = self.measureOne(entry,configTitle,config);
					if(fields) {
						additions.push(fields);
					}
				});
			});
			// One callback for the whole batch, so N trackers cost one refresh
			if(additions.length > 0) {
				this.updateCallback(additions,[]);
			}
		}

		/*
		Coalesce every trigger into at most one measurement.
		*/
		schedule() {
			var self = this;
			if(this.scheduled) {
				return;
			}
			this.scheduled = true;
			var run = function() {
				if(!self.scheduled) {
					return;
				}
				self.scheduled = false;
				self.measureAll();
			};
			window.requestAnimationFrame(run);
			window.setTimeout(run,250);
		}

		trackWindow(win,windowId) {
			var self = this;
			if(this.windows.has(windowId)) {
				return;
			}
			var entry = {win: win, windowId: windowId, observer: null, nodes: new Map()};
			// ResizeObserver must come from the window whose nodes it watches
			if(typeof win.ResizeObserver === "function") {
				entry.observer = new win.ResizeObserver(function() {
					self.schedule();
				});
			}
			entry.resizeHandler = function() {
				self.schedule();
			};
			win.addEventListener("resize",entry.resizeHandler,{passive: true});
			this.windows.set(windowId,entry);
			this.schedule();
		}

		untrackWindow(windowId) {
			var entry = this.windows.get(windowId);
			if(!entry) {
				return;
			}
			if(entry.observer) {
				entry.observer.disconnect();
			}
			try {
				entry.win.removeEventListener("resize",entry.resizeHandler);
			} catch(e) {
				// The window may already be gone
			}
			this.windows.delete(windowId);
			this.clearWindow(windowId);
		}

		// Drop every info tiddler belonging to one window
		clearWindow(windowId) {
			var self = this,
				deletions = [];
			this.configs.forEach(function(config) {
				var title = infoTitle(config,windowId);
				deletions.push(title);
				self.signatures.delete(title);
			});
			if(deletions.length > 0) {
				this.updateCallback([],deletions);
			}
		}

		addConfig(configTitle,config) {
			this.configs.set(configTitle,config);
			this.schedule();
		}

		// Drop one config, and its info tiddler in every window
		removeConfig(configTitle) {
			var self = this,
				config = this.configs.get(configTitle);
			if(!config) {
				return;
			}
			var deletions = [];
			this.windows.forEach(function(entry) {
				var title = infoTitle(config,entry.windowId),
					node = entry.nodes.get(configTitle);
				if(node && entry.observer) {
					entry.observer.unobserve(node);
				}
				entry.nodes.delete(configTitle);
				deletions.push(title);
				self.signatures.delete(title);
			});
			this.configs.delete(configTitle);
			if(deletions.length > 0) {
				this.updateCallback([],deletions);
			}
		}
	}

	var tracker = new ElementDimensionsTracker(updateInfoTiddlersCallback);

	// Exposed for debugging and for plugins that need to force a re-measure
	$tw.elementDimensionsTracker = tracker;

	// Track the main window, using the same key as windowdimensions.js
	tracker.trackWindow(window,"system/main");

	if($tw.eventBus) {
		$tw.eventBus.on("window:opened",function(event) {
			tracker.trackWindow(event.window,"user/" + event.windowID);
		});
		$tw.eventBus.on("window:closed",function(event) {
			tracker.untrackWindow("user/" + event.windowID);
		});
	}

	// Watch the tracker configuration tiddlers
	$tw.filterTracker.track({
		filterString: "[all[tiddlers+shadows]tag[$:/tags/DimensionTracker]!is[draft]]",
		fnEnter: function(title) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				var selector = tiddler.fields["selector"],
					infoTiddler = tiddler.fields["info-tiddler"];
				if(selector && infoTiddler) {
					tracker.addConfig(title,{selector: selector, infoTiddler: infoTiddler});
				}
			}
			return title;
		},
		fnLeave: function(title) {
			tracker.removeConfig(title);
		},
		fnChange: function(title) {
			tracker.removeConfig(title);
			var tiddler = $tw.wiki.getTiddler(title);
			if(tiddler) {
				var selector = tiddler.fields["selector"],
					infoTiddler = tiddler.fields["info-tiddler"];
				if(selector && infoTiddler) {
					tracker.addConfig(title,{selector: selector, infoTiddler: infoTiddler});
				}
			}
			return title;
		}
	});

	$tw.hooks.addHook("th-page-refreshed",function() {
		tracker.schedule();
	});

	$tw.wiki.addEventListener("change",function() {
		tracker.schedule();
	});

	return [];
};
