/*\
title: $:/core/modules/treenodes/element.js
type: application/javascript
module-type: treenode

Element nodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Node = require("./node.js").Node;

var Element = function(type,attributes,children,options) {
	options = options || {};
	if(this instanceof Element) {
		this.type = type;
		this.attributes = attributes || {};
		this.children = children;
		this.events = options.events;
		this.eventHandler = options.eventHandler;
	} else {
		return new Element(type,attributes,children,options);
	}
};

Element.prototype = new Node();
Element.prototype.constructor = Element;

Element.prototype.clone = function() {
	var childClones;
	if(this.children) {
		childClones = [];
		for(var t=0; t<this.children.length; t++) {
			childClones.push(this.children[t].clone());
		}
	}
	return new Element(this.type,this.attributes,childClones,{
		events: this.events,
		eventHandler: this.eventHandler
	});
};

Element.prototype.execute = function(parents,tiddlerTitle) {
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			this.children[t].execute(parents,tiddlerTitle);
		}
	}
};

Element.prototype.render = function(type) {
	var isHtml = type === "text/html",
		output = [],attr,a,v;
	if(isHtml) {
		output.push("<",this.type);
		if(this.attributes) {
			attr = [];
			for(a in this.attributes) {
				attr.push(a);
			}
			attr.sort();
			for(a=0; a<attr.length; a++) {
				v = this.attributes[attr[a]];
				if(v !== undefined) {
					if($tw.utils.isArray(v)) {
						v = v.join(" ");
					} else if(typeof v === "object") {
						var s = [];
						for(var p in v) {
							s.push(p + ":" + v[p] + ";");
						}
						v = s.join("");
					}
					output.push(" ",attr[a],"='",$tw.utils.htmlEncode(v),"'");
				}
			}
		}
		output.push(">");
	}
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			output.push(this.children[t].render(type));
		}
		if(isHtml) {
			output.push("</",this.type,">");
		}
	}
	return output.join("");
};

Element.prototype.renderInDom = function(parentDomNode,insertBefore) {
	// Create the element
	var element = document.createElement(this.type);
	// Assign the attributes
	if(this.attributes) {
		for(var a in this.attributes) {
			var v = this.attributes[a];
			if(v !== undefined) {
				if($tw.utils.isArray(v)) { // Ahem, could there be arrays other than className?
					element.className = v.join(" "); 
				} else if (typeof v === "object") { // ...or objects other than style?
					for(var p in v) {
						element.style[$tw.utils.unHyphenateCss(p)] = v[p];
					}
				} else {
					element.setAttribute(a,v);
				}
			}
		}
	}
	// Insert it into the DOM tree
	if(insertBefore) {
		parentDomNode.insertBefore(element,insertBefore);
	} else {
		parentDomNode.appendChild(element);
	}
	// Register event handlers
	if(this.events) {
		for(var e=0; e<this.events.length; e++) {
			element.addEventListener(this.events[e],this.eventHandler,false);
		}
	}
	// Save a reference to the DOM element
	this.domNode = element;
	// Render any child nodes
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			this.children[t].renderInDom(element);
		}
	}
};

Element.prototype.refresh = function(changes) {
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			this.children[t].refresh(changes);
		}
	}
};

Element.prototype.refreshInDom = function(changes) {
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			this.children[t].refreshInDom(changes);
		}
	}
};

Element.prototype.addClass = function(className) {
	if(typeof this.attributes["class"] === "string") {
		this.attributes["class"] = this.attributes["class"].split(" ");
	}
	this.attributes["class"] = this.attributes["class"] || [];
	this.attributes["class"].push(className);
};

Element.prototype.addStyles = function(styles) {
	this.attributes.style = this.attributes.style || {};
	for(var t in styles) {
		this.attributes.style[t] = styles[t];
	}
};

exports.Element = Element;

})();
