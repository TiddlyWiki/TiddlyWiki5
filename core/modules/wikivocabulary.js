/*\
title: $:/core/modules/parsers/wikiparser/wikivocabulary.js
type: application/javascript
module-type: global

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var WikiVocabulary = function(options) {
	this.wiki = options.wiki;
	// Hashmaps of the various parse rule classes
	this.pragmaRuleClasses = $tw.modules.createClassesFromModules("wikipragmarule",$tw.WikiRule);
	this.blockRuleClasses = $tw.modules.createClassesFromModules("wikiblockrule",$tw.WikiRule);
	this.runRuleClasses = $tw.modules.createClassesFromModules("wikirunrule",$tw.WikiRule);
	// Hashmap of the various renderer classes
	this.rendererClasses = $tw.modules.applyMethods("wikirenderer");
	// Hashmap of the available widgets
	this.widgetClasses = $tw.modules.createClassesFromModules("widget");
};

WikiVocabulary.prototype.parseText = function(type,text) {
	return new $tw.WikiParser(this,type,text,{wiki: this.wiki});
};

exports.WikiVocabulary = WikiVocabulary;

})();

