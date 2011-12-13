/*\
title: js/ArgParser.js

Parse a space-separated string of name:value parameters. Values can be quoted with single quotes, double quotes, double square brackets, or double curly braces.

The parameters are returned in a structure that can be referenced like this:

	(return).byName["name"][0] - First occurance of parameter with a given name
	(return).byPos[0].n - Name of parameter in first position
	(return).byPos[0].v - Value of parameter in first position

Options and their defaults are:

	defaultName: null,
	defaultValue: null,
	noNames: false,
	cascadeDefaults: false

\*/
(function(){

/*jslint node: true */
"use strict";

var ArgParser = function(argString,options) {
	var parseToken = function(match,p) {
		var n;
		if(match[p]) // Double quoted
			n = match[p];
		else if(match[p+1]) // Single quoted
			n = match[p+1];
		else if(match[p+2]) // Double-square-bracket quoted
			n = match[p+2];
		else if(match[p+3]) // Double-brace quoted
			n = match[p+3];
		else if(match[p+4]) // Unquoted
			n = match[p+4];
		else if(match[p+5]) // empty quote
			n = "";
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
				if(v === undefined && options.defaultName) {
					v = n;
					n = options.defaultName;
				} else if(v === undefined && options.defaultValue) {
					v = options.defaultValue;
				}
				this.byPos.push({n:n, v:v});
				if(options.cascadeDefaults) {
					options.defaultName = n;
					options.defaultValue = v;
				}
			}
		}
	} while(match);
	this.byName = {};
	for(var t=0; t<this.byPos.length; t++) {
		n = this.byPos[t].n;
		v = this.byPos[t].v;
		if(n in this.byName)
			this.byName[n].push(v);
		else
			this.byName[n] = [v];
	}
};

// Retrieve the first occurance of a named parameter, or the default if missing
ArgParser.prototype.getValueByName = function(n,defaultValue) {
	var v = this.byName[n];
	return v && v.length > 0 ? v[0] : defaultValue;
};

// Retrieve all the values of a named parameter as an array
ArgParser.prototype.getValuesByName = function(n,defaultValue) {
	var v = this.byName[n];
	return v && v.length > 0 ? v : defaultValue;
};

exports.ArgParser = ArgParser;

})();
