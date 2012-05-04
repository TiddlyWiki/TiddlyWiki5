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

var Element = function(type,attributes,children) {
	if(this instanceof Element) {
		this.type = type;
		this.attributes = attributes || {};
		this.children = children;
	} else {
		return new Element(type,attributes,children);
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
	return new Element(this.type,this.attributes,childClones);
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
		output = [];
	if(isHtml) {
		output.push("<",this.type);
		if(this.attributes) {
			for(var a in this.attributes) {
				var v = this.attributes[a];
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
					output.push(" ",a,"='",$tw.utils.htmlEncode(v),"'");
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
	var element = document.createElement(this.type);
	if(this.attributes) {
		for(var a in this.attributes) {
			var v = this.attributes[a];
			if(v !== undefined) {
				if($tw.utils.isArray(v)) { // Ahem, could there be arrays other than className?
					element.className = v.join(" "); 
				} else if (typeof v === "object") { // ...or objects other than style?
					for(var p in v) {
						element.style[p] = v[p];
					}
				} else {
					element.setAttribute(a,v);
				}
			}
		}
	}
	if(insertBefore) {
		parentDomNode.insertBefore(element,insertBefore);
	} else {
		parentDomNode.appendChild(element);
	}
	this.domNode = element;
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

Element.prototype.broadcastEvent = function(event) {
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			if(!this.children[t].broadcastEvent(event)) {
				return false;
			}
		}
	}
	return true;
};

exports.Element = Element;

})();
