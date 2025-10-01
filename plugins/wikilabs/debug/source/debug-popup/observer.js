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

	/**
	 * Callback for the IntersectionObserver. Adds/removes event listeners as elements
	 * enter or leave the viewport.
	 * @param {IntersectionObserverEntry[]} entries - The entries that have changed.
	 */
	const handleIntersection = (entries) => {
		for (const entry of entries) {
			const domNode = entry.target;
			const data = nodeDataMap.get(domNode);

			if (!data) {
				continue;
			}

			if (entry.isIntersecting) {
				// Element is in view: add listeners if they aren't already active
				if (!data.listenersAttached) {
					domNode.addEventListener("mouseenter", data.mouseenterListener, true);
					domNode.addEventListener("mouseleave", data.mouseleaveListener, true);
					data.listenersAttached = true;
				}
			} else {
				// Element is out of view: remove listeners if they are active
				if (data.listenersAttached) {
					domNode.removeEventListener("mouseenter", data.mouseenterListener, true);
					domNode.removeEventListener("mouseleave", data.mouseleaveListener, true);
					data.listenersAttached = false;
				}
			}
		}
	};

	// Create a single observer to watch all relevant elements
	const observer = new IntersectionObserver(handleIntersection);

	$tw.hooks.addHook("th-dom-rendering-element", function(domNode, widget) {

		/**
		 * Gathers and formats all relevant variable data from the current widget context.
		 * @param {object} widget - The widget instance to inspect.
		 * @returns {object} A formatted object containing variable data for the popup.
		 */
		function _gatherVariableData(widget) {
			var test = widget.getVariable("transclusion");
			var data = Object.create(null);
			var allVars = Object.create(null);
			var filter;

			for (var v in widget.variables) {
				let variable = widget.parentWidget && widget.parentWidget.variables[v];
				let entry = null;

				if (variable && variable.isFunctionDefinition) {
					if (widget.getVariable("tv-debug-functions") === "yes") {
						entry = {
							value: variable.value,
							type: 'f',
							content: widget.getVariable(v, { defaultValue: "" })
						};
					}
				} else if (variable && variable.isProcedureDefinition) {
					if (widget.getVariable("tv-debug-procedures") === "yes") {
						entry = { value: widget.getVariable(v, { defaultValue: "" }), type: 'p' };
					}
				} else if (variable && variable.isMacroDefinition) {
					if (widget.getVariable("tv-debug-macros") === "yes") {
						entry = { value: widget.getVariable(v, { defaultValue: "" }), type: 'm' };
					}
				} else if (variable && variable.isWidgetDefinition) {
					if (widget.getVariable("tv-debug-widgets") === "yes") {
						entry = { value: widget.getVariable(v, { defaultValue: "" }), type: 'w' };
					}
				} else {
					entry = { value: widget.getVariable(v, { defaultValue: "" }), type: '' };
				}

				if (entry && entry.value !== undefined) {
					allVars[v] = entry;
				}
			}

			filter = widget.getVariable("tv-debug-filter", { defaultValue: "[limit[100]]" });
			if (filter) {
				var filteredVars = widget.wiki.compileFilter(filter).call(widget.wiki, widget.wiki.makeTiddlerIterator(Object.keys(allVars)));
				$tw.utils.each(filteredVars, function(name) {
					data[name] = allVars[name];
				});
			}

			var finalData = Object.create(null);
			finalData["transclusion"] = { value: test || "", type: "" };

			$tw.utils.each((filter) ? data : allVars, function(el, title) {
				let str = "";
				if (typeof el.value === "string" && el.value.includes("\n")) {
					str = el.value.split("\n")[0] + " ...";
				} else {
					str = (el.value) ? String(el.value) : "";
				}
				if (str) {
					finalData[title] = { value: str, type: el.type, content: el.content }; // Preserve content
				}
			});
			return finalData;
		}

		/**
		 * The callback function to execute after a delay when the mouse enters the element.
		 * It gathers data and shows the popup.
		 * @param {MouseEvent} event - The mouse event.
		 */
		const showPopupCallback = (event) => {
			if (globalDebugPopup._popup.style.display !== "none") {
				return;
			}
			const finalData = _gatherVariableData(widget);
			globalDebugPopup.setData(finalData);
			globalDebugPopup.showPopup(domNode, event.clientX, event.clientY);
			globalDebugPopup._popupTimeout = null; // Clear timeout ID after execution
		};

		const mouseenterListener = function(event) {
			// Clear any existing timeout to prevent multiple popups or flickering
			if (globalDebugPopup._popupTimeout) {
				clearTimeout(globalDebugPopup._popupTimeout);
			}
			// Set a timeout to show the popup
			globalDebugPopup._popupTimeout = setTimeout(() => showPopupCallback(event), 1000); // Delay to show popup
		};

		const mouseleaveListener = function(event) {
			// Clear the show timeout if mouse leaves before popup shows
			if (globalDebugPopup._popupTimeout) {
				clearTimeout(globalDebugPopup._popupTimeout);
				globalDebugPopup._popupTimeout = null;
			}
			// Set a hide timeout if the popup is visible
			if (globalDebugPopup._popup.style.display !== "none") {
				if (globalDebugPopup._hideTimeout) {
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

		// Start observing the element, but only if it is a valid Element
		if (domNode instanceof Element) {
			if(widget.getVariable("tv-debug") === "yes") {
				domNode.setAttribute("data-debug-xxxx", widget.getVariable("transclusion"));
				observer.observe(domNode);
			}
		}
	});
};