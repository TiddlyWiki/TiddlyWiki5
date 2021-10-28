/*\
title: $:/core/modules/parsers/wikiparser/attributes/indirect.js
type: application/javascript
module-type: attributerule

Tag attribute parser rule for transcluded values, eg. {{Layout!!height}}.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.indirect = function(source,pos,node) {
	// Is it an indirect (transcluded) value?
	var reIndirectValue = /\{\{([^\{\}]+)\}\}/g;
	var value = $tw.utils.parseTokenRegExp(source,pos,reIndirectValue);
	if (!value) return null;
	node.type = "indirect";
	node.textReference = value.match[1];
	node.end = value.end;
	return node;
};

})();
