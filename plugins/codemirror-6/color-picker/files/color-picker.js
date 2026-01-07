/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/color-picker.js
type: application/javascript
module-type: codemirror6-plugin

Color picker plugin - shows inline color swatches with click-to-edit functionality.

\*/
(function() {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	if(!$tw.browser) return;

	var CONFIG_TIDDLER = "$:/config/codemirror-6/colorPicker";

	// Color regex patterns
	var HEX_COLOR = /#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/g;
	var RGB_COLOR = /rgba?\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.]+\s*)?\)/gi;
	var HSL_COLOR = /hsla?\s*\(\s*\d{1,3}\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)/gi;

	exports.plugin = {
		name: "color-picker",
		description: "Inline color swatches with click-to-edit color picker",
		priority: 40,

		condition: function(context) {
			var wiki = context.options && context.options.widget && context.options.widget.wiki;
			return wiki && wiki.getTiddlerText(CONFIG_TIDDLER) === "yes";
		},

		init: function(cm6Core) {
			this._core = cm6Core;
		},

		registerCompartments: function() {
			var core = this._core;
			var Compartment = core.state.Compartment;
			return {
				colorPicker: new Compartment()
			};
		},

		getExtensions: function(context) {
			var core = this._core;
			var ViewPlugin = core.view.ViewPlugin;
			var Decoration = core.view.Decoration;
			var WidgetType = core.view.WidgetType;
			var extensions = [];

			if(!ViewPlugin || !Decoration || !WidgetType) return extensions;

			var self = this;

			// Color swatch widget
			function ColorSwatchWidget(color, from, to) {
				this.color = color;
				this.from = from;
				this.to = to;
			}
			ColorSwatchWidget.prototype = Object.create(WidgetType.prototype);
			ColorSwatchWidget.prototype.constructor = ColorSwatchWidget;

			ColorSwatchWidget.prototype.toDOM = function(view) {
				var wrapper = document.createElement("span");
				wrapper.className = "cm-color-swatch-wrapper";

				var swatch = document.createElement("span");
				swatch.className = "cm-color-swatch";
				swatch.style.backgroundColor = this.color;
				swatch.title = "Click to edit color: " + this.color;

				var currentFrom = this.from;
				var currentTo = this.to;

				// For mobile compatibility, we create an always-present but hidden color input
				// that responds to direct touch/click events
				var picker = document.createElement("input");
				picker.type = "color";
				picker.className = "cm-color-picker-input";
				picker.value = self._toHex(this.color);
				// Position it over the swatch so touch events hit it directly
				picker.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;border:none;padding:0;";
				wrapper.style.position = "relative";
				wrapper.appendChild(picker);

				picker.addEventListener("input", function() {
					var newColor = picker.value;
					var newLength = newColor.length;
					// Update swatch color immediately for visual feedback
					swatch.style.backgroundColor = newColor;
					// Replace the color at current tracked position
					view.dispatch({
						changes: {
							from: currentFrom,
							to: currentTo,
							insert: newColor
						}
					});
					// Update tracked position for next input event
					// The 'to' position changes based on the new color length
					currentTo = currentFrom + newLength;
				});

				// Also handle the swatch click for desktop fallback
				swatch.addEventListener("click", function(e) {
					e.preventDefault();
					e.stopPropagation();
					picker.focus();
					picker.click();
				});

				wrapper.appendChild(swatch);
				return wrapper;
			};

			ColorSwatchWidget.prototype.eq = function(other) {
				return other.color === this.color && other.from === this.from && other.to === this.to;
			};

			ColorSwatchWidget.prototype.ignoreEvent = function() {
				return false;
			};

			// Convert color to hex for the color picker
			this._toHex = function(color) {
				// If already hex, return as is
				if(color.startsWith("#")) {
					// Expand shorthand
					if(color.length === 4) {
						return "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
					}
					return color.slice(0, 7); // Remove alpha if present
				}

				// Create temp element to get computed color
				var temp = document.createElement("div");
				temp.style.color = color;
				document.body.appendChild(temp);
				var computed = getComputedStyle(temp).color;
				document.body.removeChild(temp);

				// Parse rgb(r, g, b)
				var match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
				if(match) {
					var r = parseInt(match[1]).toString(16).padStart(2, "0");
					var g = parseInt(match[2]).toString(16).padStart(2, "0");
					var b = parseInt(match[3]).toString(16).padStart(2, "0");
					return "#" + r + g + b;
				}

				return "#000000";
			};

			// Find colors in document
			function findColors(doc) {
				var colors = [];
				var text = doc.toString();

				// Find hex colors
				var match;
				HEX_COLOR.lastIndex = 0;
				while((match = HEX_COLOR.exec(text)) !== null) {
					// Skip if # is at start of line or has only whitespace before it
					// (numbered list in TiddlyWiki)
					var pos = match.index;
					var isListMarker = false;
					if(pos === 0) {
						isListMarker = true;
					} else {
						// Look backward to find start of line
						var lineStart = pos;
						while(lineStart > 0 && text[lineStart - 1] !== "\n") {
							lineStart--;
						}
						// Check if only whitespace between line start and #
						var beforeHash = text.substring(lineStart, pos);
						if(/^\s*$/.test(beforeHash)) {
							isListMarker = true;
						}
					}
					if(isListMarker) {
						continue;
					}
					colors.push({
						from: match.index,
						to: match.index + match[0].length,
						color: match[0]
					});
				}

				// Find rgb colors
				RGB_COLOR.lastIndex = 0;
				while((match = RGB_COLOR.exec(text)) !== null) {
					colors.push({
						from: match.index,
						to: match.index + match[0].length,
						color: match[0]
					});
				}

				// Find hsl colors
				HSL_COLOR.lastIndex = 0;
				while((match = HSL_COLOR.exec(text)) !== null) {
					colors.push({
						from: match.index,
						to: match.index + match[0].length,
						color: match[0]
					});
				}

				// Sort by position (required for Decoration.set)
				colors.sort(function(a, b) {
					return a.from - b.from;
				});

				return colors;
			}

			// Create decorations for colors
			function buildDecorations(view) {
				var widgets = [];
				var colors = findColors(view.state.doc);

				for(var i = 0; i < colors.length; i++) {
					var c = colors[i];
					var deco = Decoration.widget({
						widget: new ColorSwatchWidget(c.color, c.from, c.to),
						side: -1 // Before the color text
					});
					widgets.push(deco.range(c.from));
				}

				return Decoration.set(widgets);
			}

			// Define the class properly with prototype methods
			function ColorPickerView(view) {
				this.decorations = buildDecorations(view);
			}

			ColorPickerView.prototype.update = function(update) {
				if(update.docChanged || update.viewportChanged) {
					this.decorations = buildDecorations(update.view);
				}
			};

			// Create ViewPlugin with the class
			var colorPlugin = ViewPlugin.fromClass(ColorPickerView, {
				decorations: function(v) {
					return v.decorations;
				}
			});

			// Store plugin reference for registerEvents
			this._colorPlugin = colorPlugin;

			// Wrap in compartment if available
			var engine = context.engine;
			var compartments = engine && engine._compartments;
			if(compartments && compartments.colorPicker) {
				extensions.push(compartments.colorPicker.of(colorPlugin));
			} else {
				extensions.push(colorPlugin);
			}

			return extensions;
		},

		registerEvents: function(engine, _context) {
			var self = this;

			return {
				settingsChanged: function(settings) {
					if(engine._destroyed) return;

					if(settings.colorPicker !== undefined) {
						if(settings.colorPicker && self._colorPlugin) {
							engine.reconfigure("colorPicker", self._colorPlugin);
						} else {
							engine.reconfigure("colorPicker", []);
						}
					}
				}
			};
		}
	};

})();
