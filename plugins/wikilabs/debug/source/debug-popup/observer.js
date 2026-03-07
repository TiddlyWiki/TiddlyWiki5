/*\
title: $:/plugins/wikilabs/debug/observer.js
type: application/javascript
module-type: library

Initializes the Intersection Observer and the hook to trigger the debug popup.
\*/
"use strict";

exports.init = function(globalDebugPopup) {
	// Use a WeakMap to associate DOM nodes with their specific data and listeners
	const nodeDataMap = new WeakMap();
	const defaultOpt = { defaultValue: "" };

	/**
	 * Callback for the IntersectionObserver. Adds/removes event listeners as elements
	 * enter or leave the viewport.
	 * @param {IntersectionObserverEntry[]} entries - The entries that have changed.
	 */
	const handleIntersection = (entries) => {
		for(const entry of entries) {
			const domNode = entry.target;
			const data = nodeDataMap.get(domNode);

			if(!data) {
				continue;
			}

			if(entry.isIntersecting) {
				// Element is in view: add listeners if they aren't already active
				if(!data.listenersAttached) {
					domNode.addEventListener("mouseenter", data.mouseenterListener, true);
					domNode.addEventListener("mouseleave", data.mouseleaveListener, true);
					data.listenersAttached = true;
				}
			} else {
				// Element is out of view: remove listeners if they are active
				if(data.listenersAttached) {
					domNode.removeEventListener("mouseenter", data.mouseenterListener, true);
					domNode.removeEventListener("mouseleave", data.mouseleaveListener, true);
					data.listenersAttached = false;
				}
			}
		}
	};

	// Create a single observer to watch all relevant elements
	const observer = new IntersectionObserver(handleIntersection);

	/**
	 * Truncates a value string to its first line for display.
	 * @param {*} value - The value to format.
	 * @returns {string} The formatted string.
	 */
	function _formatValue(value) {
		if(typeof value === "string") {
			var idx = value.indexOf("\n");
			if(idx !== -1) {
				return value.substring(0, idx) + " ...";
			}
			return value;
		}
		return value ? String(value) : "";
	}

	/**
	 * Gathers and formats all relevant variable data from the current widget context.
	 * @param {object} widget - The widget instance to inspect.
	 * @returns {object} A formatted object containing variable data for the popup.
	 */
	function _gatherVariableData(widget) {
		var transclusion = widget.getVariable("transclusion");
		var allVars = Object.create(null);
		var parentVars = widget.parentWidget && widget.parentWidget.variables;
		// Cache debug flags once instead of per-variable
		var debugFunctions = widget.getVariable("tv-debug-functions") === "yes";
		var debugProcedures = widget.getVariable("tv-debug-procedures") === "yes";
		var debugMacros = widget.getVariable("tv-debug-macros") === "yes";
		var debugWidgets = widget.getVariable("tv-debug-widgets") === "yes";

		for(var v in widget.variables) {
			var variable = parentVars && parentVars[v];
			var entry = null;

			if(variable && variable.isFunctionDefinition) {
				if(debugFunctions) {
					entry = {
						value: variable.value,
						type: "f",
						content: widget.getVariable(v, defaultOpt)
					};
				}
			} else if(variable && variable.isProcedureDefinition) {
				if(debugProcedures) {
					entry = { value: widget.getVariable(v, defaultOpt), type: "p" };
				}
			} else if(variable && variable.isMacroDefinition) {
				if(debugMacros) {
					entry = { value: widget.getVariable(v, defaultOpt), type: "m" };
				}
			} else if(variable && variable.isWidgetDefinition) {
				if(debugWidgets) {
					entry = { value: widget.getVariable(v, defaultOpt), type: "w" };
				}
			} else {
				entry = { value: widget.getVariable(v, defaultOpt), type: "" };
			}

			if(entry && entry.value !== undefined) {
				allVars[v] = entry;
			}
		}

		var filter = widget.getVariable("tv-debug-filter", { defaultValue: "[limit[100]]" });
		var filteredVars = widget.wiki.compileFilter(filter).call(widget.wiki, widget.wiki.makeTiddlerIterator(Object.keys(allVars)));
		var finalData = Object.create(null);
		finalData["transclusion"] = { value: transclusion || "", type: "" };

		$tw.utils.each(filteredVars, function(name) {
			var el = allVars[name];
			var str = _formatValue(el.value);
			if(str) {
				finalData[name] = { value: str, type: el.type, content: el.content };
			}
		});
		return finalData;
	}

	$tw.hooks.addHook("th-dom-rendering-element", function(domNode, widget) {
		// Early exit: skip all work for non-debug elements
		if(!(domNode instanceof Element) || widget.getVariable("tv-debug") !== "yes") {
			return;
		}

		domNode.setAttribute("data-debug-xxxx", widget.getVariable("transclusion"));

		/**
		 * The callback function to execute after a delay when the mouse enters the element.
		 * It gathers data and shows the popup.
		 * @param {number} mouseX - The X coordinate of the mouse.
		 * @param {number} mouseY - The Y coordinate of the mouse.
		 */
		const showPopupCallback = (mouseX, mouseY) => {
			if(globalDebugPopup._popup.style.display !== "none") {
				return;
			}
			const finalData = _gatherVariableData(widget);
			globalDebugPopup.setData(finalData);
			globalDebugPopup.showPopup(domNode, mouseX, mouseY);
			globalDebugPopup._popupTimeout = null; // Clear timeout ID after execution
		};

		const mouseenterListener = function(event) {
			// Clear any existing timeout to prevent multiple popups or flickering
			if(globalDebugPopup._popupTimeout) {
				clearTimeout(globalDebugPopup._popupTimeout);
			}
			// Capture coordinates eagerly to avoid stale event references in the timeout
			const mouseX = event.clientX, mouseY = event.clientY;
			// Set a timeout to show the popup
			globalDebugPopup._popupTimeout = setTimeout(() => showPopupCallback(mouseX, mouseY), 1000); // Delay to show popup
		};

		const mouseleaveListener = function() {
			// Clear the show timeout if mouse leaves before popup shows
			if(globalDebugPopup._popupTimeout) {
				clearTimeout(globalDebugPopup._popupTimeout);
				globalDebugPopup._popupTimeout = null;
			}
			// Set a hide timeout if the popup is visible
			if(globalDebugPopup._popup.style.display !== "none") {
				if(globalDebugPopup._hideTimeout) {
					clearTimeout(globalDebugPopup._hideTimeout);
				}
				globalDebugPopup._hideTimeout = setTimeout(() => {
					globalDebugPopup.hide();
					globalDebugPopup._hideTimeout = null;
				}, 900); // Delay before hiding
			}
		};

		// Store the listeners and their state in the WeakMap, associated with the domNode
		nodeDataMap.set(domNode, {
			mouseenterListener: mouseenterListener,
			mouseleaveListener: mouseleaveListener,
			listenersAttached: false // Start with listeners detached
		});

		observer.observe(domNode);
	});
};