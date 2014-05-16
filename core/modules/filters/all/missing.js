/*\
title: $:/core/modules/filters/all/missing.js
type: application/javascript
module-type: allfilteroperator

Filter function for [all[missing]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.missing = function(source,prefix,options) {
	return options.wiki.getMissingTitles();
};

})();
