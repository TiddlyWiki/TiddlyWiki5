/*\
title: $:/core/modules/utils/utils.js
type: application/javascript
module-type: utils

Various static utility functions.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Trim whitespace from the start and end of a string
Thanks to Steven Levithan, http://blog.stevenlevithan.com/archives/faster-trim-javascript
*/
exports.trim = function(str) {
	if(typeof str === "string") {
		return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	} else {
		return str;
	}
};

/*
Return the number of keys in an object
*/
exports.count = function(object) {
	var s = 0;
	$tw.utils.each(object,function() {s++;});
	return s;
};

/*
Check if an array is equal by value and by reference.
*/
exports.isArrayEqual = function(array1,array2) {
	if(array1 === array2) {
		return true;
	}
	array1 = array1 || [];
	array2 = array2 || [];
	if(array1.length !== array2.length) {
		return false;
	}
	return array1.every(function(value,index) {
		return value === array2[index];
	});
};

/*
Push entries onto an array, removing them first if they already exist in the array
	array: array to modify (assumed to be free of duplicates)
	value: a single value to push or an array of values to push
*/
exports.pushTop = function(array,value) {
	var t,p;
	if($tw.utils.isArray(value)) {
		// Remove any array entries that are duplicated in the new values
		if(value.length !== 0) {
			if(array.length !== 0) {
				if(value.length < array.length) {
					for(t=0; t<value.length; t++) {
						p = array.indexOf(value[t]);
						if(p !== -1) {
							array.splice(p,1);
						}
					}
				} else {
					for(t=array.length-1; t>=0; t--) {
						p = value.indexOf(array[t]);
						if(p !== -1) {
							array.splice(t,1);
						}
					}
				}
			}
			// Push the values on top of the main array
			array.push.apply(array,value);
		}
	} else {
		p = array.indexOf(value);
		if(p !== -1) {
			array.splice(p,1);
		}
		array.push(value);
	}
};

/*
Remove entries from an array
	array: array to modify
	value: a single value to remove, or an array of values to remove
*/
exports.removeArrayEntries = function(array,value) {
	var t,p;
	if($tw.utils.isArray(value)) {
		for(t=0; t<value.length; t++) {
			p = array.indexOf(value[t]);
			if(p !== -1) {
				array.splice(p,1);
			}
		}
	} else {
		p = array.indexOf(value);
		if(p !== -1) {
			array.splice(p,1);
		}
	}
};

/*
Check whether any members of a hashmap are present in another hashmap
*/
exports.checkDependencies = function(dependencies,changes) {
	var hit = false;
	$tw.utils.each(changes,function(change,title) {
		if($tw.utils.hop(dependencies,title)) {
			hit = true;
		}
	});
	return hit;
};

exports.extend = function(object /* [, src] */) {
	$tw.utils.each(Array.prototype.slice.call(arguments, 1), function(source) {
		if(source) {
			for(var property in source) {
				object[property] = source[property];
			}
		}
	});
	return object;
};

exports.deepCopy = function(object) {
	var result,t;
	if($tw.utils.isArray(object)) {
		// Copy arrays
		result = object.slice(0);
	} else if(typeof object === "object") {
		result = {};
		for(t in object) {
			if(object[t] !== undefined) {
				result[t] = $tw.utils.deepCopy(object[t]);
			}
		}
	} else {
		result = object;
	}
	return result;
};

exports.extendDeepCopy = function(object,extendedProperties) {
	var result = $tw.utils.deepCopy(object),t;
	for(t in extendedProperties) {
		if(extendedProperties[t] !== undefined) {
			result[t] = $tw.utils.deepCopy(extendedProperties[t]);
		}
	}
	return result;
};

exports.slowInSlowOut = function(t) {
	return (1 - ((Math.cos(t * Math.PI) + 1) / 2));
};

