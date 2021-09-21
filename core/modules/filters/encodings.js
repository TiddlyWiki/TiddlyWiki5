/*\
title: $:/core/modules/filters/decodeuricomponent.js
type: application/javascript
module-type: filteroperator

Filter operator for applying decodeURIComponent() to each item.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter functions
*/

exports.decodeuricomponent = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push($tw.utils.decodeURIComponentSafe(title));
	});
	return results;
};

exports.encodeuricomponent = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(encodeURIComponent(title));
	});
	return results;
};

exports.decodeuri = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push($tw.utils.decodeURISafe(title));
	});
	return results;
};

exports.encodeuri = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(encodeURI(title));
	});
	return results;
};

exports.decodehtml = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push($tw.utils.htmlDecode(title));
	});
	return results;
};

exports.encodehtml = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push($tw.utils.htmlEncode(title));
	});
	return results;
};

exports.stringify = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push($tw.utils.stringify(title,(operator.suffix === "rawunicode")));
	});
	return results;
};

exports.jsonstringify = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push($tw.utils.jsonStringify(title,(operator.suffix === "rawunicode")));
	});
	return results;
};

exports.escaperegexp = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push($tw.utils.escapeRegExp(title));
	});
	return results;
};

exports.escapecss = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		// escape any character with a special meaning in CSS using CSS.escape()
		results.push($tw.utils.escapeCSS(title));
	});
	return results;
};

})();
