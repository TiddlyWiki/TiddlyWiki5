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

var base64utf8 = require("$:/core/modules/utils/base64-utf8/base64-utf8.module.js");

/*
Display a message, in colour if we're on a terminal
*/
exports.log = function(text,colour) {
	console.log($tw.node ? exports.terminalColour(colour) + text + exports.terminalColour() : text);
};

exports.terminalColour = function(colour) {
	if(!$tw.browser && $tw.node && process.stdout.isTTY) {
		if(colour) {
			var code = exports.terminalColourLookup[colour];
			if(code) {
				return "\x1b[" + code + "m";
			}
		} else {
			return "\x1b[0m"; // Cancel colour
		}
	}
	return "";
};

exports.terminalColourLookup = {
	"black": "0;30",
	"red": "0;31",
	"green": "0;32",
	"brown/orange": "0;33",
	"blue": "0;34",
	"purple": "0;35",
	"cyan": "0;36",
	"light gray": "0;37"
};

/*
Display a warning, in colour if we're on a terminal
*/
exports.warning = function(text) {
	exports.log(text,"brown/orange");
};

/*
Log a table of name: value pairs
*/
exports.logTable = function(data,columnNames) {
	if(console.table) {
		console.table(data,columnNames);
	} else {
		$tw.utils.each(data,function(value,name) {
			console.log(name + ": " + value);
		});
	}
}

/*
Return the integer represented by the str (string).
Return the dflt (default) parameter if str is not a base-10 number.
*/
exports.getInt = function(str,deflt) {
	var i = parseInt(str,10);
	return isNaN(i) ? deflt : i;
}

/*
Repeatedly replaces a substring within a string. Like String.prototype.replace, but without any of the default special handling of $ sequences in the replace string
*/
exports.replaceString = function(text,search,replace) {
	return text.replace(search,function() {
		return replace;
	});
};

/*
Repeats a string
*/
exports.repeat = function(str,count) {
	var result = "";
	for(var t=0;t<count;t++) {
		result += str;
	}
	return result;
};

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

exports.trimPrefix = function(str,unwanted) {
	if(typeof str === "string" && typeof unwanted === "string") {
		if(unwanted === "") {
			return str.replace(/^\s\s*/, '');
		} else {
			// Safely regexp-escape the unwanted text
			unwanted = unwanted.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
			var regex = new RegExp('^(' + unwanted + ')+');
			return str.replace(regex, '');
		}
	} else {
		return str;
	}
};

exports.trimSuffix = function(str,unwanted) {
	if(typeof str === "string" && typeof unwanted === "string") {
		if(unwanted === "") {
			return str.replace(/\s\s*$/, '');
		} else {
			// Safely regexp-escape the unwanted text
			unwanted = unwanted.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
			var regex = new RegExp('(' + unwanted + ')+$');
			return str.replace(regex, '');
		}
	} else {
		return str;
	}
};

/*
Convert a string to sentence case (ie capitalise first letter)
*/
exports.toSentenceCase = function(str) {
	return (str || "").replace(/^\S/, function(c) {return c.toUpperCase();});
}

/*
Convert a string to title case (ie capitalise each initial letter)
*/
exports.toTitleCase = function(str) {
	return (str || "").replace(/(^|\s)\S/g, function(c) {return c.toUpperCase();});
}
	
/*
Find the line break preceding a given position in a string
Returns position immediately after that line break, or the start of the string
*/
exports.findPrecedingLineBreak = function(text,pos) {
	var result = text.lastIndexOf("\n",pos - 1);
	if(result === -1) {
		result = 0;
	} else {
		result++;
		if(text.charAt(result) === "\r") {
			result++;
		}
	}
	return result;
};

/*
Find the line break following a given position in a string
*/
exports.findFollowingLineBreak = function(text,pos) {
	// Cut to just past the following line break, or to the end of the text
	var result = text.indexOf("\n",pos);
	if(result === -1) {
		result = text.length;
	} else {
		if(text.charAt(result) === "\r") {
			result++;
		}
	}
	return result;
};

/*
Return the number of keys in an object
*/
exports.count = function(object) {
	return Object.keys(object || {}).length;
};