exports.formatDateString = function (date,template) {
	var t = template.replace(/0hh12/g,$tw.utils.pad($tw.utils.getHours12(date)));
	t = t.replace(/hh12/g,$tw.utils.getHours12(date));
	t = t.replace(/0hh/g,$tw.utils.pad(date.getHours()));
	t = t.replace(/hh/g,date.getHours());
	t = t.replace(/mmm/g,$tw.config.dateFormats.shortMonths[date.getMonth()]);
	t = t.replace(/0mm/g,$tw.utils.pad(date.getMinutes()));
	t = t.replace(/mm/g,date.getMinutes());
	t = t.replace(/0ss/g,$tw.utils.pad(date.getSeconds()));
	t = t.replace(/ss/g,date.getSeconds());
	t = t.replace(/[ap]m/g,$tw.utils.getAmPm(date).toLowerCase());
	t = t.replace(/[AP]M/g,$tw.utils.getAmPm(date).toUpperCase());
	t = t.replace(/wYYYY/g,$tw.utils.getYearForWeekNo(date));
	t = t.replace(/wYY/g,$tw.utils.pad($tw.utils.getYearForWeekNo(date)-2000));
	t = t.replace(/YYYY/g,date.getFullYear());
	t = t.replace(/YY/g,$tw.utils.pad(date.getFullYear()-2000));
	t = t.replace(/MMM/g,$tw.config.dateFormats.months[date.getMonth()]);
	t = t.replace(/0MM/g,$tw.utils.pad(date.getMonth()+1));
	t = t.replace(/MM/g,date.getMonth()+1);
	t = t.replace(/0WW/g,$tw.utils.pad($tw.utils.getWeek(date)));
	t = t.replace(/WW/g,$tw.utils.getWeek(date));
	t = t.replace(/DDD/g,$tw.config.dateFormats.days[date.getDay()]);
	t = t.replace(/ddd/g,$tw.config.dateFormats.shortDays[date.getDay()]);
	t = t.replace(/0DD/g,$tw.utils.pad(date.getDate()));
	t = t.replace(/DDth/g,date.getDate()+$tw.utils.getDaySuffix(date));
	t = t.replace(/DD/g,date.getDate());
	var tz = date.getTimezoneOffset();
	var atz = Math.abs(tz);
	t = t.replace(/TZD/g,(tz < 0 ? '+' : '-') + $tw.utils.pad(Math.floor(atz / 60)) + ':' + $tw.utils.pad(atz % 60));
	t = t.replace(/\\(.)/g,"$1");
	return t;
};

exports.getAmPm = function(date) {
	return date.getHours() >= 12 ? $tw.config.dateFormats.pm : $tw.config.dateFormats.am;
};

exports.getDaySuffix = function(date) {
	return $tw.config.dateFormats.daySuffixes[date.getDate()-1];
};

exports.getWeek = function(date) {
	var dt = new Date(date.getTime());
	var d = dt.getDay();
	if(d === 0) d=7;// JavaScript Sun=0, ISO Sun=7
	dt.setTime(dt.getTime()+(4-d)*86400000);// shift day to Thurs of same week to calculate weekNo
	var n = Math.floor((dt.getTime()-new Date(dt.getFullYear(),0,1)+3600000)/86400000);
	return Math.floor(n/7)+1;
};

exports.getYearForWeekNo = function(date) {
	var dt = new Date(date.getTime());
	var d = dt.getDay();
	if(d === 0) d=7;// JavaScript Sun=0, ISO Sun=7
	dt.setTime(dt.getTime()+(4-d)*86400000);// shift day to Thurs of same week
	return dt.getFullYear();
};

exports.getHours12 = function(date) {
	var h = date.getHours();
	return h > 12 ? h-12 : ( h > 0 ? h : 12 );
};

/*
Convert a date delta in milliseconds into a string representation of "23 seconds ago", "27 minutes ago" etc.
	delta: delta in milliseconds
Returns an object with these members:
	description: string describing the delta period
	updatePeriod: time in millisecond until the string will be inaccurate
*/
exports.getRelativeDate = function(delta) {
	var futurep = false;
	if(delta < 0) {
		delta = -1 * delta;
		futurep = true;
	}
	var units = [
		{name: "Years",   duration:      365 * 24 * 60 * 60 * 1000},
		{name: "Months",  duration: (365/12) * 24 * 60 * 60 * 1000},
		{name: "Days",    duration:            24 * 60 * 60 * 1000},
		{name: "Hours",   duration:                 60 * 60 * 1000},
		{name: "Minutes", duration:                      60 * 1000},
		{name: "Seconds", duration:                           1000}
	];
	for(var t=0; t<units.length; t++) {
		var result = Math.floor(delta / units[t].duration);
		if(result >= 2) {
			return {
				delta: delta,
				description: $tw.language.getString(
					"RelativeDate/" + (futurep ? "Future" : "Past") + "/" + units[t].name,
					{variables:
						{period: result.toString()}
					}
				),
				updatePeriod: units[t].duration
			};
		}
	}
	return {
		delta: delta,
		description: $tw.language.getString(
			"RelativeDate/" + (futurep ? "Future" : "Past") + "/Second",
			{variables:
				{period: "1"}
			}
		),
		updatePeriod: 1000
	};
};

// Convert & to "&amp;", < to "&lt;", > to "&gt;" and " to "&quot;"
exports.htmlEncode = function(s) {
	if(s) {
		return s.toString().replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;");
	} else {
		return "";
	}
};

// Converts all HTML entities to their character equivalents
exports.entityDecode = function(s) {
	var e = s.substr(1,s.length-2); // Strip the & and the ;
	if(e.charAt(0) === "#") {
		if(e.charAt(1) === "x" || e.charAt(1) === "X") {
			return String.fromCharCode(parseInt(e.substr(2),16));	
		} else {
			return String.fromCharCode(parseInt(e.substr(1),10));
		}
	} else {
		var c = $tw.config.htmlEntities[e];
		if(c) {
			return String.fromCharCode(c);
		} else {
			return s; // Couldn't convert it as an entity, just return it raw
		}
	}
};

exports.unescapeLineBreaks = function(s) {
	return s.replace(/\\n/mg,"\n").replace(/\\b/mg," ").replace(/\\s/mg,"\\").replace(/\r/mg,"");
};

