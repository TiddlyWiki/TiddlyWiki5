/*\
title: $:/core/modules/parsers/wikiparser/basewikiparser.js
type: application/javascript
module-type: parser

The base wiki text parser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var createClassesFromList= function (ruleList, subtype) {
	var classes = Object.create(null),mylist = " ";
	var allrules = $tw.modules.getModulesByTypeAndSubtypeAsHashmap("wikirule", subtype);
	for (var i=0;i<ruleList.length;i++) {
		var moduleExports=allrules[ruleList[i]];
		if (!!moduleExports) { 
			var newClass = function() {};
			newClass.prototype = new $tw.WikiRuleBase();
			newClass.prototype.constructor = $tw.WikiRuleBase;
			$tw.utils.extend(newClass.prototype,moduleExports);
			classes[moduleExports.name] = newClass;
			mylist += moduleExports.name+" ";
		}
	}
	//alert(mylist);
	return classes;
};
var ParserPrimer = function(type,text,options) {
	//BJ meditation if I pass in the complete type here, then I could use this to cache the 
	//Parser objects.
    if (!!options.parserrules) {//if($tw.browser)alert("createrules");
		this.pragmaRuleClasses=createClassesFromList(options.parserrules.pragmaRuleList,"pragma");
		this.blockRuleClasses=createClassesFromList(options.parserrules.blockRuleList,"block");
		this.inlineRuleClasses=createClassesFromList(options.parserrules.inlineRuleList,"inline");
	} else {
		this.pragmaRuleClasses={};
		this.blockRuleClasses={};
		this.inlineRuleClasses={};
	}
	// Save the parse text
	this.type = type || "text/vnd.twbase";
	this.source = text || "";
	this.options = options;
};
//realise the parser from the abstr parser
var  FullWikiParser5= function (type,text,options) { 
	require("$:/core/modules/parsers/wikiparser/abstractwikiparser.js")["AbstrWikiParser"].
												call(this,new ParserPrimer(type,text,options));
}
FullWikiParser5.prototype =Object.create( 
	require("$:/core/modules/parsers/wikiparser/abstractwikiparser.js")["AbstrWikiParser"].prototype);

exports["text/vnd.twbase"] = FullWikiParser5;

})();

