/*\
title: $:/core/modules/parsers/javascriptparser/javascriptparser.js
type: application/javascript
module-type: parser

Parses a JavaScript program into a parse tree

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var esprima = require("./esprima.js");

// Initialise the parser
var JavaScriptParser = function(options) {
    this.wiki = options.wiki;
};

// Parse a string of JavaScript code and return the parse tree as a wikitext parse tree
JavaScriptParser.prototype.parse = function(type,code) {
    // Try to parse the code
    var parseTree;
    try {
        parseTree = esprima.parse(code,{comment: true,tokens: true,range: true});
    } catch(ex) {
        // Return a helpful error if the parse failed
        return new $tw.Renderer([
            $tw.Tree.Element("pre",{"class": "javascript-source"},[
                $tw.Tree.Text(code.substring(0,ex.index)),
                $tw.Tree.errorNode(ex),
                $tw.Tree.Text(code.substring(ex.index))
            ])
        ],new $tw.Dependencies(),this.wiki);
    }
    // Helpers to render the comments and tokens with the appropriate classes
    var self = this,
        result = [],
        nextComment = 0,
        nextToken = 0,
        currPos = 0;
    var renderWhitespace = function(nextPos) {
            if(currPos < nextPos) {
                result.push($tw.Tree.Text(code.substring(currPos,nextPos)));
            }
        },
        renderComment = function(comment) {
            var text = comment.value,
                element,
                classes = ["javascript-comment"],
                content = [];
            renderWhitespace(comment.range[0]);
            if(comment.type === "Block") {
                element = "div";
                classes.push("javascript-block-comment");
                content.push($tw.Tree.Text("/*"));
            } else {
                element = "span";
                classes.push("javascript-line-comment");
                content.push($tw.Tree.Text("//"));
            }
            content.push.apply(content,self.wiki.parseText("text/x-tiddlywiki",text).tree);
            if(comment.type === "Block") {
                content.push($tw.Tree.Text("*/"));
            } else {
                content.push($tw.Tree.Text("\n"));
            }
            result.push($tw.Tree.Element(element,{"class": classes},content));
            currPos = comment.range[1] + 1;
        },
        renderToken = function(token) {
            renderWhitespace(token.range[0]);
            result.push($tw.Tree.Element("span",{
                "class": "javascript-" + token.type.toLowerCase()
            },[
                $tw.Tree.Text(token.value)
            ]));
            currPos = token.range[1] + 1;
        };
    // Process the tokens interleaved with the comments
    while(nextComment < parseTree.comments.length || nextToken < parseTree.tokens.length) {
        if(nextComment < parseTree.comments.length && nextToken < parseTree.tokens.length) {
            if(parseTree.comments[nextComment].range[0] < parseTree.tokens[nextToken].range[0]) {
                renderComment(parseTree.comments[nextComment++]);
            } else {
                renderToken(parseTree.tokens[nextToken++]);
            }
        } else if(nextComment < parseTree.comments.length) {
            renderComment(parseTree.comments[nextComment++]);
        } else {
            renderToken(parseTree.tokens[nextToken++]);
        }
    }
    renderWhitespace(code.length);
    // Wrap the whole lot in a `<PRE>`
    return new $tw.Renderer([
            $tw.Tree.Element("pre",{"class": "javascript-source"},result)
        ],new $tw.Dependencies(),this.wiki);
};

exports["application/javascript"] = JavaScriptParser;

})();
