/*\
title: js/HTML.js

Represents a fragment of HTML as a JavaScript object tree structure. Helper methods are provided to simplify
constructing HTML trees and to render the tree as an HTML string.

The nodes in the tree have a `type` field that is the name of the node for HTML elements:

	{type: "br", attributes: {name: "value"}}

Attributes values can be strings, arrays of strings or hashmaps. String arrays are
rendered by joining them together with a space. Hashmaps are rendered as `attr="name1:value1;name2:value2;"`.

Elements with child nodes are expressed as:

	{type: "div", children: [<childnodes>]}

Text nodes are represented as:

	{type: "text", value: "A string"}

HTML entities are represented as:

	{type: "entity", value: "quot"}

It is sometimes useful to be able to mix raw strings of HTML too:

	{type: "raw", value: "<div>Something</div>"}

Other types of node can also be placed in the tree, but they will be ignored by the built-in render function.
For example, nodes of type `"macro"` are used by the WikiTextParser.

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js");

/*
Constructs an HTMLParseTree from a tree of nodes. A single node or an array of nodes can be passed.

As a shortcut, the constructor can be called as an ordinary function without the new keyword, in which case
it automatically returns the `text/html` rendering of the tree.
*/
var HTML = function(tree,type) {
	if(this instanceof HTML) {
		// Called as a constructor
		this.tree = tree;
	} else {
		// Called as a function
		type = type || "text/html";
		return (new HTML(tree)).render(type);	
	}
};

/*
Static method to simplify constructing an HTML element node
	type: element name
	attributes: hashmap of element attributes to add
	options: hashmap of options
The attributes hashmap can contain strings or hashmaps of strings, (they are processed to attr="name1:value1;name2:value2;")
The options include:
	content: a string to include as content in the element (also generates closing tag)
	classes: an array of classnames to apply to the element
	selfClosing: causes the element to be rendered with a trailing /, as in <br />
	insertAfterAttributes: a string to insert after the attribute section of the element
*/
HTML.elem = function(type,attributes,children) {
	var e = {type: type};
	if(attributes) {
		e.attributes = attributes;
	}
	if(children) {
		e.children = children;
	}
	return e;
};

/*
Static method to construct a text node
*/
HTML.text = function(value) {
	return {type: "text", value: value};
};

/*
Static method to construct an entity
*/
HTML.entity = function(value) {
	return {type: "entity", value: value};
};

/*
Static method to construct a raw HTML node
*/
HTML.raw = function(value) {
	return {type: "raw", value: value};
};

/*
Static method to construct a split label
*/
HTML.splitLabel = function(type,left,right,classes) {
	classes = (classes || []).slice(0);
	classes.push("splitLabel");
	return HTML.elem("span",{
		"class": classes
	},[
		HTML.elem("span",{
			"class": ["splitLabelLeft"],
			"data-tw-label-type": type
		},left),
		HTML.elem("span",{
			"class": ["splitLabelRight"]
		},right)
	]);
};

/*
Static method to construct a slider
*/
HTML.slider = function(type,label,tooltip,body) {
	var attributes = {
		"class": "tw-slider",
		"data-tw-slider-type": type
	};
	if(tooltip) {
		attributes.alt = tooltip;
		attributes.title = tooltip;
	}
	return HTML.elem("div",
		attributes,
		[
			HTML.elem("a",
				{
					"class": ["tw-slider-label"]
				},[
					HTML.text(label)
				]
			),
			HTML.elem("div",
				{
					"class": ["tw-slider-body"],
					"style": {"display": "none"}
				},
				body
			)
		]
	);
};

/*
Render the HTML tree to a string, either of "text/html" or "text/plain"
*/
HTML.prototype.render = function(targetType) {
	if(targetType == "text/plain") {
		return this.renderPlain().join("");
	} else if(targetType == "text/html") {
		return this.renderHtml().join("");
	} else {
		return null;
	}
};

/*
Render the HTML tree to a "text/html" string, returned as a string array
*/
HTML.prototype.renderHtml = function(output,node) {
	output = output || [];
	node = node || this.tree;
	if(node instanceof Array) {
		for(var t=0; t<node.length; t++) {
			this.renderHtml(output,node[t]);
		}
	} else {
		switch(node.type) {
			case "text":
				output.push(utils.htmlEncode(node.value));
				break;
			case "entity":
				output.push(node.value);
				break;
			case "raw":
				output.push(node.value);
				break;
			default:
				output.push("<",node.type);
				if(node.attributes) {
					for(var a in node.attributes) {
						var v = node.attributes[a];
						if(v !== undefined) {
							if(v instanceof Array) {
								v = v.join(" ");
							} else if(typeof v === "object") {
								var s = [];
								for(var p in v) {
									s.push(p + ":" + v[p] + ";");
								}
								v = s.join("");
							}
							output.push(" ");
							output.push(a);
							output.push("='");
							output.push(utils.htmlEncode(v));
							output.push("'");
						}
					}
				}
				output.push(">");
				if(node.children) {
					this.renderHtml(output,node.children);
					output.push("</",node.type,">");
				}
				break;
		}
	}
	return output;
};

/*
Render the HTML tree to a "text/plain" string, returned as a string array
*/
HTML.prototype.renderPlain = function(output,node) {
	output = output || [];
	node = node || this.tree;
	if(node instanceof Array) {
		for(var t=0; t<node.length; t++) {
			this.renderPlain(output,node[t]);
		}
	} else {
		switch(node.type) {
			case "text":
				output.push(node.value);
				break;
			case "entity":
				output.push(utils.entityDecode(node.value));
				break;
			case "raw":
				output.push(node.value);
				break;
			default:
				if(node.children) {
					this.renderPlain(output,node.children);
				}
				break;
		}
	}
	return output;
};

exports.HTML = HTML;

})();