/*
Determine whether an array-item is an object-property
*/
exports.hopArray = function(object,array) {
	for(var i=0; i<array.length; i++) {
		if($tw.utils.hop(object,array[i])) {
			return true;
		}
	}
	return false;
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

exports.deepFreeze = function deepFreeze(object) {
	var property, key;
	if(object) {
		Object.freeze(object);
		for(key in object) {
			property = object[key];
			if($tw.utils.hop(object,key) && (typeof property === "object") && !Object.isFrozen(property)) {
				deepFreeze(property);
			}
		}
	}
};

exports.slowInSlowOut = function(t) {
	return (1 - ((Math.cos(t * Math.PI) + 1) / 2));
};

exports.formatDateString = function(date,template) {
	var result = "",
		t = template,
		matches = [
			[/^0hh12/, function() {
				return $tw.utils.pad($tw.utils.getHours12(date));
			}],
			[/^wYYYY/, function() {
				return $tw.utils.pad($tw.utils.getYearForWeekNo(date),4);
			}],
			[/^hh12/, function() {
				return $tw.utils.getHours12(date);
			}],
			[/^DDth/, function() {
				return date.getDate() + $tw.utils.getDaySuffix(date);
			}],
			[/^YYYY/, function() {
				return $tw.utils.pad(date.getFullYear(),4);
			}],
			[/^aYYYY/, function() {
				return $tw.utils.pad(Math.abs(date.getFullYear()),4);
			}],
			[/^\{era:([^,\|}]*)\|([^}\|]*)\|([^}]*)\}/, function(match) {
				var year = date.getFullYear();
				return year === 0 ? match[2] : (year < 0 ? match[1] : match[3]);
			}],
			[/^0hh/, function() {
				return $tw.utils.pad(date.getHours());
			}],
			[/^0mm/, function() {
				return $tw.utils.pad(date.getMinutes());
			}],
			[/^0ss/, function() {
				return $tw.utils.pad(date.getSeconds());
			}],
			[/^0XXX/, function() {
				return $tw.utils.pad(date.getMilliseconds(),3);
			}],
			[/^0DD/, function() {
				return $tw.utils.pad(date.getDate());
			}],
			[/^0MM/, function() {
				return $tw.utils.pad(date.getMonth()+1);
			}],
			[/^0WW/, function() {
				return $tw.utils.pad($tw.utils.getWeek(date));
			}],
			[/^ddd/, function() {
				return $tw.language.getString("Date/Short/Day/" + date.getDay());
			}],
			[/^mmm/, function() {
				return $tw.language.getString("Date/Short/Month/" + (date.getMonth() + 1));
			}],
			[/^DDD/, function() {
				return $tw.language.getString("Date/Long/Day/" + date.getDay());
			}],
			[/^MMM/, function() {
				return $tw.language.getString("Date/Long/Month/" + (date.getMonth() + 1));
			}],
			[/^TZD/, function() {
				var tz = date.getTimezoneOffset(),
				atz = Math.abs(tz);
				return (tz < 0 ? '+' : '-') + $tw.utils.pad(Math.floor(atz / 60)) + ':' + $tw.utils.pad(atz % 60);
			}],
			[/^wYY/, function() {
				return $tw.utils.pad($tw.utils.getYearForWeekNo(date) - 2000);
			}],
			[/^[ap]m/, function() {
				return $tw.utils.getAmPm(date).toLowerCase();
			}],
			[/^hh/, function() {
				return date.getHours();
			}],
			[/^mm/, function() {
				return date.getMinutes();
			}],
			[/^ss/, function() {
				return date.getSeconds();
			}],
			[/^XXX/, function() {
				return date.getMilliseconds();
			}],
			[/^[AP]M/, function() {
				return $tw.utils.getAmPm(date).toUpperCase();
			}],
			[/^DD/, function() {
				return date.getDate();
			}],
			[/^MM/, function() {
				return date.getMonth() + 1;
			}],
			[/^WW/, function() {
				return $tw.utils.getWeek(date);
			}],
			[/^YY/, function() {
				return $tw.utils.pad(date.getFullYear() - 2000);
			}]
		];
	// If the user wants everything in UTC, shift the datestamp
	// Optimize for format string that essentially means
	// 'return raw UTC (tiddlywiki style) date string.'
	if(t.indexOf("[UTC]") == 0 ) {
		if(t == "[UTC]YYYY0MM0DD0hh0mm0ssXXX")
			return $tw.utils.stringifyDate(new Date());
		var offset = date.getTimezoneOffset() ; // in minutes
		date = new Date(date.getTime()+offset*60*1000) ;
		t = t.substr(5) ;
	}
	while(t.length){
		var matchString = "";
		$tw.utils.each(matches, function(m) {
			var match = m[0].exec(t);
			if(match) {
				matchString = m[1].call(null,match);
				t = t.substr(match[0].length);
				return false;
			}
		});
		if(matchString) {
			result += matchString;
		} else {
			result += t.charAt(0);
			t = t.substr(1);
		}
	}
	result = result.replace(/\\(.)/g,"$1");
	return result;
};

exports.getAmPm = function(date) {
	return $tw.language.getString("Date/Period/" + (date.getHours() >= 12 ? "pm" : "am"));
};

exports.getDaySuffix = function(date) {
	return $tw.language.getString("Date/DaySuffix/" + date.getDate());
};

