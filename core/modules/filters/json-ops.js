/*\
title: $:/core/modules/filters/json-ops.js
type: application/javascript
module-type: filteroperator
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

exports["jsondelete"] = function(source,operator,options) {
	var indexes = operator.operands,
		results = [];
	source(function(tiddler,title) {
		var data = $tw.utils.parseJSONSafe(title,title);
		// If parsing failed (data equals original title and is a string), return unchanged
		if(data === title && typeof data === "string") {
			results.push(title);
		} else if(data) {
			data = deleteDataItem(data,indexes);
			results.push(JSON.stringify(data));
		}
	});
	return results;
};

function getDataItemValueAsStrings(data,indexes) {
	// Get the item
	var item = getDataItem(data,indexes);
	// Return the item as a string list
	return convertDataItemValueToStrings(item);
}

function getDataItemKeysAsStrings(data,indexes) {
	// Get the item
	var item = getDataItem(data,indexes);
	// Return the item keys as a string
	return convertDataItemKeysToStrings(item);
}

function convertDataItemValueToStrings(item) {
	// Return the item as a string
	if(item === undefined) {
		return undefined;
	} else if(item === null) {
		return ["null"]
	} else if(typeof item === "object") {
		var results = [],i,t;
		if(Array.isArray(item)) {
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

function convertDataItemKeysToStrings(item) {
	// Return the item as a string
	if(item === undefined) {
		return item;
	} else if(typeof item === "object") {
		if(item === null) {
			return [];
		}
		var results = [];
		if(Array.isArray(item)) {
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
	} else if(Array.isArray(item)) {
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
	} else if(Array.isArray(item)) {
		index = $tw.utils.parseInt(index);
		if(index < 0) { index = index + item.length };
		return item[index]; // Will be undefined if index was out-of-bounds
	} else {
		return undefined;
	}
}

function traverseIndexChain(data,indexes,stopBeforeLast) {
	if(indexes.length === 0 || (indexes.length === 1 && indexes[0] === "")) {
		return data;
	}
	var item = data;
	var stopIndex = stopBeforeLast ? indexes.length - 1 : indexes.length;
	for(var i = 0; i < stopIndex; i++) {
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

function getDataItem(data,indexes) {
	return traverseIndexChain(data,indexes,false);
}

function setDataItem(data,indexes,value) {
	// Ignore attempts to assign undefined
	if(value === undefined) {
		return data;
	}

	if(indexes.length === 0 || (indexes.length === 1 && indexes[0] === "")) {
		return value;
	}

	var current = traverseIndexChain(data,indexes,true);
	if(current === undefined) {
		// Return the original JSON data structure if any of the index strings are invalid
		return data;
	}

	var lastIndex = indexes[indexes.length - 1];
	if(Array.isArray(current)) {
		lastIndex = $tw.utils.parseInt(lastIndex);
		if(lastIndex < 0) { lastIndex = lastIndex + current.length };
	}

	if(typeof current === "object") {
		current[lastIndex] = value;
	}
	return data;
}

function deleteDataItem(data,indexes) {
	// Check for the root item - don't delete the root
	if(indexes.length === 0 || (indexes.length === 1 && indexes[0] === "")) {
		return data;
	}
	// Traverse the JSON data structure using the index chain up to the parent
	var current = traverseIndexChain(data,indexes,true);
	if(current === undefined || current === null) {
		// Return the original JSON data structure if any of the index strings are invalid
		return data;
	}
	// Delete the item at the end of the index chain
	var lastIndex = indexes[indexes.length - 1];
	if(Array.isArray(current) && current !== null) {
		lastIndex = $tw.utils.parseInt(lastIndex);
		if(lastIndex < 0) { lastIndex = lastIndex + current.length };
		// Check if index is valid before splicing
		if(lastIndex >= 0 && lastIndex < current.length) {
			current.splice(lastIndex,1);
		}
	} else if(typeof current === "object" && current !== null) {
		delete current[lastIndex];
	}
	return data;
}
