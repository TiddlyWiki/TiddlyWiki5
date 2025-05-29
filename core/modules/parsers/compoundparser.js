/*\
title: $:/core/modules/parsers/compoundparser.js
type: application/javascript
module-type: parser

A parser that processes Compound tiddlers (a special type of tiddler that can store 
one or more payload tiddlers).  

\*/

(function(){

    "use strict";
    /*jslint node: true, browser: true */
    /*global $tw: false */
    
    var lib = require("$:/core/modules/utils/functional-parser.js").parserLibrary;
    
    var parser = function(type,text,options) {
    
        const _ = lib.regex(/[\n\r]/);                  // Match any newline character
        const tiddlerSep = lib.regex(/[\n\r]\+[\n\r]/)  // Match a tiddler separator 
    
        const field = lib.sequenceOf([lib.letters, lib.str(':'), lib.allbut(_)])
                        .map(results => ({name: results[0], type: "string", value: results[2].trim()}));
        
        const fields = lib.sepBy(_)(field);
        const textField = lib.allbut(tiddlerSep);
    
        const compoundParser = lib.sequenceOf([fields, textField]).map(results => {
            const newResult = {type: "dataitem", attributes: {}};
            for (let i = 0; i < results[0].length ; i++) {
                newResult.attributes[results[0][i].name] = results[0][i];
            }
            newResult.attributes.text = {name: "text", type: "string", value: results[1]};
            return newResult;
        });;
    
        this.tree = lib.sepBy(tiddlerSep)(compoundParser).run(text).result;
    
        this.source = text;
        this.type = type;
    };
    
    exports["text/vnd.tiddlywiki-multiple"] = parser;
    
    })();