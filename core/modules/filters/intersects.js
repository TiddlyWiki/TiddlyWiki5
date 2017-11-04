/*\
title: $:/core/modules/filters/intersects.js
type: application/javascript
module-type: filteroperator

Filter operator for comparing the contents of an input tiddlers field and the
operand. Titles are returned if there is any overlap between the two lists.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.intersects = function(source,operator,options) {
	var results = [];
  var pass = false;
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
      // Test if the intersection is empty
      let pass = intersection.length !== 0;
      if (!pass && operator.prefix === "!") {
        // For a negated operator add the title if the intersection is empty
        // no intersects
        results.push(title);
      } else if (pass) {
        // For a normal operator add if the intersection isn't empty
        // There is some overlap.
        results.push(title);
      }
    }
  });
	return results;
};

})();
