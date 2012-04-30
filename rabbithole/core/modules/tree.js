/*\
title: $:/core/tree.js
type: application/javascript
module-type: global

Renderer objects encapsulate a tree of nodes that are capable of rendering and selectively updating an
HTML representation of themselves. The following node types are defined:
* ''Macro'' - represents an invocation of a macro
* ''Element'' - represents a single HTML element
* ''Text'' - represents an HTML text node
* ''Entity'' - represents an HTML entity node
* ''Raw'' - represents a chunk of unparsed HTML text

These node types are implemented with prototypal inheritance from a base Node class. One
unusual convenience in the implementation is that the node constructors can be called without an explicit
`new` keyword: the constructors check for `this` not being an instance of themselves, and recursively invoke
themselves with `new` when required.

\*/
(function(){

/*jshint node: true, browser: true */
"use strict";

exports.Tree = {};

})();
