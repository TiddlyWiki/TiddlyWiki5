/*\
title: $:/core/modules/parsers/wikiparser/wikiparser.js
type: application/javascript
module-type: parser

The base wiki text parser

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
		returns.pragmaRuleClasses={};
		returns.blockRuleClasses={};
		returns.inlineRuleClasses={};
	}
	// Save the parse text
	returns.type = type || "text/vnd.twbase";
	returns.source = text || "";
	returns.options = options;
	return returns;
	
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

