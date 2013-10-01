/*\
title: $:/core/modules/widgets/version.js
type: application/javascript
module-type: widget

Implements the version widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var VersionWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

VersionWidget.prototype.generate = function() {
	// Set the element
	this.tag = "span";
	this.attributes = {};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,[{
		type: "text",
		text: $tw.version
	}]);
};

exports.version = VersionWidget;

})();
