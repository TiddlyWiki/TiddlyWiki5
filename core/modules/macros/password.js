/*\
title: $:/core/modules/macros/password.js
type: application/javascript
module-type: macro

Allows a password to be set

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "password",
	params: {
		name: {byName: "default", type: "text"}
	}
};

exports.executeMacro = function() {
	var password = $tw.browser ? $tw.utils.getPassword(this.params.name) : "";
	var attributes = {
		type: "password",
		value: password
	};
	if(this.classes) {
		attributes["class"] = this.classes.slice(0);
	}
	return $tw.Tree.Element("input",attributes,[],{
		events: ["keyup","input"],
		eventHandler: this
	});
};

exports.handleEvent = function(event) {
	var password = this.child.domNode.value;
	return $tw.utils.savePassword(this.params.name,password);
};

})();
