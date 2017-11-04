/*\
title: $:/core/modules/filters/contains.js
type: application/javascript
module-type: filteroperator

Filter operator for comparing the contents of an input tiddlers field and the
operand.

This filter returns the input title iff the operand is a subset of the given
field of the input.

Example 1:

MyList: 1 2
filter: [[tiddler1]][[tiddler2]]+[contains<MyList>]

tiddler1 list field: 1 2 foo hello

tiddler1 is returned because the list field contains both 1 and 2

tiddler2 list field: 1 foo hello

tiddler2 is not returned because the list field doesn't contain 2

Example 2:

MyList: foo bar
filter: [[tiddler1]][[tiddler2]]+[contains:tags<MyList>]

tiddler1 tags: foo bar baz

tiddler 1 returned

tiddler2 tags: foo baz

tiddler 2 not returned

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.contains = function(source,operator,options) {
	var results = [];
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
      let intersection = new Set([...inputSet].filter(x => operandSet.has(x)));
      // Subtract the intersection from the operandSet
      // This only works as a test of equality because we know that the
      // intersection must be a subset of the operandSet. This does not work in
      // general for set equality!
      // Test if the difference is empty, if so the sets are equal
      let pass = [...operandSet].filter(x => !intersection.has(x)).length === 0;
      if (!pass && operator.prefix === "!") {
        results.push(title);
      } else if (pass) {
        results.push(title);
      }
    }
  });
	return results;
};

})();