exports.getWeek = function(date) {
	var dt = new Date(date.getTime());
	var d = dt.getDay();
	if(d === 0) {
		d = 7; // JavaScript Sun=0, ISO Sun=7
	}
	dt.setTime(dt.getTime() + (4 - d) * 86400000);// shift day to Thurs of same week to calculate weekNo
	var x = new Date(dt.getFullYear(),0,1);
	var n = Math.floor((dt.getTime() - x.getTime()) / 86400000);
	return Math.floor(n / 7) + 1;
};

exports.getYearForWeekNo = function(date) {
	var dt = new Date(date.getTime());
	var d = dt.getDay();
	if(d === 0) {
		d = 7; // JavaScript Sun=0, ISO Sun=7
	}
	dt.setTime(dt.getTime() + (4 - d) * 86400000);// shift day to Thurs of same week
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

// Convert & to "&amp;", < to "&lt;", > to "&gt;", " to "&quot;"
exports.htmlEncode = function(s) {
	if(s) {
		return s.toString().replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;");
	} else {
		return "";
	}
};

// Converts all HTML entities to their character equivalents
exports.entityDecode = function(s) {
	var converter = String.fromCodePoint || String.fromCharCode,
		e = s.substr(1,s.length-2), // Strip the & and the ;
		c;
	if(e.charAt(0) === "#") {
		if(e.charAt(1) === "x" || e.charAt(1) === "X") {
			c = parseInt(e.substr(2),16);
		} else {
			c = parseInt(e.substr(1),10);
		}
		if(isNaN(c)) {
			return s;
		} else {
			return converter(c);
		}
	} else {
		c = $tw.config.htmlEntities[e];
		if(c) {
			return converter(c);
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
exports.stringify = function(s, rawUnicode) {
	/*
	* ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
	* literal except for the closing quote character, backslash, carriage return,
	* line separator, paragraph separator, and line feed. Any character may
	* appear in the form of an escape sequence.
	*
	* For portability, we also escape all non-ASCII characters.
	*/
	var regex = rawUnicode ? /[\x00-\x1f]/g : /[\x00-\x1f\x80-\uFFFF]/g;
	return (s || "")
		.replace(/\\/g, '\\\\')            // backslash
		.replace(/"/g, '\\"')              // double quote character
		.replace(/'/g, "\\'")              // single quote character
		.replace(/\r/g, '\\r')             // carriage return
		.replace(/\n/g, '\\n')             // line feed
		.replace(regex, exports.escape);   // non-ASCII characters
};

// Turns a string into a legal JSON string
// Derived from peg.js, thanks to David Majda
exports.jsonStringify = function(s, rawUnicode) {
	// See http://www.json.org/
	var regex = rawUnicode ? /[\x00-\x1f]/g : /[\x00-\x1f\x80-\uFFFF]/g;
	return (s || "")
		.replace(/\\/g, '\\\\')            // backslash
		.replace(/"/g, '\\"')              // double quote character
		.replace(/\r/g, '\\r')             // carriage return
		.replace(/\n/g, '\\n')             // line feed
		.replace(/\x08/g, '\\b')           // backspace
		.replace(/\x0c/g, '\\f')           // formfeed
		.replace(/\t/g, '\\t')             // tab
		.replace(regex,function(s) {
			return '\\u' + $tw.utils.pad(s.charCodeAt(0).toString(16).toUpperCase(),4);
		}); // non-ASCII characters
};

/*
Escape the RegExp special characters with a preceding backslash
*/
exports.escapeRegExp = function(s) {
    return s.replace(/[\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}]/g, '\\$&');
};

// Checks whether a link target is external, i.e. not a tiddler title
exports.isLinkExternal = function(to) {
	var externalRegExp = /^(?:file|http|https|mailto|ftp|irc|news|data|skype):[^\s<>{}\[\]`|"\\^]+(?:\/|\b)/i;
	return externalRegExp.test(to);
};

exports.nextTick = function(fn) {
/*global window: false */
	if(typeof process === "undefined") {
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
	var reTextRef = /(?:(.*?)!!(.+))|(?:(.*?)##(.+))|(.*)/mg,
		match = reTextRef.exec(textRef),
		result = {};
	if(match && reTextRef.lastIndex === textRef.length) {
		// Return the parts
		if(match[1]) {
			result.title = match[1];
		}
		if(match[2]) {
			result.field = match[2];
		}
		if(match[3]) {
			result.title = match[3];
		}
		if(match[4]) {
			result.index = match[4];
		}
		if(match[5]) {
			result.title = match[5];
		}
	} else {
		// If we couldn't parse it
		result.title = textRef
	}
	return result;
};

/*
Checks whether a string is a valid fieldname
*/
exports.isValidFieldName = function(name) {
	if(!name || typeof name !== "string") {
		return false;
	}
	name = name.toLowerCase().trim();
	var fieldValidatorRegEx = /^[a-z0-9\-\._]+$/mg;
	return fieldValidatorRegEx.test(name);
};

/*
Extract the version number from the meta tag or from the boot file
*/

// Browser version
exports.extractVersionInfo = function() {
	if($tw.packageInfo) {
		return $tw.packageInfo.version;
	} else {
		var metatags = document.getElementsByTagName("meta");
		for(var t=0; t<metatags.length; t++) {
			var m = metatags[t];
			if(m.name === "tiddlywiki-version") {
				return m.content;
			}
		}
	}
	return null;
};

/*
Get the animation duration in ms
*/
exports.getAnimationDuration = function() {
	return parseInt($tw.wiki.getTiddlerText("$:/config/AnimationDuration","400"),10) || 0;
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
	return base64utf8.base64.decode.call(base64utf8,string64);
};

/*
Encode a string to base64
*/
exports.base64Encode = function(string64) {
	return base64utf8.base64.encode.call(base64utf8,string64);
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

/*
Convert text and content type to a data URI
*/
exports.makeDataUri = function(text,type,_canonical_uri) {
	type = type || "text/vnd.tiddlywiki";
	var typeInfo = $tw.config.contentTypeInfo[type] || $tw.config.contentTypeInfo["text/plain"],
		isBase64 = typeInfo.encoding === "base64",
		parts = [];
	if(_canonical_uri) {
		parts.push(_canonical_uri);
	} else {
		parts.push("data:");
		parts.push(type);
		parts.push(isBase64 ? ";base64" : "");
		parts.push(",");
		parts.push(isBase64 ? text : encodeURIComponent(text));		
	}
	return parts.join("");
};

/*
Useful for finding out the fully escaped CSS selector equivalent to a given tag. For example:

$tw.utils.tagToCssSelector("$:/tags/Stylesheet") --> tc-tagged-\%24\%3A\%2Ftags\%2FStylesheet
*/
exports.tagToCssSelector = function(tagName) {
	return "tc-tagged-" + encodeURIComponent(tagName).replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^`{\|}~,]/mg,function(c) {
		return "\\" + c;
	});
};

/*
IE does not have sign function
*/
exports.sign = Math.sign || function(x) {
	x = +x; // convert to a number
	if (x === 0 || isNaN(x)) {
		return x;
	}
	return x > 0 ? 1 : -1;
};

/*
IE does not have an endsWith function
*/
exports.strEndsWith = function(str,ending,position) {
	if(str.endsWith) {
		return str.endsWith(ending,position);
	} else {
		if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > str.length) {
			position = str.length;
		}
		position -= ending.length;
		var lastIndex = str.indexOf(ending, position);
		return lastIndex !== -1 && lastIndex === position;
	}
};

/*
Return system information useful for debugging
*/
exports.getSystemInfo = function(str,ending,position) {
	var results = [],
		save = function(desc,value) {
			results.push(desc + ": " + value);
		};
	if($tw.browser) {
		save("User Agent",navigator.userAgent);
		save("Online Status",window.navigator.onLine);
	}
	if($tw.node) {
		save("Node Version",process.version);
	}
	return results.join("\n");
};

exports.parseNumber = function(str) {
	return parseFloat(str) || 0;
};

exports.parseInt = function(str) {
	return parseInt(str,10) || 0;
};

exports.stringifyNumber = function(num) {
	return num + "";
};

exports.makeCompareFunction = function(type,options) {
	options = options || {};
	var gt = options.invert ? -1 : +1,
		lt = options.invert ? +1 : -1,
		compare = function(a,b) {
			if(a > b) {
				return gt ;
			} else if(a < b) {
				return lt;
			} else {
				return 0;
			}
		},
		types = {
			"number": function(a,b) {
				return compare($tw.utils.parseNumber(a),$tw.utils.parseNumber(b));
			},
			"integer": function(a,b) {
				return compare($tw.utils.parseInt(a),$tw.utils.parseInt(b));
			},
			"string": function(a,b) {
				return compare("" + a,"" +b);
			},
			"date": function(a,b) {
				var dateA = $tw.utils.parseDate(a),
					dateB = $tw.utils.parseDate(b);
				if(!isFinite(dateA)) {
					dateA = new Date(0);
				}
				if(!isFinite(dateB)) {
					dateB = new Date(0);
				}
				return compare(dateA,dateB);
			},
			"version": function(a,b) {
				return $tw.utils.compareVersions(a,b);
			}
		};
	return (types[type] || types[options.defaultType] || types.number);
};

})();
