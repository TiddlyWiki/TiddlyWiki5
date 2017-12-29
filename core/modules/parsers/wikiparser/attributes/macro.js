/*\
title: $:/core/modules/parsers/wikiparser/attributes/macro.js
type: application/javascript
module-type: attributerule

Tag attribute parser rule for macros and variables, eg. <<currentTiddler>>.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.macro = function(source,pos,node) {
	// Is it a macro invocation?
	var macroInvocation = $tw.utils.parseMacroInvocation(source,pos);
	if (!macroInvocation) return null;
	node.type = "macro";
	node.value = macroInvocation;
	node.end = macroInvocation.end;
	return node;
};

})();
