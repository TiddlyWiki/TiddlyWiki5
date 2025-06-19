/*\
title: $:/core/modules/filters/json-ops.js
type: application/javascript
module-type: filteroperator

Filter operators for JSON operations

\*/

"use strict";

exports["jsonget"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var data = $tw.utils.parseJSONSafe(title,title);
		if(data) {
			var items = getDataItemValueAsStrings(data,operator.operands);
			if(items !== undefined) {
				results.push.apply(results,items);
			}
		}
	});
	return results;
};

exports["jsonextract"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var data = $tw.utils.parseJSONSafe(title,title);
		if(data) {
			var item = getDataItem(data,operator.operands);
			if(item !== undefined) {
				results.push(JSON.stringify(item));
			}
		}
	});
	return results;
};

exports["jsonindexes"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var data = $tw.utils.parseJSONSafe(title,title);
		if(data) {
			var items = getDataItemKeysAsStrings(data,operator.operands);
			if(items !== undefined) {
				results.push.apply(results,items);
			}
		}
	});
	return results;
};

exports["jsontype"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var data = $tw.utils.parseJSONSafe(title,title);
		if(data) {
			var item = getDataItemType(data,operator.operands);
			if(item !== undefined) {
				results.push(item);
			}
		}
	});
	return results;
};

exports["jsonset"] = function(source,operator,options) {
	var suffixes = operator.suffixes || [],
		type = suffixes[0] && suffixes[0][0],
		indexes = operator.operands.slice(0,-1),
		value = operator.operands[operator.operands.length - 1],
		results = [];
	if(operator.operands.length === 1 && operator.operands[0] === "") {
		value = undefined; // Prevents the value from being assigned
	}
	switch(type) {
		case "string":
			// Use value unchanged
			break;
		case "boolean":
			value = (value === "true" ? true : (value === "false" ? false : undefined));
			break;
		case "number":
			value = $tw.utils.parseNumber(value);
			break;
		case "array":
			indexes = operator.operands;
			value = [];
			break;
		case "object":
			indexes = operator.operands;
			value = {};
			break;
		case "null":
			indexes = operator.operands;
			value = null;
			break;
		case "json":
			value = $tw.utils.parseJSONSafe(value,function() {return undefined;});
			break;
		default:
			// Use value unchanged
			break;
	}
	source(function(tiddler,title) {
		var data = $tw.utils.parseJSONSafe(title,title);
		if(data) {
			data = setDataItem(data,indexes,value);
			results.push(JSON.stringify(data));
		}
	});
	return results;
};

/*
Given a JSON data structure and an array of index strings, return an array of the string representation of the values at the end of the index chain, or "undefined" if any of the index strings are invalid
*/
function getDataItemValueAsStrings(data,indexes) {
	// Get the item
	var item = getDataItem(data,indexes);
	// Return the item as a string list
	return convertDataItemValueToStrings(item);
}

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
Return an array of the string representation of the values of a data item, or "undefined" if the item is undefined
*/
function convertDataItemValueToStrings(item) {
	// Return the item as a string
	if(item === undefined) {
		return undefined;
	} else if(item === null) {
		return ["null"]
	} else if(typeof item === "object") {
		var results = [],i,t;
		if($tw.utils.isArray(item)) {
			// Return all the items in arrays recursively
			for(i=0; i<item.length; i++) {
				t = convertDataItemValueToStrings(item[i])
				if(t !== undefined) {
					results.push.apply(results,t);
				}
			}
		} else {
			// Return all the values in objects recursively
			$tw.utils.each(Object.keys(item).sort(),function(key) {
				t = convertDataItemValueToStrings(item[key]);
				if(t !== undefined) {
					results.push.apply(results,t);
				}
			});
		}
		return results;
	}
	return [item.toString()];
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

function getDataItemType(data,indexes) {
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

function getItemAtIndex(item,index) {
	if($tw.utils.hop(item,index)) {
		return item[index];
	} else if($tw.utils.isArray(item)) {
		index = $tw.utils.parseInt(index);
		if(index < 0) { index = index + item.length };
		return item[index]; // Will be undefined if index was out-of-bounds
	} else {
		return undefined;
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
			if(item !== null && ["number","string","boolean"].indexOf(typeof item) === -1) {
				item = getItemAtIndex(item,indexes[i]);
			} else {
				item = undefined;
			}
		}
	}
	return item;
}

/*
Given a JSON data structure, an array of index strings and a value, return the data structure with the value added at the end of the index chain. If any of the index strings are invalid then the JSON data structure is returned unmodified. If the root item is targetted then a different data object will be returned
*/
function setDataItem(data,indexes,value) {
	// Ignore attempts to assign undefined
	if(value === undefined) {
		return data;
	}
	// Check for the root item
	if(indexes.length === 0 || (indexes.length === 1 && indexes[0] === "")) {
		return value;
	}
	// Traverse the JSON data structure using the index chain
	var current = data;
	for(var i = 0; i < indexes.length - 1; i++) {
		current = getItemAtIndex(current,indexes[i]);
		if(current === undefined) {
			// Return the original JSON data structure if any of the index strings are invalid
			return data;
		}
	}
	// Add the value to the end of the index chain
	var lastIndex = indexes[indexes.length - 1];
	if($tw.utils.isArray(current)) {
		lastIndex = $tw.utils.parseInt(lastIndex);
		if(lastIndex < 0) { lastIndex = lastIndex + current.length };
	}
	// Only set indexes on objects and arrays
	if(typeof current === "object") {
		current[lastIndex] = value;
	}
	return data;
}
