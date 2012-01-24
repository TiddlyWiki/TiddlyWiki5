/*\
title: js/Utils.js

Various static utility functions.

This file is a bit of a dumping ground; the expectation is that most of these functions will be refactored.

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = exports;

utils.deepCopy = function(v) {
	var r,t;
	if(v instanceof Array) {
		r = [];
		for(t=0; t<v.length; t++) {
			r.push(utils.deepCopy(v[t]));
		}
	} else if (typeof v === "object" && v) {
		r = {};
		for(t in v) {
			r[t] = utils.deepCopy(v[t]);
		}
	} else {
		r = v;
	}
	return r;
};

// Pad a string to a certain length with zeros
utils.zeroPad = function(n,d)
{
	var s = n.toString();
	if(s.length < d)
		s = "000000000000000000000000000".substr(0,d-s.length) + s;
	return s;
};

// Convert a date to UTC YYYYMMDDHHMM string format
utils.convertToYYYYMMDDHHMM = function(date)
{
	return date.getUTCFullYear() + utils.zeroPad(date.getUTCMonth()+1,2) + utils.zeroPad(date.getUTCDate(),2) + utils.zeroPad(date.getUTCHours(),2) + utils.zeroPad(date.getUTCMinutes(),2);
};

// Convert a date to UTC YYYYMMDDHHMMSSMMM string format
utils.convertToYYYYMMDDHHMMSSMMM = function(date)
{
	return date.getUTCFullYear() + utils.zeroPad(date.getUTCMonth()+1,2) + utils.zeroPad(date.getUTCDate(),2) + utils.zeroPad(date.getUTCHours(),2) + utils.zeroPad(date.getUTCMinutes(),2) + utils.zeroPad(date.getUTCSeconds(),2) + utils.zeroPad(date.getUTCMilliseconds(),3) +"0";
};

// Create a UTC date from a YYYYMMDDHHMM format string
utils.convertFromYYYYMMDDHHMM = function(d)
{
	return utils.convertFromYYYYMMDDHHMMSSMMM(d.substr(0,12));
};

// Create a UTC date from a YYYYMMDDHHMMSS format string
utils.convertFromYYYYMMDDHHMMSS = function(d)
{
	return utils.convertFromYYYYMMDDHHMMSSMMM(d.substr(0,14));
};

// Create a UTC date from a YYYYMMDDHHMMSSMMM format string
utils.convertFromYYYYMMDDHHMMSSMMM = function(d)
{
	return new Date(Date.UTC(parseInt(d.substr(0,4),10),
			parseInt(d.substr(4,2),10)-1,
			parseInt(d.substr(6,2),10),
			parseInt(d.substr(8,2)||"00",10),
			parseInt(d.substr(10,2)||"00",10),
			parseInt(d.substr(12,2)||"00",10),
			parseInt(d.substr(14,3)||"000",10)));
};

utils.formatDateString = function (date,template) {
	var t = template.replace(/0hh12/g,utils.zeroPad(utils.getHours12(date),2));
	t = t.replace(/hh12/g,utils.getHours12(date));
	t = t.replace(/0hh/g,utils.zeroPad(date.getHours(),2));
	t = t.replace(/hh/g,date.getHours());
	t = t.replace(/mmm/g,utils.dateFormats.shortMonths[date.getMonth()]);
	t = t.replace(/0mm/g,utils.zeroPad(date.getMinutes(),2));
	t = t.replace(/mm/g,date.getMinutes());
	t = t.replace(/0ss/g,utils.zeroPad(date.getSeconds(),2));
	t = t.replace(/ss/g,date.getSeconds());
	t = t.replace(/[ap]m/g,utils.getAmPm(date).toLowerCase());
	t = t.replace(/[AP]M/g,utils.getAmPm(date).toUpperCase());
	t = t.replace(/wYYYY/g,utils.getYearForWeekNo(date));
	t = t.replace(/wYY/g,utils.zeroPad(utils.getYearForWeekNo(date)-2000,2));
	t = t.replace(/YYYY/g,date.getFullYear());
	t = t.replace(/YY/g,utils.zeroPad(date.getFullYear()-2000,2));
	t = t.replace(/MMM/g,utils.dateFormats.months[date.getMonth()]);
	t = t.replace(/0MM/g,utils.zeroPad(date.getMonth()+1,2));
	t = t.replace(/MM/g,date.getMonth()+1);
	t = t.replace(/0WW/g,utils.zeroPad(utils.getWeek(date),2));
	t = t.replace(/WW/g,utils.getWeek(date));
	t = t.replace(/DDD/g,utils.dateFormats.days[date.getDay()]);
	t = t.replace(/ddd/g,utils.dateFormats.shortDays[date.getDay()]);
	t = t.replace(/0DD/g,utils.zeroPad(date.getDate(),2));
	t = t.replace(/DDth/g,date.getDate()+utils.getDaySuffix(date));
	t = t.replace(/DD/g,date.getDate());
	var tz = date.getTimezoneOffset();
	var atz = Math.abs(tz);
	t = t.replace(/TZD/g,(tz < 0 ? '+' : '-') + utils.zeroPad(Math.floor(atz / 60),2) + ':' + utils.zeroPad(atz % 60,2));
	t = t.replace(/\\/g,"");
	return t;
};

utils.dateFormats = {
	months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"],
	days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
	daySuffixes: ["st","nd","rd","th","th","th","th","th","th","th",
		"th","th","th","th","th","th","th","th","th","th",
		"st","nd","rd","th","th","th","th","th","th","th",
		"st"],
	am: "am",
	pm: "pm"
};

utils.getAmPm = function(date) {
	return date.getHours() >= 12 ? utils.dateFormats.pm : utils.dateFormats.am;
};

utils.getDaySuffix = function(date) {
	return utils.dateFormats.daySuffixes[date.getDate()-1];
};

utils.getWeek = function(date) {
	var dt = new Date(date.getTime());
	var d = dt.getDay();
	if(d === 0) d=7;// JavaScript Sun=0, ISO Sun=7
	dt.setTime(dt.getTime()+(4-d)*86400000);// shift day to Thurs of same week to calculate weekNo
	var n = Math.floor((dt.getTime()-new Date(dt.getFullYear(),0,1)+3600000)/86400000);
	return Math.floor(n/7)+1;
};

utils.getYearForWeekNo = function(date) {
	var dt = new Date(date.getTime());
	var d = dt.getDay();
	if(d === 0) d=7;// JavaScript Sun=0, ISO Sun=7
	dt.setTime(dt.getTime()+(4-d)*86400000);// shift day to Thurs of same week
	return dt.getFullYear();
};

utils.getHours12 = function(date) {
	var h = date.getHours();
	return h > 12 ? h-12 : ( h > 0 ? h : 12 );
};

// Convert & to "&amp;", < to "&lt;", > to "&gt;" and " to "&quot;"
utils.htmlEncode = function(s)
{
	if(s) {
		return s.toString().replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;");
	} else {
		return "";
	}
};

// Convert "&amp;" to &, "&lt;" to <, "&gt;" to > and "&quot;" to "
utils.htmlDecode = function(s)
{
	return s.toString().replace(/&lt;/mg,"<").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
};

// Converts all HTML entities to their character equivalents
utils.entityDecode = function(s) {
	var e = s.substr(1,s.length-2); // Strip the & and the ;
	if(e.charAt(0) === "#") {
		if(e.charAt(1) === "x" || e.charAt(1) === "X") {
			return String.fromCharCode(parseInt(e.substr(2),16));	
		} else {
			return String.fromCharCode(parseInt(e.substr(1),10));
		}
	} else {
		var c = utils.htmlEntities[e];
		if(c) {
			return String.fromCharCode(c);
		} else {
			return null;
		}
	}
};

utils.htmlEntities = {quot:34, amp:38, apos:39, lt:60, gt:62, nbsp:160, iexcl:161, cent:162, pound:163, curren:164, yen:165, brvbar:166, sect:167, uml:168, copy:169, ordf:170, laquo:171, not:172, shy:173, reg:174, macr:175, deg:176, plusmn:177, sup2:178, sup3:179, acute:180, micro:181, para:182, middot:183, cedil:184, sup1:185, ordm:186, raquo:187, frac14:188, frac12:189, frac34:190, iquest:191, Agrave:192, Aacute:193, Acirc:194, Atilde:195, Auml:196, Aring:197, AElig:198, Ccedil:199, Egrave:200, Eacute:201, Ecirc:202, Euml:203, Igrave:204, Iacute:205, Icirc:206, Iuml:207, ETH:208, Ntilde:209, Ograve:210, Oacute:211, Ocirc:212, Otilde:213, Ouml:214, times:215, Oslash:216, Ugrave:217, Uacute:218, Ucirc:219, Uuml:220, Yacute:221, THORN:222, szlig:223, agrave:224, aacute:225, acirc:226, atilde:227, auml:228, aring:229, aelig:230, ccedil:231, egrave:232, eacute:233, ecirc:234, euml:235, igrave:236, iacute:237, icirc:238, iuml:239, eth:240, ntilde:241, ograve:242, oacute:243, ocirc:244, otilde:245, ouml:246, divide:247, oslash:248, ugrave:249, uacute:250, ucirc:251, uuml:252, yacute:253, thorn:254, yuml:255, OElig:338, oelig:339, Scaron:352, scaron:353, Yuml:376, fnof:402, circ:710, tilde:732, Alpha:913, Beta:914, Gamma:915, Delta:916, Epsilon:917, Zeta:918, Eta:919, Theta:920, Iota:921, Kappa:922, Lambda:923, Mu:924, Nu:925, Xi:926, Omicron:927, Pi:928, Rho:929, Sigma:931, Tau:932, Upsilon:933, Phi:934, Chi:935, Psi:936, Omega:937, alpha:945, beta:946, gamma:947, delta:948, epsilon:949, zeta:950, eta:951, theta:952, iota:953, kappa:954, lambda:955, mu:956, nu:957, xi:958, omicron:959, pi:960, rho:961, sigmaf:962, sigma:963, tau:964, upsilon:965, phi:966, chi:967, psi:968, omega:969, thetasym:977, upsih:978, piv:982, ensp:8194, emsp:8195, thinsp:8201, zwnj:8204, zwj:8205, lrm:8206, rlm:8207, ndash:8211, mdash:8212, lsquo:8216, rsquo:8217, sbquo:8218, ldquo:8220, rdquo:8221, bdquo:8222, dagger:8224, Dagger:8225, bull:8226, hellip:8230, permil:8240, prime:8242, Prime:8243, lsaquo:8249, rsaquo:8250, oline:8254, frasl:8260, euro:8364, image:8465, weierp:8472, real:8476, trade:8482, alefsym:8501, larr:8592, uarr:8593, rarr:8594, darr:8595, harr:8596, crarr:8629, lArr:8656, uArr:8657, rArr:8658, dArr:8659, hArr:8660, forall:8704, part:8706, exist:8707, empty:8709, nabla:8711, isin:8712, notin:8713, ni:8715, prod:8719, sum:8721, minus:8722, lowast:8727, radic:8730, prop:8733, infin:8734, ang:8736, and:8743, or:8744, cap:8745, cup:8746, int:8747, there4:8756, sim:8764, cong:8773, asymp:8776, ne:8800, equiv:8801, le:8804, ge:8805, sub:8834, sup:8835, nsub:8836, sube:8838, supe:8839, oplus:8853, otimes:8855, perp:8869, sdot:8901, lceil:8968, rceil:8969, lfloor:8970, rfloor:8971, lang:9001, rang:9002, loz:9674, spades:9824, clubs:9827, hearts:9829, diams:9830 };

utils.unescapeLineBreaks = function(s) {
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
utils.escape = function(ch) {
	var escapeChar,
		length,
		charCode = ch.charCodeAt(0);
	if (charCode <= 0xFF) {
		escapeChar = 'x';
		length = 2;
	} else {
		escapeChar = 'u';
		length = 4;
	}
	return '\\' + escapeChar + utils.zeroPad(charCode.toString(16).toUpperCase(),length);
};

// Turns a string into a legal JavaScript string
// Copied from peg.js, thanks to David Majda
utils.stringify = function(s) {
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
		.replace(/[\x80-\uFFFF]/g, utils.escape); // non-ASCII characters
};

// Creates an HTML element string from these arguments:
//		element: element name
//		attributes: hashmap of element attributes to add
//		options: hashmap of options
// The attributes hashmap can contain strings or arrays of strings, which
// are processed to attr="name1:value1;name2:value2;"
// The options include:
//		content: a string to include as content in the element (also generates closing tag)
//		classNames: an array of classnames to apply to the element
//		selfClosing: causes the element to be rendered with a trailing /, as in <br />
//		insertAfterAttributes: a string to insert after the attribute section of the element
utils.stitchElement = function(element,attributes,options) {
	var output = [];
	options = options || {};
	output.push("<",element);
	if(attributes) {
		for(var a in attributes) {
			var v = attributes[a];
			if(v !== undefined) {
				if(typeof v === "object") {
					var s = [];
					for(var t in v) {
						s.push(t + ":" + v[t] + ";");
					}
					v = s.join("");
				}
				output.push(" ");
				output.push(a);
				output.push("='");
				output.push(utils.htmlEncode(v));
				output.push("'");
			}
		}
	}
	if(options.insertAfterAttributes) {
		output.push(options.insertAfterAttributes);
	}
	if(options.classNames) {
		output.push(" class='",options.classNames.join(" "),"'");
	}
	if(options.selfClosing) {
		output.push(" /");
	}
	output.push(">");
	if(options.content) {
		output.push(options.content);
		output.push("</",element,">");
	}
	return output.join("");
};

/*
Render an object and its children to a specified MIME type
	type: target MIME type
	node: object to render
	customTemplates: optionally, an array of custom template functions

Arguments for the custom template functions:
	output: an array to which output strings should be pushed
	type: target MIME type
	node: the node to be examined/rendered

The custom template function should push the string rendering of the node to the output array, and return true, or just return false if it cannot render the node.
*/
utils.renderObject = function(output,type,node,customTemplates) {
	var renderNodeHtml,
		renderArrayHtml = function(output,tree) {
			output.push(utils.stitchElement("ul",null,{classNames: ["treeArray"]}));
			for(var t=0; t<tree.length; t++) {
				output.push(utils.stitchElement("li",null,{classNames: ["treeArrayMember"]}));
				renderNodeHtml(output,tree[t]);
				output.push("</li>");
			}
			output.push("</ul>");
		},
		renderFieldHtml = function(output,name,value) {
			output.push(utils.stitchElement("li",null,{classNames: ["treeNodeField"]}));
			output.push(utils.stitchElement("span",null,{
				content: utils.htmlEncode(name),
				classNames: (typeof value === "object") ? ["label"] : ["splitLabel","splitLabelLeft"]
			}));
			if (value instanceof Array) {
				renderArrayHtml(output,value);
			} else if(typeof value === "object") {
				renderNodeHtml(output,value);
			} else {
				output.push(utils.stitchElement("span",null,{
					content: utils.htmlEncode(value),
					classNames: ["splitLabelRight"]
				}));
			}
			output.push("</li>");
		};
		renderNodeHtml = function(output,node) {
			if(node instanceof Array) {
				renderArrayHtml(output,node);
			} else {
				var custom = false;
				for(var t=0; t<customTemplates.length; t++) {
					if(!custom && customTemplates[t](output,type,node)) {
						custom = true;
					}
				}
				if(!custom) {
					output.push(utils.stitchElement("ul",null,{classNames: ["treeNode"]}));
					for(var f in node) {
						renderFieldHtml(output,f,node[f]);
					}
					output.push("</ul>");
				}
			}
		};
	if(type === "text/html") {
		renderNodeHtml(output,node);
	}
};

utils.nextTick = function(fn) {
/*global window: false */
	if(typeof window !== "undefined") {
		// Apparently it would be faster to use postMessage - http://dbaron.org/log/20100309-faster-timeouts
		window.setTimeout(fn,4);
	} else {
		process.nextTick(fn);
	}
};

})();
