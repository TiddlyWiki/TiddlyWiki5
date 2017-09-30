/*\
title: $:/core/modules/filters/regexps.js
type: application/javascript
module-type: filteroperator

Filter operator for regexp matching and returning result. All results are returned if global flag used. All sub-groups are returned if not global and sub-group hits are found.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.regexps = function(source,operator,options) {
	var results = [],
		fieldname = (operator.suffix || "title").toLowerCase(),
		regexpString, regexp, flags = "", match, global,
		getFieldString = function(tiddler,title) {
			if(tiddler) {
				return tiddler.getFieldString(fieldname);
			} else if(fieldname === "title") {
				return title;
			} else {
				return null;
			}
		};
	// Process flags and construct regexp
	regexpString = operator.operand;
	match = /^\(\?([gim]+)\)/.exec(regexpString);
	if(match) {
		flags = match[1];
		regexpString = regexpString.substr(match[0].length);
	} else {
		match = /\(\?([gim]+)\)$/.exec(regexpString);
		if(match) {
			flags = match[1];
			regexpString = regexpString.substr(0,regexpString.length - match[0].length);
		}
	}
	try {
		regexp = new RegExp(regexpString,flags);
	} catch(e) {
		return ["" + e];
	}

	global = /g/.test(flags) ;

	// Process the incoming tiddlers
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			var text = getFieldString(tiddler,title);
			if(text !== null) {
				if(!regexp.exec(text)) {
					results.push(title);
				}
			}
		});
	} else {
		source(function(tiddler,title) {
			var text = getFieldString(tiddler,title), ret="";
			if(text !== null) {
				ret = text.match(regexp) ;
				if(ret !==null) {
					if(global) {
						results.push.apply(results,ret)  ; //DEBUG
					} else {
						// if there are  sub groups return sub groups START
						if(ret.length > 1)  {     // return sub groups
							results = results.concat(ret.slice(1)) ;
						} else { // if no sub-groups
							results.push(ret[0]);
						} 
					}
				}
			}
		});
	}
	return results;
};

})();