/*\
title: $:/plugins/tiddlywiki/codemirror-6-minimap/minimap.js
type: application/javascript
module-type: codemirror6-plugin

CodeMirror 6 minimap plugin for the editor.
\*/
"use strict";

if(!$tw.browser) return;

var minimapModule = null;
try {
	minimapModule = require("$:/plugins/tiddlywiki/codemirror-6-minimap/codemirror-minimap.js");
} catch(e) {
	// minimap library not available yet
}

var showMinimap = minimapModule && minimapModule.showMinimap;
var minimapCompartment = null;

function isFunction(value) {
	return typeof value === "function";
}

function getCore(context) {
	if(context && context.cm6Core) {
		return context.cm6Core;
	}
	try {
		return require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
	} catch(e) {
		return null;
	}
}

function getParserFromState(core, state) {
	var languagePackage = core && core.language;
	var parser = null;
	var languageFacet, languageValue;

	if(!languagePackage || !state) {
		return null;
	}

	if(isFunction(languagePackage.syntaxParser)) {
		try {
			parser = languagePackage.syntaxParser(state);
			if(parser) {
				return parser;
			}
		} catch(e) {}
	}

	languageFacet = languagePackage.language;
	if(languageFacet && isFunction(state.facet)) {
		try {
			languageValue = state.facet(languageFacet);
			if(languageValue && languageValue.parser) {
				return languageValue.parser;
			}
			if(languageValue && languageValue.length) {
				for(var i = 0; i < languageValue.length; i++) {
					if(languageValue[i] && languageValue[i].parser) {
						return languageValue[i].parser;
					}
				}
			}
		} catch(e) {}
	}

	return null;
}

function readInputToString(input) {
	var chunks = [];
	var pos = 0;
	var next;

	if(input === undefined || input === null) {
		return "";
	}

	if(typeof input === "string") {
		return input;
	}

	if(isFunction(input.read)) {
		try {
			while(pos < input.length) {
				next = input.read(pos, input.length);
				if(!next) break;
				chunks.push(next);
				pos += next.length;
			}
			return chunks.join("");
		} catch(e) {}
	}

	return String(input);
}

function patchParserParse(parser) {
	if(!parser || isFunction(parser.parse) || !isFunction(parser.startParse)) {
		return;
	}

	try {
		parser.parse = function(input, fragments, ranges) {
			var parse = parser.startParse(input, fragments, ranges);
			var tree = null;
			var guard = 0;

			while(parse && guard < 100000) {
				tree = parse.advance();
				if(tree) {
					return tree;
				}
				guard++;
			}

			return parser.startParse(readInputToString(input), fragments, ranges).advance();
		};
	} catch(e) {}
}

function getParserCompatExtension(context) {
	var core = getCore(context);
	var ViewPlugin = core && core.view && core.view.ViewPlugin;

	if(!ViewPlugin) {
		return [];
	}

	return ViewPlugin.define(function(view) {
		patchParserParse(getParserFromState(core, view.state));

		return {
			update: function(update) {
				if(update.docChanged || update.selectionSet || update.viewportChanged) {
					patchParserParse(getParserFromState(core, update.state));
				}
			}
		};
	});
}

function getUserSelectTheme(context) {
	var core = getCore(context);
	var EditorView = core && core.view && core.view.EditorView;

	if(!EditorView || !isFunction(EditorView.theme)) {
		return [];
	}

	// Prevent text selection anywhere in the minimap (gutter, canvas and the
	// draggable overlay) so clicking/dragging it never selects content.
	return EditorView.theme({
		".cm-minimap-gutter, .cm-minimap-inner, .cm-minimap-overlay-container, .cm-minimap-overlay, .cm-minimap-inner canvas": {
			"user-select": "none",
			"-webkit-user-select": "none",
			"-moz-user-select": "none",
			"-ms-user-select": "none"
		}
	});
}

function getMinimapContent(context) {
	var core = getCore(context);
	var ownerDocument;

	if(!showMinimap) {
		return [];
	}

	return [
		getParserCompatExtension(context),
		getUserSelectTheme(context),
		showMinimap.of({
			create: function(view) {
				ownerDocument = view && view.dom && view.dom.ownerDocument ? view.dom.ownerDocument : document;
				return {
					dom: ownerDocument.createElement("div")
				};
			},
			displayText: "characters",
			showOverlay: "mouse-over"
		})
	];
}

exports.plugin = {
	name: "minimap",
	description: "Minimap for CodeMirror 6",
	priority: 50,

	condition: function(context) {
		if(context.isInputMode) {
			return false;
		}
		if(context.isSimpleEditor) {
			return false;
		}
		return !!showMinimap;
	},

	registerCompartments: function() {
		var core = getCore();

		if(!minimapCompartment && core && core.state && core.state.Compartment) {
			minimapCompartment = new core.state.Compartment();
		}

		return minimapCompartment ? {
			minimap: minimapCompartment
		} : {};
	},

	getExtensions: function(context) {
		if(!minimapCompartment) {
			this.registerCompartments();
		}

		if(!minimapCompartment) {
			return getMinimapContent(context);
		}

		return [
			minimapCompartment.of(getMinimapContent(context))
		];
	},

	getCompartmentContent: function(context) {
		return getMinimapContent(context);
	}
};
