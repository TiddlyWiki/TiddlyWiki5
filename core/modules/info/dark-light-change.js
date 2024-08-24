/*\
title: $:/core/modules/info/dark-light-change.js
type: application/javascript
module-type: info

Check for OS of Browser dark / light "(prefers-color-scheme: dark)" info

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.getInfoTiddlerFields = function(updateInfoTiddlersCallback) {
	var infoTiddlerFields = [];
	if($tw.browser) {
 		// Dark mode through event listener on MediaQueryList
		var mqList = window.matchMedia("(prefers-color-scheme: dark)");
		mqList.addEventListener("change", function(event){
			// activate all actions tagged $:/tags/DarkLightChangeActions
			$tw.rootWidget.invokeActionsByTag("$:/tags/DarkLightChangeActions",event,{"dark-mode":mqList.matches ? "yes" : "no"});
		});
	}
	return infoTiddlerFields;
};

})();

