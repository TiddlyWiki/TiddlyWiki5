/*\
title: $:/core/modules/parsers/wikiparser/rules/filteredtranscludeinline.js
type: application/javascript
module-type: wikirule

Wiki text rule for inline filtered transclusion. For example:

```
{{{ [tag[docs]] }}}
{{{ [tag[docs]] | vars }}}
{{{ [tag[docs]] || TemplateTitle }}}
{{{ [tag[docs]] | var="test" || TemplateTitle }}}
{{{ [tag[docs]] }} param:"value" | another="value" }

{{{ [tag[docs]] | var="test" || TemplateTitle }} param:"value" | another="value" | any text we want 
including line-breaks }.class1.class2
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "filteredtranscludeinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{\{([^\|]+?)(?:\|([^\|\{\}]+))?(?:\|\|([^\|\{\}]+))?\}\}([^\}]*)\}(?:\.(\S+))?/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var filter = this.match[1],
		vars = this.match[2],
		template = $tw.utils.trim(this.match[3]),
		params = this.match[4],
		classes = this.match[5]
	// Return the list widget
	var node = {
		type: "list",
		attributes: {
			filter: {type: "string", value: filter}
		}
	};
	if(vars) {
		node.attributes.vars = {type: "string", value: vars};
	}
	if(template) {
		node.attributes.template = {type: "string", value: template};
	}
	if(params) {
		node.attributes.params = {type: "string", value: params};
	}
	if(classes) {
		node.attributes.itemClass = {type: "string", value: classes.split(".").join(" ")};
	}
	return [node];
};

})();
