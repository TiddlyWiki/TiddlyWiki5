/*\
title: $:/core/modules/widgetbase.js
type: application/javascript
module-type: global

Base class for widgets

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
This constructor is always overridden with a blank constructor, and so shouldn't be used
*/
var WidgetBase = function() {
};

/*
To be overridden by individual widgets
*/
WidgetBase.prototype.init = function(renderer) {
	this.renderer = renderer;
};

/*
Default render() method just renders child nodes
*/
WidgetBase.prototype.render = function(type) {
	var output = [];
	$tw.utils.each(this.children,function(node) {
		if(node.render) {
			output.push(node.render(type));
		}
	});
	return output.join("");
};

/*
Default renderInDom() method just renders child nodes
*/
WidgetBase.prototype.renderInDom = function(parentElement) {
	this.parentElement = parentElement;
	// Render any child nodes
	$tw.utils.each(this.children,function(node) {
		if(node.renderInDom) {
			parentElement.appendChild(node.renderInDom());
		}
	});
};

exports.WidgetBase = WidgetBase;

})();
