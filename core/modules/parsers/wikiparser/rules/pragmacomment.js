/*\
title: $:/core/modules/parsers/wikiparser/rules/pragmacomment.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for pragma comment specifications

```
\\ this is comment in pragma "space"
\\ fast comment, since it doesn't produce a parse-tree element

\\define xx()
\\ slow comment because it WILL produce parse-tree elements
\\end
```

\*/
(function(){
    /*jslint node: true, browser: true */
    /*global $tw:false, exports:false*/
    "use strict";
    
    exports.name = "pragmacomment";
    exports.types = {
        pragma: true
    };
    
    /*
    Instantiate parse rule
    */
    exports.init = function (parser) {
        var self = this;
        this.parser = parser;
        // Regexp to match
        this.matchRegExp = /^\\\\/mg;
    };
    
    /*
    Parse the most recent match
    */
    exports.parse = function () {
        // Move past the pragma invocation
        this.parser.pos = this.matchRegExp.lastIndex;
        // Parse line terminated by a line break
        var reMatch = /([^\n]*\S)|(\r?\n)/mg;
    
        reMatch.lastIndex = this.parser.pos;
        var match = reMatch.exec(this.parser.source);
        while (match && match.index === this.parser.pos) {
            this.parser.pos = reMatch.lastIndex;
            // Exit if we've got the line break
            if (match[2]) {
                break;
            }
        }
        return [];
    };
    })();
    