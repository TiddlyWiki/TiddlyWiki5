/*\
title: $:/core/modules/editor/operations/text/redo.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to tell the browser to perform an redo

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["redo"] = function(event,operation) {
	this.execCommand("redo");
};

})();
