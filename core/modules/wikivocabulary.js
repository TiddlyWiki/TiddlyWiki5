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
	this.pragmaRules = this.createRuleClasses("wikipragmarule");
	this.blockRules = this.createRuleClasses("wikiblockrule");
	this.runRules = this.createRuleClasses("wikirunrule");
	// Hashmap of the various renderer classes
	this.rendererClasses = $tw.modules.applyMethods("wikirenderer");
	// Hashmap of the available widgets
	this.widgetClasses = $tw.modules.applyMethods("widget");
};

WikiVocabulary.prototype.createRuleClasses = function(moduleType) {
	var ruleClasses = {};
	$tw.modules.forEachModuleOfType(moduleType,function(title,moduleExports) {
		var ruleClass = function(parser) {
			this.parser = parser;
		}
		$tw.utils.extend(ruleClass.prototype,$tw.WikiRuleDefaultProperties,moduleExports);
		ruleClasses[moduleExports.name] = ruleClass;
	});
	return ruleClasses;
};

WikiVocabulary.prototype.parseText = function(type,text) {
	return new $tw.WikiParser(this,type,text,{wiki: this.wiki});
};

exports.WikiVocabulary = WikiVocabulary;

})();

