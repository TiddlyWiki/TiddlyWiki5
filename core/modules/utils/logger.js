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

var ALERT_TAG = "$:/tags/Alert";

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
	// Prepare the text of the alert
	var text = Array.prototype.join.call(arguments," ");
	// Check if there is an existing alert with the same text and the same component
	var existingAlerts = $tw.wiki.getTiddlersWithTag(ALERT_TAG),
		alertFields,
		existingCount,
		self = this;
	$tw.utils.each(existingAlerts,function(title) {
		var tiddler = $tw.wiki.getTiddler(title);
		if(tiddler.fields.text === text && tiddler.fields.component === self.componentName && tiddler.fields.modified && (!alertFields || tiddler.fields.modified < alertFields.modified)) {
				alertFields = $tw.utils.extend({},tiddler.fields);
		}
	});
	if(alertFields) {
		existingCount = alertFields.count || 1;
	} else {
		alertFields = {
			title: $tw.wiki.generateNewTitle("$:/temp/alerts/alert",{prefix: ""}),
			text: text,
			tags: [ALERT_TAG],
			component: this.componentName
		};
		existingCount = 0;
	}
	alertFields.modified = new Date();
	if(++existingCount > 1) {
		alertFields.count = existingCount;
	} else {
		alertFields.count = undefined;
	}
	$tw.wiki.addTiddler(new $tw.Tiddler(alertFields));
	// Log it too
	this.log.apply(this,Array.prototype.slice.call(arguments,0));
};

exports.Logger = Logger;

})();
