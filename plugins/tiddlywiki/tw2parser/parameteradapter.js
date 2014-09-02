/*\
title: $:/macros/classic/macroadapter.js
type: application/javascript
module-type: module
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
/*
Information about this module:
rename macros and
re-jig macro params from tw2 to tw5 style
new macros created as a result of adapting tw2 should be 
prepended "__system" to distinguish them from the actual used name
*/
var sliceSeparator = "::";
var sectionSeparator = "##";

function getsectionname(title) {
	if(!title)
		return "";
	var pos = title.indexOf(sectionSeparator);
	if(pos != -1) {
		return title.substr(pos + sectionSeparator.length);
	}
	return "";
}
function getslicename(title) { 
	if(!title)
		return "";
	var pos = title.indexOf(sliceSeparator);
	if(pos != -1) {
		return title.substr(pos + sliceSeparator.length);
	}
	return "";
};
function gettiddlername(title) {
	if(!title)
		return "";
	var pos = title.indexOf(sectionSeparator);

	if(pos != -1) {
		return title.substr(0,pos);
	}
	pos = title.indexOf(sliceSeparator);
	if(pos != -1) {
		return title.substr(0,pos);
	}
	return title;
}

var parserparams = function(paramString) {
	var params = [],
		reParam = /\s*(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^"'\s]+)))/mg,
		paramMatch = reParam.exec(paramString);
	while(paramMatch) {
		// Process this parameter
		var paramInfo = {
			value: paramMatch[2] || paramMatch[3] || paramMatch[4] || paramMatch[5] || paramMatch[6]
		};
		if(paramMatch[1]) {
			paramInfo.name = paramMatch[1];
		}
		params.push(paramInfo);
		// Find the next match
		paramMatch = reParam.exec(paramString);
	}
	return params;
}
var tabshandler = function(paramstring) {
	var params = parserparams(paramstring);
	var cookie = params[0].value;
	var numTabs = (params.length-1)/3;
	var t;
	var tabslist = "";
	var labelarray = {};
    var promptarray = {};
	for(t=0; t<numTabs; t++) {
		var contentName = params[t*3+3].value;
		tabslist = tabslist+" " + contentName;
		labelarray[contentName] = params[t*3+1].value;
		promptarray[contentName] = params[t*3+2].value;
	} 
	//Create a list of names (tiddlers, tiddler/sections, tiddler/slices), and create maps from name -> label and name -> prompt
	//Use json to implement maps 
	return '"""'+tabslist +'""" """'+JSON.stringify(promptarray)+'""" """'+JSON.stringify(labelarray)+'""" """'+cookie+'"""';
};
var namedapter = {tabs:'__system_tabs'};
var paramadapter = {
	tabs: tabshandler
}
exports.name = 'macroadapter';
exports.namedapter = namedapter;
exports.paramadapter = paramadapter;
})();
