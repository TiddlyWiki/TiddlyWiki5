/*\
title: $:/core/modules/filters/islisted.js
type: application/javascript
module-type: filteroperator

Filter operator testing if a tiddler is listed or not listed in another specified tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.islisted = function(source,operator,options) {
	var field = operator.suffix || "list",
    results = [],
    listedList = [];
	source(function(tiddler,title) {
    $tw.utils.pushTop(listedList,options.wiki.findListingsOfTiddler(title,field));
    if (operator.operand && operator.prefix === "!") {
        if(listedList.indexOf(operator.operand) === -1) {
                results.push(title);
            }
        } else {
        	if(listedList.indexOf(operator.operand) !== -1) {
            	results.push(title);
            }
        }
	});
	return results;
};

})();
