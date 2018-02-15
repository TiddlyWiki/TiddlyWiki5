/*\
title: $:/core/modules/filters/uniq.js
type: application/javascript
module-type: filteroperator

Filter operator that selects one tiddler for each unique value of the specified field.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.uniq = function(source,operator,options) {
	var results =[] ,
	value,values = {},
	field = operator.operand || "title";
  if(field === "title") {
    source(function(tiddler,title) {
      if(!$tw.utils.hop(values,title)) {
        values[value] = true;
        results.push(title);
      }
    });
  }
  else {
  	source(function(tiddler,title) {
      if(tiddler) {
  			value = tiddler.getFieldString(field);
  			if(!$tw.utils.hop(values,value)) {
  				values[value] = true;
  				results.push(title);
  			}
  		}
  	});
  }
	return results;
};

})();
