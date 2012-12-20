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
	this.pragmaRuleClasses = this.createClassesFromModules("wikirule","pragma",$tw.WikiRuleBase);
	this.blockRuleClasses = this.createClassesFromModules("wikirule","block",$tw.WikiRuleBase);
	this.inlineRuleClasses = this.createClassesFromModules("wikirule","inline",$tw.WikiRuleBase);
	// Hashmap of the various renderer classes
	this.rendererClasses = $tw.modules.applyMethods("wikirenderer");
	// Hashmap of the available widgets
	this.widgetClasses = this.createClassesFromModules("widget",null,$tw.WidgetBase);
};

/*
Return an array of classes created from the modules of a specified type. Each module should export the properties to be added to those of the optional base class
*/
WikiVocabulary.prototype.createClassesFromModules = function(moduleType,subType,baseClass) {
	var classes = {};
	$tw.modules.forEachModuleOfType(moduleType,function(title,moduleExports) {
		if(!subType || moduleExports.types[subType]) {
			var newClass = function() {};
			if(baseClass) {
				newClass.prototype = new baseClass();
				newClass.prototype.constructor = baseClass;
			}
			$tw.utils.extend(newClass.prototype,moduleExports);
			classes[moduleExports.name] = newClass;
		}
	});
	return classes;
};

/*
Parse a block of text of a specified MIME type
	type: content type of text to be parsed
	text: text
	options: see below
Options include:
	parseAsInline: if true, the text of the tiddler will be parsed as an inline run
*/
WikiVocabulary.prototype.parseText = function(type,text,options) {
	options = options || {};
	return new $tw.WikiParser(this,type,text,{
		parseAsInline: options.parseAsInline,
		wiki: this.wiki
	});
};

exports.WikiVocabulary = WikiVocabulary;

})();

