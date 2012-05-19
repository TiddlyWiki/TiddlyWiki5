/*\
title: $:/core/modules/macros/include.js
type: application/javascript
module-type: macro

Include macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "include",
	params: {
		filter: {byPos: 0, type: "filter"},
		as: {byPos: 1, as: "text"},
		shadow: {byPos: 2, as: "text"}
	}
};

exports.executeMacro = function() {
	var as = this.params.as || "text/plain",
		wiki = this.hasParameter("shadow") ? this.wiki.shadows : this.wiki;
	if(this.hasParameter("filter")) {
		var titles = wiki.filterTiddlers(this.params.filter),
			result = [];
		for(var t=0; t<titles.length; t++) {
			result.push(this.wiki.serializeTiddler(titles[t],as));
		}
		return [$tw.Tree.Element("pre",{},[
				$tw.Tree.Text(result.join("\n"))
			])];
	}
	return [];
};


})();
