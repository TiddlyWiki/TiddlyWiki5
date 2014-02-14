/*\
title: $:/core/modules/utils/logger.js
type: application/javascript
module-type: utils

A basic logging implementation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Make a new logger
*/
function Logger(componentName) {
	this.componentName = componentName || "";
}

/*
Log a message
*/
Logger.prototype.log = function(/* args */) {
	if(console !== undefined && console.log !== undefined) {
		return Function.apply.call(console.log, console, [this.componentName + ":"].concat(Array.prototype.slice.call(arguments,0)));
	}
};

/*
Alert a message
*/
Logger.prototype.alert = function(/* args */) {
	var text = Array.prototype.join.call(arguments," "),
		fields = {
			title: $tw.wiki.generateNewTitle("$:/temp/alerts/alert",{prefix: ""}),
			text: text,
			tags: ["$:/tags/Alert"],
			component: this.componentName,
			modified: new Date()
		};
	$tw.wiki.addTiddler(new $tw.Tiddler(fields));
	// Log it too
	this.log.apply(this,Array.prototype.slice.call(arguments,0));
};

exports.Logger = Logger;

})();
