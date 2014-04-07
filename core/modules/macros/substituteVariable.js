/*\
title: $:/core/modules/macros/substituteVariables.js
type: application/javascript
module-type: macro

Macro to substitute $(variables)$ in text or the text of the specified tiddler.

<<processVariables text:"Text to be converted" tiddler:"Name of tiddler">>

If text evaluates to true, tiddler is ignored.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "processVariables";

exports.params = [
	{name: "text"},
	{name: "tiddler"}
];

exports.run = function(text, tiddler) {
    if(text) return this.substituteVariableReferences(text || "");
    if(tiddler) return this.substituteVariableReferences(this.wiki.getTiddlerText(tiddler) || "");
};

})();
