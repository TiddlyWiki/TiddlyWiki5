/*\
title: $:/plugins/tiddlywiki/highlight/highlightblock.js
type: application/javascript
module-type: parser

Wraps up the fenced code blocks parser for highlight and use in TiddlyWiki5

\*/
(function() {

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    var hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js").hljs,
        WikiParser = require("$:/core/modules/parsers/wikiparser/wikiparser.js")["text/vnd.tiddlywiki"],
        BlockParsers = $tw.modules.createClassesFromModules("wikirule", "block", $tw.WikiRuleBase);

    BlockParsers.codeblock.prototype.parse = function() {
        var reEnd = /(\r?\n```$)/mg;
        // Move past the match
        this.parser.pos = this.matchRegExp.lastIndex;
        // Look for the end of the block
        reEnd.lastIndex = this.parser.pos;
        var match = reEnd.exec(this.parser.source),
            text;
        // Process the block
        if (match) {
            text = this.parser.source.substring(this.parser.pos, match.index);
            this.parser.pos = match.index + match[0].length;
        } else {
            text = this.parser.source.substr(this.parser.pos);
            this.parser.pos = this.parser.sourceLength;
        }

        // Return the pre element
        return [{
            type: "element",
            tag: "pre",
            children: [{
                type: "element",
                tag: "code",
                children: [{
                    type: "raw",
                    html: hljs.highlightAuto(text).value
                }]
            }]
        }];
    };

    WikiParser.prototype.blockRuleClasses = BlockParsers;

})();