/*
 * Returns an escape sequence for given character. Uses \x for characters <=
 * 0xFF to save space, \u for the rest.
 *
 * The code needs to be in sync with th code template in the compilation
 * function for "action" nodes.
 */
// Copied from peg.js, thanks to David Majda
exports.escape = function(ch) {
	var charCode = ch.charCodeAt(0);
	if(charCode <= 0xFF) {
		return '\\x' + $tw.utils.pad(charCode.toString(16).toUpperCase());
	} else {
		return '\\u' + $tw.utils.pad(charCode.toString(16).toUpperCase(),4);
	}
};

// Turns a string into a legal JavaScript string
// Copied from peg.js, thanks to David Majda
exports.stringify = function(s) {
	/*
	* ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
	* literal except for the closing quote character, backslash, carriage return,
	* line separator, paragraph separator, and line feed. Any character may
	* appear in the form of an escape sequence.
	*
	* For portability, we also escape escape all non-ASCII characters.
	*/
	return s
		.replace(/\\/g, '\\\\')            // backslash
		.replace(/"/g, '\\"')              // double quote character
		.replace(/'/g, "\\'")              // single quote character
		.replace(/\r/g, '\\r')             // carriage return
		.replace(/\n/g, '\\n')             // line feed
		.replace(/[\x80-\uFFFF]/g, exports.escape); // non-ASCII characters
};

/*
Escape the RegExp special characters with a preceding backslash
*/
exports.escapeRegExp = function(s) {
    return s.replace(/[\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}]/g, '\\$&');
};

exports.nextTick = function(fn) {
/*global window: false */
	if(typeof window !== "undefined") {
		// Apparently it would be faster to use postMessage - http://dbaron.org/log/20100309-faster-timeouts
		window.setTimeout(fn,4);
	} else {
		process.nextTick(fn);
	}
};

/*
Convert a hyphenated CSS property name into a camel case one
*/
exports.unHyphenateCss = function(propName) {
	return propName.replace(/-([a-z])/gi, function(match0,match1) {
		return match1.toUpperCase();
	});
};

/*
Convert a camelcase CSS property name into a dashed one ("backgroundColor" --> "background-color")
*/
exports.hyphenateCss = function(propName) {
	return propName.replace(/([A-Z])/g, function(match0,match1) {
		return "-" + match1.toLowerCase();
	});
};

/*
Parse a text reference of one of these forms:
* title
* !!field
* title!!field
* title##index
* etc
Returns an object with the following fields, all optional:
* title: tiddler title
* field: tiddler field name
* index: JSON property index
*/
exports.parseTextReference = function(textRef) {
	// Separate out the title, field name and/or JSON indices
	var reTextRef = /^\s*([^!#]+)?(?:(?:!!([^\s]+))|(?:##(.+)))?\s*/mg,
		match = reTextRef.exec(textRef);
	if(match && reTextRef.lastIndex === textRef.length) {
		// Return the parts
		return {
			title: match[1],
			field: match[2],
			index: match[3]
		};
	} else {
		// If we couldn't parse it (eg it started with a)
		return {
			title: textRef
		};
	}
};

/*
Extract the version number from the meta tag or from the boot file
*/

if($tw.browser) {

// Browser version
exports.extractVersionInfo = function() {
	var metatags = document.getElementsByTagName("meta");
	for(var t=0; t<metatags.length; t++) {
		var m = metatags[t];
		if(m.name === "tiddlywiki-version") {
			return m.content;
		}
	}
	return null;
};

} else {

// Server version
exports.extractVersionInfo = function() {
	return $tw.packageInfo.version;
};

}

/*
Get the animation duration in ms
*/
exports.getAnimationDuration = function() {
	return parseInt($tw.wiki.getTiddlerText("$:/config/AnimationDuration","400"),10);
};

/*
Hash a string to a number
Derived from http://stackoverflow.com/a/15710692
*/
exports.hashString = function(str) {
	return str.split("").reduce(function(a,b) {
		a = ((a << 5) - a) + b.charCodeAt(0);
		return a & a;
	},0);
};

/*
Decode a base64 string
*/
exports.base64Decode = function(string64) {
	if($tw.browser) {
		// TODO
		throw "$tw.utils.base64Decode() doesn't work in the browser";
	} else {
		return (new Buffer(string64,"base64")).toString();
	}
};

/*
Convert a hashmap into a tiddler dictionary format sequence of name:value pairs
*/
exports.makeTiddlerDictionary = function(data) {
	var output = [];
	for(var name in data) {
		output.push(name + ": " + data[name]);
	}
	return output.join("\n");
};

/*
High resolution microsecond timer for profiling
*/
exports.timer = function(base) {
	var m;
	if($tw.node) {
		var r = process.hrtime();		
		m =  r[0] * 1e3 + (r[1] / 1e6);
	} else if(window.performance) {
		m = performance.now();
	} else {
		m = Date.now();
	}
	if(typeof base !== "undefined") {
		m = m - base;
	}
	return m;
};

})();
