/*\
title: $:/core/modules/widgets/info.js
type: application/javascript
module-type: widget

Implements the info widget that displays various information about a specified tiddler.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var InfoWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

InfoWidget.types = {
	changecount: function(options) {return options.wiki.getChangeCount(options.widget.renderer.tiddlerTitle);},
	currentField: function(options) {return options.widget.renderer.renderTree.getContextVariable(options.widget.renderer,"field","text");}
};

InfoWidget.prototype.generate = function() {
	// Get attributes
	this.type = this.renderer.getAttribute("type","changecount");
	// Get the appropriate value for the current tiddler
	var value = "",
		fn = InfoWidget.types[this.type];
	if(fn) {
		value = fn({
			wiki: this.renderer.renderTree.wiki,
			widget: this
		});
	}
	// Set the element
	this.tag = "span";
	this.attributes = {};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,[{
		type: "text",
		text: value
	}]);
};

exports.info = InfoWidget;

})();
