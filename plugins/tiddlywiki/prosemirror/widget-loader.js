/*\
title: $:/plugins/tiddlywiki/prosemirror/widget-loader.js
type: application/javascript
module-type: widget

\*/

if(!$tw.browser) {
	return;
}
// separate the widget from the exports here, so we can skip the require of react code if `!$tw.browser`. Those ts code will error if loaded in the nodejs side.
var components = require("$:/plugins/tiddlywiki/prosemirror/widget.js");
var prosemirror = components.prosemirror;
exports.prosemirror = prosemirror;
exports["edit-prosemirror"] = prosemirror;