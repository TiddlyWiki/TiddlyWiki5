/*\
title: $:/core/modules/parsers/wikiparser/rules/filteredtranscludeinline.js
type: application/javascript
module-type: wikirule

Wiki text rule for inline filtered transclusion. For example:

```
{{{ [tag[docs]] }}}
{{{ [tag[docs]] |tooltip}}}
{{{ [tag[docs]] ||TemplateTitle}}}
{{{ [tag[docs]] |tooltip||TemplateTitle}}}
{{{ [tag[docs]] }}width:40;height:50;}.class.class
```

\*/

"use strict";

exports.name = "filteredtranscludeinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp matching the optional tooltip, template, style and classes that
	// follow the filter
	this.reTail = /(?:\|([^\|\{\}]+))?(?:\|\|([^\|\{\}]+))?\}\}([^\}]*)\}(?:\.(\S+))?/y;
};

exports.findNextMatch = function(startPos) {
	this.nextTransclude = $tw.utils.findNextFilteredTransclude(this.parser,startPos,this.reTail,false);
	return this.nextTransclude ? this.nextTransclude.start : undefined;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.nextTransclude.end;
	return [this.nextTransclude.node];
};
