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
function Logger() {

}

/*
Make a log function for a particular component
*/
Logger.prototype.makeLog = function(componentName) {
	var self = this;
	return function(/* args */) {
		self.log.apply(self.log,[componentName + ":"].concat(Array.prototype.slice.call(arguments,0)));
	};
};

/*
Log a message
*/
Logger.prototype.log = function(/* args */) {
	if(console !== undefined && console.log !== undefined) {
		return Function.apply.call(console.log, console, arguments);
	}
};

exports.Logger = Logger;

})();
