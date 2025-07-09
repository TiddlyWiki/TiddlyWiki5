/*\
title: $:/macros/classic/macroadapter.js
type: application/javascript
module-type: module
\*/

"use strict";
/*
Information about this module:
rename macros and
re-jig macro params from tw2 to tw5 style
new macros created as a result of adapting tw2 should be 
prepended "__system" to distinguish them from the actual used name
*/
const sliceSeparator = "::";
const sectionSeparator = "##";

function getsectionname(title) {
	if(!title)
		return "";
	const pos = title.indexOf(sectionSeparator);
	if(pos != -1) {
		return title.substr(pos + sectionSeparator.length);
	}
	return "";
}
function getslicename(title) {
	if(!title)
		return "";
	const pos = title.indexOf(sliceSeparator);
	if(pos != -1) {
		return title.substr(pos + sliceSeparator.length);
	}
	return "";
};
function gettiddlername(title) {
	if(!title)
		return "";
	let pos = title.indexOf(sectionSeparator);

	if(pos != -1) {
		return title.substr(0,pos);
	}
	pos = title.indexOf(sliceSeparator);
	if(pos != -1) {
		return title.substr(0,pos);
	}
	return title;
}

const parserparams = function(paramString) {
	const params = [];
	const reParam = /\s*(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^"'\s]+)))/mg;
	let paramMatch = reParam.exec(paramString);
	while(paramMatch) {
		// Process this parameter
		const paramInfo = {
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
};
const tabshandler = function(paramstring) {
	const params = parserparams(paramstring);
	const cookie = params[0].value;
	const numTabs = (params.length - 1) / 3;
	let t;
	let tabslist = "";
	const labelarray = {};
	const promptarray = {};
	for(t = 0;t < numTabs;t++) {
		const contentName = params[t * 3 + 3].value;
		tabslist = `${tabslist} ${contentName}`;
		labelarray[contentName] = params[t * 3 + 1].value;
		promptarray[contentName] = params[t * 3 + 2].value;
	}
	//Create a list of names (tiddlers, tiddler/sections, tiddler/slices), and create maps from name -> label and name -> prompt
	//Use json to implement maps 
	return `"""${tabslist}""" """${JSON.stringify(promptarray)}""" """${JSON.stringify(labelarray)}""" """${cookie}"""`;
};
const namedapter = {tabs: '__system_tabs'};
const paramadapter = {
	tabs: tabshandler
};
exports.name = 'macroadapter';
exports.namedapter = namedapter;
exports.paramadapter = paramadapter;
