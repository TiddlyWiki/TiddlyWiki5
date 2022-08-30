/*\
title: $:/core/modules/filters/json-ops.js
type: application/javascript
module-type: newfilteroperator

Filter operators for JSON operations

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["jsonget"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var data = $tw.utils.filterItemToObject(title,{defaultValue: title,parseStringsAsJson: true});
		if(data !== undefined) {
			var item = getDataItem(data,operator.operands);
			if(item !== undefined) {
				results.push(item);
			}
		}
	});
	return results;
};

exports["jsonindexes"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var data = $tw.utils.filterItemToObject(title,{defaultValue: title,parseStringsAsJson: true});
		if(data !== undefined) {
			var item = getDataItemKeysAsStrings(data,operator.operands);
			if(item !== undefined) {
				results.push.apply(results,item);
			}
		}
	});
	return results;
};

exports["jsontype"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var data = $tw.utils.filterItemToObject(title,{defaultValue: title,parseStringsAsJson: true});
		if(data !== undefined) {
			var item = getFilterItemType(data,operator.operands);
			if(item !== undefined) {
				results.push(item);
			}
		}
	});
	return results;
};

exports["jsontypecheck"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var data = $tw.utils.filterItemToObject(title,{defaultValue: title,parseStringsAsJson: false});
		if(data !== undefined) {
			var item = getFilterItemType(data,[]);
			if(item === operator.operand) {
				results.push(title);
			}
		}
	});
	return results;
};

/*
Given a JSON data structure and an array of index strings, return an array of the string representation of the keys of the item at the end of the index chain, or "undefined" if any of the index strings are invalid
*/
function getDataItemKeysAsStrings(data,indexes) {
	// Get the item
	var item = getDataItem(data,indexes);
	// Return the item keys as a string
	return convertDataItemKeysToStrings(item);
}

/*
Return an array of the string representation of the keys of a data item, or "undefined" if the item is undefined
*/
function convertDataItemKeysToStrings(item) {
	// Return the item as a string
	if(item === undefined) {
		return item;
	} else if(typeof item === "object") {
		if(item === null) {
			return [];
		}
		var results = [];
		if($tw.utils.isArray(item)) {
			for(var i=0; i<item.length; i++) {
				results.push(i.toString());
			}
			return results;
		} else {
			$tw.utils.each(Object.keys(item).sort(),function(key) {
				results.push(key);
			});
			return results;
		}
	}
	return [];
}

function getFilterItemType(data,indexes) {
	// Get the item
	var item = getDataItem(data,indexes);
	// Return the item type
	if(item === undefined) {
		return item;
	} else if(item === null) {
		return "null";
	} else if($tw.utils.isArray(item)) {
		return "array";
	} else if(typeof item === "object") {
		return "object";
	} else {
		return typeof item;
	}
}

/*
Given a JSON data structure and an array of index strings, return the value at the end of the index chain, or "undefined" if any of the index strings are invalid
*/
function getDataItem(data,indexes) {
	if(indexes.length === 0 || (indexes.length === 1 && indexes[0] === "")) {
		return data;
	}
	// Get the item
	var item = data;
	for(var i=0; i<indexes.length; i++) {
		if(item !== undefined) {
			item = item[indexes[i]];
		}
	}
	return item;
}

})();
