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
} catch (e) {
    // minimap library not available yet
}
var showMinimap = minimapModule && minimapModule.showMinimap;

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

    getExtensions: function(_context) {
        if(!showMinimap) {
            return [];
        }

        return [
            showMinimap.of({
                create: function(view) {
                    return { dom: document.createElement("div") };
                },
                displayText: "characters",
                showOverlay: "mouse-over"
            })
        ];
    }
};
