/*\
title: $:/core/modules/filters/matches.js
type: application/javascript
module-type: filteroperator

Filter operator for comparing the contents of an input tiddlers field and the
operand. Titles are returned if the two lists contain the same items.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.matches = function(source,operator,options) {
	var results = [];
  var invert = operator.prefix === "!";
  // Default to using the list field
  var field = operator.suffix || 'list';
  source (function(tiddler,title) {
    // Make sure the tiddler exists and has the field
    if (tiddler && tiddler.fields[field]) {
      // Make field into a set (array then set, but in one step)
      let inputSet = new Set($tw.utils.parseStringArray(tiddler.fields[field]));
      // Make operator into a set
      let operandSet = new Set($tw.utils.parseStringArray(operator.operand));
      // Do the set intersection
      let intersection = [...inputSet].filter(x => operandSet.has(x));
      // Test if the intersection size is equal to the input size and the
      // operand size. If so the input and operand are the same set.
      let pass = intersection.length === inputSet.size && inputSet.size === operandSet.size;
      if (!pass && invert) {
        results.push(title);
      } else if (pass && !invert) {
        results.push(title);
      }
    }
  });
	return results;
};

})();
