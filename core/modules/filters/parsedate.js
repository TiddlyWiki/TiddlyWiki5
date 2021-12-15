/*\
title: $:/core/modules/filters/parsedate.js
type: application/javascript
module-type: filteroperator

Filter operator converting different date formats into TiddlyWiki's date format

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Parser for the ECMAScript date format as specified in
[ECMA262 Chapter 21.4.1.15](https://tc39.es/ecma262/#sec-date-time-string-format)
*/
function parseECMAScriptDate(input) {
    const dateValidator = new RegExp("^(\\d{4}(-\\d{2}){0,2})?((^|T)\\d{2}:\\d{2}(:\\d{2}(\\.\\d{3})?)?(Z|([+-]\\d{2}:\\d{2}))?)?$");

    if(dateValidator.test(input)) {
        // This code makes ECMAScript 2015 (ES6) behave like ES7 when parsing
        // a date.
        if((input.length < 11) && (input.indexOf("T") === -1)) {
            input += "T00:00:00Z";
        }
        return new Date(input);
    } else {
        return false;
    }
}

/*
Export our filter function
*/
exports.parsedate = function(source,operator,options) {
    var parser = null;
    switch (operator.operand) {
        case "JS":
            parser = parseECMAScriptDate;
            break;
    }
    if(!(parser instanceof Function)) {
        return [$tw.language.getString("Error/ParseDateFilterOperator")];
    }

    var results = [];
    source(function(tiddler,title) {
        const date = parser(title);
        // Check that date is a Date instance _and_ that it contains a valid date
        if((date instanceof Date) && !isNaN(date.valueOf())) {
            results.push($tw.utils.stringifyDate(date));
        }
    });
    return results;
};

})();
