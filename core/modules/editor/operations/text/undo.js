/*\
title: $:/core/modules/editor/operations/text/undo.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to tell the browser to perform an undo

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["undo"] = function(event,operation) {
	this.execCommand("undo");
};

})();
