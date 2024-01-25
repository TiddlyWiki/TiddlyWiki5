/*\
title: $:/core/modules/parsers/wikiparser/rules/filteredtranscludeinline.js
type: application/javascript
module-type: wikirule

Wiki text rule for inline filtered transclusion. For example:

```
{{{ [tag[docs]] }}}
{{{ [tag[docs]] | vars }}}
{{{ [tag[docs]] || TemplateTitle }}}
{{{ [tag[docs]] | vars || TemplateTitle }}}
{{{ [tag[docs]] }} param:"value" | another="value" }

{{{ [tag[docs]] }} param:"value" | another="value" | any text we want 
including line-breaks }
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
	this.matchRegExp = /\{\{\{([^\|]+?)(?:\|([^\|\{\}]+))?(?:\|\|([^\|\{\}]+))?\}\}([^\}]*)\}?/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Get the match details
	var filter = this.match[1],
		vars = this.match[2],
		template = $tw.utils.trim(this.match[3]),
		parms = this.match[4];
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
	if(parms) {
		node.attributes.parms = {type: "string", value: parms};
	}
	return [node];
};

})();
