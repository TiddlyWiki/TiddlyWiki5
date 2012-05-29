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
		as: {byPos: 1, type: "text"},
		shadow: {byPos: 2, type: "text"},
		removePrefix: {byName: true, type: "text"}
	}
};

exports.executeMacro = function() {
	var as = this.params.as || "text/plain",
		wiki = this.hasParameter("shadow") ? this.wiki.shadows : this.wiki,
		t;
	if(this.hasParameter("filter")) {
		var titles = wiki.filterTiddlers(this.params.filter),
			result = [];
		if(this.hasParameter("removePrefix")) {
			for(t=0; t<titles.length; t++) {
				var originalTiddler = this.wiki.getTiddler(titles[t]),
					title = titles[t];
				if(title.indexOf(this.params.removePrefix) === 0) {
					title = title.substr(this.params.removePrefix.length);
					var modifiedTiddler = new $tw.Tiddler(originalTiddler,{title: title});
					result.push(this.wiki.serializeTiddler(modifiedTiddler,as));
				}
			}
		} else {
			for(t=0; t<titles.length; t++) {
				result.push(this.wiki.serializeTiddler(titles[t],as));
			}
		}
		return [$tw.Tree.Element("pre",{},[
				$tw.Tree.Text(result.join("\n"))
			])];
	}
	return [];
};


})();
