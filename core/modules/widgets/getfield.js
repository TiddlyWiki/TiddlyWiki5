/*\
title: $:/core/modules/filters/getfield.js
type: application/javascript
module-type: filteroperator

Filter operator for getting the field(s) named in the input of the tiddler identified by the operand. Note that unlike the "get" operator, a value is always returned, even if the field is missing (in which case an empty string is returned)

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.getfield = function(source,operator,options) {
    var results = [],
        targetTiddler = options.wiki.getTiddler(operator.operand);
    source(function(tiddler,title) {
        var value = "";
        if(targetTiddler.hasField(title)) {
            value = targetTiddler.getFieldString(title);
        }
        results.push(value);
    });
    return results;
};

})();
