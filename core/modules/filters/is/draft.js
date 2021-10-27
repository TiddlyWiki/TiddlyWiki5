/*\
title: $:/core/modules/filters/is/draft.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[draft]] analagous to [has[draft.of]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.draft = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(!tiddler || !$tw.utils.hop(tiddler.fields,"draft.of")) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(tiddler && $tw.utils.hop(tiddler.fields,"draft.of") && (tiddler.fields["draft.of"].length !== 0)) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
