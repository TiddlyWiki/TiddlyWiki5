/*\
title: $:/core/modules/parsers/wikiparser/wikiparser.js
type: application/javascript
module-type: parser

The full wiki text parser

The wiki text parser processes blocks of source text into a parse tree.

The parse tree is made up of nested arrays of these JavaScript objects:

	{type: "element", tag: <string>, attributes: {}, children: []} - an HTML element
	{type: "text", text: <string>} - a text node
	{type: "entity", value: <string>} - an entity
	{type: "raw", html: <string>} - raw HTML

Attributes are stored as hashmaps of the following objects:

	{type: "string", value: <string>} - literal string
	{type: "indirect", textReference: <textReference>} - indirect through a text reference


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var createClassesFromList= function (ruleList) {
	var classes = [],mylist=" ";
	for (var i=0;i<ruleList.length;i++) {
		var moduleExports=$tw.modules.execute("$:/core/modules/parsers/wikiparser/rules/"+ruleList[i]+".js");
		var newClass = function() {};
		newClass.prototype = new $tw.WikiRuleBase();
		newClass.prototype.constructor = $tw.WikiRuleBase;
		$tw.utils.extend(newClass.prototype,moduleExports);
		classes[i] = newClass;
		mylist +=moduleExports.name+" ";
	}
	//alert(mylist);
	return classes;
};
var ParserPrimer = function(type,text,options) {
	//BJ meditation if I pass in the complete type here, then I could use this to cache the 
	//Parser objects.
	var returns={};
    if (!!options.parserrules) {//if($tw.browser)alert("createrules");
		returns.pragmaRuleClasses=createClassesFromList(options.parserrules.pragmaRuleList);
		returns.blockRuleClasses=createClassesFromList(options.parserrules.blockRuleList);
		returns.inlineRuleClasses=createClassesFromList(options.parserrules.inlineRuleList);
	} else {
		// Initialise the classes if we don't have them already
		if(!this.pragmaRuleClasses) {
			ParserPrimer.prototype.pragmaRuleClasses = $tw.modules.createClassesFromModules("wikirule","pragma",$tw.WikiRuleBase);
		}
		if(!this.blockRuleClasses) {
			ParserPrimer.prototype.blockRuleClasses =  $tw.modules.createClassesFromModules("wikirule","block",$tw.WikiRuleBase);
		}
		if(!this.inlineRuleClasses) {
			ParserPrimer.prototype.inlineRuleClasses = $tw.modules.createClassesFromModules("wikirule","inline",$tw.WikiRuleBase);
		}
		returns.pragmaRuleClasses=this.pragmaRuleClasses;
		returns.blockRuleClasses=this.blockRuleClasses;
		returns.inlineRuleClasses=this.inlineRuleClasses;
	}
	// Save the parse text
	returns.type = type || "text/vnd.tiddlywiki";
	returns.source = text || "";
	returns.options = options;
	

	return returns;
	
};

var  WikiParser5= function (type,text,options) { 
	require("$:/core/modules/parsers/wikiparser/basewikiparser.js")["baseWikiParser"].
												call(this,new ParserPrimer(type,text,options));
}
WikiParser5.prototype =Object.create( 
	require("$:/core/modules/parsers/wikiparser/basewikiparser.js")["baseWikiParser"].prototype);

exports["text/vnd.tiddlywiki"] = WikiParser5;

})();

