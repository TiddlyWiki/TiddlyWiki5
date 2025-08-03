/*\
title: $:/core/modules/filters/mediaquery.js
type: application/javascript
module-type: filteroperator

Filter operator for evaluating CSS media queries

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Store active media query listeners
var mediaQueryListeners = {};
var listenerCounter = 0;

/*
Export our filter function
*/
exports.mediaquery = function(source,operator,options) {
	var results = [],
		mediaQuery = operator.operand,
		widget = options.widget;
	
	// Only evaluate in browser environment
	if($tw.browser && mediaQuery && widget) {
		try {
			// Use window.matchMedia to evaluate the media query
			var mql = window.matchMedia(mediaQuery);
			
			// Process each input title
			source(function(tiddler,title) {
				if(mql.matches) {
					results.push(title);
				}
			});
			
			// Set up a listener for changes if we have a widget context
			if(widget && widget.wiki) {
				// Create a unique key for this listener
				var listenerKey = "mql_" + (++listenerCounter);
				
				// Define the change handler
				var changeHandler = function(e) {
					// Force a refresh of the widget when media query changes
					if(widget.refreshSelf) {
						widget.refreshSelf();
					} else if(widget.parentWidget && widget.parentWidget.refreshChildren) {
						widget.parentWidget.refreshChildren();
					}
				};
				
				// Add the listener (use modern addEventListener if available)
				if(mql.addEventListener) {
					mql.addEventListener("change", changeHandler);
				} else if(mql.addListener) {
					// Fallback for older browsers
					mql.addListener(changeHandler);
				}
				
				// Store reference for cleanup
				mediaQueryListeners[listenerKey] = {
					mql: mql,
					handler: changeHandler,
					widget: widget
				};
				
				// Clean up listener when widget is destroyed
				if(widget) {
					// Hook into widget destruction
					var originalRemoveChildDomNodes = widget.removeChildDomNodes;
					widget.removeChildDomNodes = function() {
						if(mediaQueryListeners[listenerKey]) {
							var listener = mediaQueryListeners[listenerKey];
							if(listener.mql.removeEventListener) {
								listener.mql.removeEventListener("change", listener.handler);
							} else if(listener.mql.removeListener) {
								// Fallback for older browsers
								listener.mql.removeListener(listener.handler);
							}
							delete mediaQueryListeners[listenerKey];
						}
						if(originalRemoveChildDomNodes) {
							originalRemoveChildDomNodes.call(this);
						}
					};
				}
			}
		} catch(e) {
			// Invalid media query, return empty results
			return results;
		}
	}
	
	return results;
};
