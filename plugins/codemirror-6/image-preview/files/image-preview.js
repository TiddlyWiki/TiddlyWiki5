/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/image-preview.js
type: application/javascript
module-type: codemirror6-plugin

Image preview plugin - shows inline previews of images referenced with [img[]] syntax.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if(!$tw.browser) return;

var CONFIG_TIDDLER = "$:/config/codemirror-6/image-preview/enabled";

// Match [img[source]] or [img width=x [source]] patterns
// - Must start with [img preceded by start of string, whitespace, or non-letter
// - Source cannot contain [ or ] or newlines (prevents matching across lines or into other constructs)
var IMG_PATTERN = /(?:^|[^a-zA-Z])(\[img(?:\s+[^\[\]\n]+)?\[([^\[\]\n]+)\]\])/g;

exports.plugin = {
	name: "image-preview",
	description: "Inline preview of images",
	priority: 35,

	condition: function(context) {
		// Never enable in simple editors (inputs/textareas)
		if(context.isSimpleEditor) {
			return false;
		}
		var wiki = context.options && context.options.widget && context.options.widget.wiki;
		var enabled = wiki && wiki.getTiddlerText(CONFIG_TIDDLER) === "yes";
		var isBody = context.options && context.options.widget &&
			context.options.widget.editClass &&
			context.options.widget.editClass.indexOf("tc-edit-texteditor-body") !== -1;
		return enabled && isBody;
	},

	init: function(cm6Core) {
		this._core = cm6Core;
		this._imagePlugin = null;
	},

	registerCompartments: function() {
		var core = this._core;
		var Compartment = core.state.Compartment;
		return {
			imagePreview: new Compartment()
		};
	},

	// Lazily create and cache the image plugin
	_getOrCreateImagePlugin: function() {
		if(this._imagePlugin) return this._imagePlugin;

		var core = this._core;
		var ViewPlugin = core.view.ViewPlugin;
		var Decoration = core.view.Decoration;
		var WidgetType = core.view.WidgetType;

		if(!ViewPlugin || !Decoration || !WidgetType) return null;

		// Image preview widget using ES6 class syntax
		class ImagePreviewWidget extends WidgetType {
			constructor(src) {
				super();
				this.src = src;
			}

			toDOM() {
				var container = document.createElement("div");
				container.className = "cm-image-preview";

				var img = document.createElement("img");

				// Check if it's a tiddler title or external URL
				var src = this.src;
				if(src.match(/^https?:\/\//i)) {
					// External URL
					img.src = src;
				} else {
					// Tiddler reference
					var tiddler = $tw.wiki.getTiddler(src);
					if(tiddler) {
						var type = tiddler.fields.type || "";
						if(type.indexOf("image/") === 0) {
							// Image tiddler - get canonical URI or base64
							if(tiddler.fields._canonical_uri) {
								img.src = tiddler.fields._canonical_uri;
							} else if(tiddler.fields.text) {
								img.src = "data:" + type + ";base64," + tiddler.fields.text;
							}
						} else {
							// Not an image
							container.textContent = "[Not an image]";
							return container;
						}
					} else {
						container.className = "cm-image-preview cm-image-preview-missing";
						container.textContent = "[Image not found: " + src + "]";
						return container;
					}
				}

				img.alt = src;
				img.addEventListener("error", function() {
					container.className = "cm-image-preview cm-image-preview-error";
					container.textContent = "[Failed to load: " + src + "]";
				});

				container.appendChild(img);
				return container;
			}

			eq(other) {
				return other.src === this.src;
			}

			ignoreEvent() {
				return true;
			}
		}

		// Find image references in document
		function findImages(doc) {
			var images = [];
			var text = doc.toString();

			var match;
			IMG_PATTERN.lastIndex = 0;
			while((match = IMG_PATTERN.exec(text)) !== null) {
				var _fullMatch = match[1];
				var src = match[2];
				// Position after the closing ]]
				var afterPos = match.index + match[0].length;

				images.push({
					from: afterPos,
					src: src.trim()
				});
			}

			return images;
		}

		// Create decorations
		function buildDecorations(view) {
			var widgets = [];
			var images = findImages(view.state.doc);

			for(var i = 0; i < images.length; i++) {
				var img = images[i];
				var deco = Decoration.widget({
					widget: new ImagePreviewWidget(img.src),
					side: 1 // After the image syntax
				});
				widgets.push(deco.range(img.from));
			}

			return Decoration.set(widgets);
		}

		// ImagePreviewView class for ViewPlugin
		class ImagePreviewView {
			constructor(view) {
				this.decorations = buildDecorations(view);
			}

			update(update) {
				if(update.docChanged) {
					this.decorations = buildDecorations(update.view);
				}
			}
		}

		// Create and cache the ViewPlugin
		this._imagePlugin = ViewPlugin.fromClass(ImagePreviewView, {
			decorations: function(v) {
				return v.decorations;
			}
		});

		return this._imagePlugin;
	},

	getExtensions: function(context) {
		var extensions = [];
		var imagePlugin = this._getOrCreateImagePlugin();
		if(!imagePlugin) return extensions;

		// Wrap in compartment if available
		var engine = context.engine;
		var compartments = engine && engine._compartments;
		if(compartments && compartments.imagePreview) {
			extensions.push(compartments.imagePreview.of(imagePlugin));
		} else {
			extensions.push(imagePlugin);
		}

		return extensions;
	},

	registerEvents: function(engine, _context) {
		var self = this;

		return {
			settingsChanged: function(settings) {
				if(engine._destroyed) return;

				if(settings.imagePreview !== undefined) {
					if(settings.imagePreview) {
						var imagePlugin = self._getOrCreateImagePlugin();
						if(imagePlugin) {
							engine.reconfigure("imagePreview", imagePlugin);
						}
					} else {
						engine.reconfigure("imagePreview", []);
					}
				}
			}
		};
	}
};
