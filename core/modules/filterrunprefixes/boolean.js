/*\
title: $:/core/modules/filterrunprefixes/boolean.js
type: application/javascript
module-type: filterrunprefix

Determine boolean combination of previous and current filter runs
A filter run is considered "true" if its output is at least one item, and false otherwise
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
            thisRunResult = operationSubFunction(source,widget),
            thisRunBoolean = (thisRunResult.length !== 0),
            opResult = false;

		results.clear();
        switch(boolOp) {
        	case "and":
            	opResult = (previousRunBoolean && thisRunBoolean);
            	break;
        	case "or":
            	opResult = (previousRunBoolean || thisRunBoolean);
            	break;
        	case "xor":
            	opResult = (previousRunBoolean !== thisRunBoolean);
            	break;
        	case "nor":
            	opResult = (!(previousRunBoolean || thisRunBoolean));
            	break;
        	case "nxor":
            	opResult = (!(previousRunBoolean !== thisRunBoolean));
            	break;
         	case "nand":
            	opResult = (!(previousRunBoolean && thisRunBoolean));
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
