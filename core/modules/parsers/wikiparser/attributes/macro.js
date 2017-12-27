(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.macro = function(source, pos, node) {
	// Is it a macro invocation?
	var macroInvocation = $tw.utils.parseMacroInvocation(source,pos);
	if (!macroInvocation) return null;

	node.type = "macro";
	node.value = macroInvocation;
	node.end = macroInvocation.end;
	return node;
};

})();
