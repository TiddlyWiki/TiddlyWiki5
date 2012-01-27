/*\
title: js/ArgParser.js

Parse a space-separated string of name:value parameters. Values can be quoted with single quotes, double quotes, double square brackets, or double curly braces.

The parameters are returned in a structure that can be referenced like this:

	(return).byName["name"][0] - First occurance of parameter with a given name
	(return).byPos[0].n - Name of parameter in first position
	(return).byPos[0].v.string - Value of parameter in first position
	(return).byPos[0].v.evaluated - True if the parameter is to be evaluated

Options and their defaults are:

	defaultName: null,
	defaultValue: null,
	noNames: false,
	cascadeDefaults: false,
	allowEval: true

\*/
(function(){

/*jslint node: true */
"use strict";

var ArgParser = function(argString,options) {
	options = options || {};
	var defaultName = options.defaultName,
		defaultValue = options.defaultValue;
	var parseToken = function(match,p) {
			var n;
			if(match[p]) { // Double quoted
				n = {string: match[p]};
			} else if(match[p+1]) { // Single quoted
				n = {string: match[p+1]};
			} else if(match[p+2]) { // Double-square-bracket quoted
				n = {string: match[p+2]};
			} else if(match[p+3]) { // Double-brace quoted
				n = {string: match[p+3], evaluated: true};
			} else if(match[p+4]) { // Unquoted
				n = {string: match[p+4]};
			} else if(match[p+5]) { // empty quote
				n = {string: ""};
			}
			return n;
		};
	this.byPos = [];
	var dblQuote = "(?:\"((?:(?:\\\\\")|[^\"])+)\")",
		sngQuote = "(?:'((?:(?:\\\\\')|[^'])+)')",
		dblSquare = "(?:\\[\\[((?:\\s|\\S)*?)\\]\\])",
		dblBrace = "(?:\\{\\{((?:\\s|\\S)*?)\\}\\})",
		unQuoted = options.noNames ? "([^\"'\\s]\\S*)" : "([^\"':\\s][^\\s:]*)",
		emptyQuote = "((?:\"\")|(?:''))",
		skipSpace = "(?:\\s*)",
		token = "(?:" + dblQuote + "|" + sngQuote + "|" + dblSquare + "|" + dblBrace + "|" + unQuoted + "|" + emptyQuote + ")",
		re = options.noNames ? new RegExp(token,"mg") : new RegExp(skipSpace + token + skipSpace + "(?:(\\:)" + skipSpace + token + ")?","mg"),
		match,n,v;
	do {
		match = re.exec(argString);
		if(match) {
			n = parseToken(match,1);
			if(options.noNames) {
				this.byPos.push({n:"", v:n});
			} else {
				v = parseToken(match,8);
				if(v === undefined && defaultName) {
					v = n;
					n = defaultName;
				} else if(v === undefined && defaultValue) {
					v = defaultValue;
				}
				if(n.evaluated === true) {
					n = "{{" + n.string + "}}";
				} else if (typeof n === "object" && n.hasOwnProperty("string")) {
					n = n.string;
				}
				this.byPos.push({n:n, v:v});
				if(options.cascadeDefaults) {
					defaultName = n;
					defaultValue = v;
				}
			}
		}
	} while(match);
	this.byName = {};
	for(var t=0; t<this.byPos.length; t++) {
		n = this.byPos[t].n;
		v = this.byPos[t].v;
		if(this.byName.hasOwnProperty("n"))
			this.byName[n].push(v);
		else
			this.byName[n] = [v];
	}
};

// Retrieve the first occurance of a named parameter, or the default if missing
ArgParser.prototype.getValueByName = function(n) {
	var v = this.byName[n];
	return v && v.length > 0 ? v[0] : null;
};

// Retrieve all the string values as an array
ArgParser.prototype.getStringValues = function() {
	var result = [];
	for(var t=0; t<this.byPos.length; t++) {
		result.push(this.byPos[t].v.string);
	}
	return result;
};

exports.ArgParser = ArgParser;

})();
