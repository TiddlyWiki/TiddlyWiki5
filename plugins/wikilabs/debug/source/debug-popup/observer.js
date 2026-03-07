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
	 * Shared mouseenter handler. Reads widget from the WeakMap via `this` (the DOM node).
	 */
	function mouseenterHandler(event) {
		const data = nodeDataMap.get(this);
		if(!data) {
			return;
		}
		// Cancel any pending hide timeout from a previous element's mouseleave
		if(globalDebugPopup._hideTimeout) {
			clearTimeout(globalDebugPopup._hideTimeout);
			globalDebugPopup._hideTimeout = null;
		}
		if(globalDebugPopup._popupTimeout) {
			clearTimeout(globalDebugPopup._popupTimeout);
		}
		const mouseX = event.clientX, mouseY = event.clientY;
		const domNode = this;
		// If the popup is already visible, update it immediately with the new element's data
		if(globalDebugPopup._popup.style.display !== "none") {
			const finalData = _gatherVariableData(data.widget);
			globalDebugPopup.setData(finalData);
			globalDebugPopup.showPopup(domNode, mouseX, mouseY);
			globalDebugPopup._popupTimeout = null;
		} else {
			globalDebugPopup._popupTimeout = setTimeout(function() {
				if(globalDebugPopup._popup.style.display !== "none") {
					return;
				}
				const finalData = _gatherVariableData(data.widget);
				globalDebugPopup.setData(finalData);
				globalDebugPopup.showPopup(domNode, mouseX, mouseY);
				globalDebugPopup._popupTimeout = null;
			}, 1000);
		}
	}

	/**
	 * Shared mouseleave handler.
	 */
	function mouseleaveHandler() {
		if(globalDebugPopup._popupTimeout) {
			clearTimeout(globalDebugPopup._popupTimeout);
			globalDebugPopup._popupTimeout = null;
		}
		if(globalDebugPopup._popup.style.display !== "none") {
			if(globalDebugPopup._hideTimeout) {
				clearTimeout(globalDebugPopup._hideTimeout);
			}
			globalDebugPopup._hideTimeout = setTimeout(function() {
				globalDebugPopup.hide();
				globalDebugPopup._hideTimeout = null;
			}, 900);
		}
	}

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
					domNode.addEventListener("mouseenter", mouseenterHandler, true);
					domNode.addEventListener("mouseleave", mouseleaveHandler, true);
					data.listenersAttached = true;
				}
			} else {
				// Element is out of view: remove listeners if they are active
				if(data.listenersAttached) {
					domNode.removeEventListener("mouseenter", mouseenterHandler, true);
					domNode.removeEventListener("mouseleave", mouseleaveHandler, true);
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
			const idx = value.indexOf("\n");
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
		const transclusion = widget.getVariable("transclusion");
		const allVars = Object.create(null);
		const parentVars = widget.parentWidget && widget.parentWidget.variables;
		// Cache debug flags once instead of per-variable
		const debugFunctions = widget.getVariable("tv-debug-functions") === "yes";
		const debugProcedures = widget.getVariable("tv-debug-procedures") === "yes";
		const debugMacros = widget.getVariable("tv-debug-macros") === "yes";
		const debugWidgets = widget.getVariable("tv-debug-widgets") === "yes";

		for(let v in widget.variables) {
			const variable = parentVars && parentVars[v];
			let entry = null;

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

		const filter = widget.getVariable("tv-debug-filter", { defaultValue: "[limit[100]]" });
		const filteredVars = widget.wiki.compileFilter(filter).call(widget.wiki, widget.wiki.makeTiddlerIterator(Object.keys(allVars)));
		const finalData = Object.create(null);
		finalData["transclusion"] = { value: transclusion || "", type: "" };

		$tw.utils.each(filteredVars, function(name) {
			const el = allVars[name];
			const str = _formatValue(el.value);
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

		domNode.setAttribute("data-debug","yes");

		// Store the widget and listener state in the WeakMap, associated with the domNode
		nodeDataMap.set(domNode, {
			widget: widget,
			listenersAttached: false // Start with listeners detached
		});

		observer.observe(domNode);
	});
};