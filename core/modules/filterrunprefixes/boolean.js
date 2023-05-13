/*\
title: $:/core/modules/filterrunprefixes/boolean.js
type: application/javascript
module-type: filterrunprefix

Determine boolean combination of previous and current filter runs
A filter run is considered "true" if its output contains at least one item, and false otherwise
Accordingly, the output of this filter run is either the string "true" or nothing

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/
exports.boolean = function(operationSubFunction,options) {
	return function(results,source,widget) {
    	var suffixes = options.suffixes,
        	boolOp = (suffixes[0] && suffixes[0][0]) || "and",
        	previousRunBoolean = (results.length !== 0),
            opResult = false;

		results.clear();
        switch(boolOp) {
        	case "and":
            	opResult = (previousRunBoolean && (operationSubFunction(source,widget).length !== 0));
            	break;
        	case "or":
            	opResult = (previousRunBoolean || (operationSubFunction(source,widget).length !== 0));
            	break;
        	case "xor":
            	opResult = (previousRunBoolean !== (operationSubFunction(source,widget).length !== 0));
            	break;
        	case "nor":
            	opResult = (!(previousRunBoolean || (operationSubFunction(source,widget).length !== 0)));
            	break;
        	case "nxor":
            	opResult = (!(previousRunBoolean !== (operationSubFunction(source,widget).length !== 0)));
            	break;
         	case "nand":
            	opResult = (!(previousRunBoolean && (operationSubFunction(source,widget).length !== 0)));
            	break;
            default:
            	console.log("Unknown boolean operation ",boolOp);
		}
        if(opResult) {
    		results.pushTop("true");
       	}
	};
};

})();
