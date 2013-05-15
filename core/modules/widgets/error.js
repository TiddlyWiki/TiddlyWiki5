/*\
title: $:/core/modules/widgets/error.js
type: application/javascript
module-type: widget

The error widget displays an error message.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ErrorWidget = function(renderer,errorMessage) {
	// Save state
	this.renderer = renderer;
	this.errorMessage = errorMessage;
	// Generate child nodes
	this.generate();
};

ErrorWidget.prototype.generate = function() {
	// Set the element details
	this.tag = "span";
	this.attributes = {
		"class": "tw-error-widget"
	};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,[{
			type: "text",
			text: this.errorMessage
		}]);
};

exports.error = ErrorWidget;

})();
