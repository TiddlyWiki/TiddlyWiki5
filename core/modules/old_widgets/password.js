/*\
title: $:/core/modules/old_widgets/password.js
type: application/javascript
module-type: widget

Implements the password widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var PasswordWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

PasswordWidget.prototype.generate = function() {
	// Get the parameters from the attributes
	this.name = this.renderer.getAttribute("name");
	// Get the current password
	var password = $tw.browser ? $tw.utils.getPassword(this.name) : "";
	// Generate our element
	this.tag = "input";
	this.attributes = {
		type: "password",
		value: password
	};
	this.events = [
		{name: "keyup", handlerObject: this},
		{name: "input", handlerObject: this}];
};

PasswordWidget.prototype.handleEvent = function(event) {
	var password = this.renderer.domNode.value;
	return $tw.utils.savePassword(this.name,password);
};

exports.password = PasswordWidget;

})();
