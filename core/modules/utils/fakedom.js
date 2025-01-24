/*\
title: $:/core/modules/utils/fakedom.js
type: application/javascript
module-type: global

A barebones implementation of DOM interfaces needed by the rendering mechanism.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Sequence number used to enable us to track objects for testing
var sequenceNumber = null;

var bumpSequenceNumber = function(object) {
	if(sequenceNumber !== null) {
		object.sequenceNumber = sequenceNumber++;
	}
};

var TW_Node = function (){
	throw TypeError("Illegal constructor");
};

Object.defineProperty(TW_Node.prototype, 'ELEMENT_NODE', {
	get: function() {
		return 1;
	}
});

Object.defineProperty(TW_Node.prototype, 'TEXT_NODE', {
	get: function() {
		return 3;
	}
});

var TW_TextNode = function(text) {
	bumpSequenceNumber(this);
	this.textContent = text + "";
};

Object.setPrototypeOf(TW_TextNode.prototype,TW_Node.prototype);

Object.defineProperty(TW_TextNode.prototype, "nodeType", {
	get: function() {
		return this.TEXT_NODE;
	}
});

Object.defineProperty(TW_TextNode.prototype, "formattedTextContent", {
	get: function() {
		return this.textContent.replace(/(\r?\n)/g,"");
	}
});

var TW_Style = function(el) {
	// Define the internal style object
	var styleObject = {
		// Method to get the entire style object
		get: function() {
			return el._style;
		},
		// Method to set styles using a string (e.g. "color:red; background-color:blue;")
		set: function(str) {
			var self = this;
			str = str || "";
			$tw.utils.each(str.split(";"),function(declaration) {
				var parts = declaration.split(":"),
					name = $tw.utils.trim(parts[0]),
					value = $tw.utils.trim(parts[1]);
				if(name && value) {
					el._style[$tw.utils.convertStyleNameToPropertyName(name)] = value;
				}
			});
		},
		// Method to set a specific property without transforming the property name, such as a custom property
		setProperty: function(name, value) {
			el._style[name] = value;
		}
	};

	// Return a Proxy to handle direct access to individual style properties
	return new Proxy(styleObject, {
		get: function(target, property) {
			// If the property exists on styleObject, return it (get, set, setProperty methods)
			if (property in target) {
				return target[property];
			}
			// Otherwise, return the corresponding property from _style
			return el._style[$tw.utils.convertStyleNameToPropertyName(property)] || "";
		},
		set: function(target, property, value) {
			// Set the property in _style
			el._style[$tw.utils.convertStyleNameToPropertyName(property)] = value;
			return true;
		}
	});
};

var TW_Element = function(tag, namespace) {
	bumpSequenceNumber(this);
	this.isTiddlyWikiFakeDom = true;
	this.tag = tag;
	this.attributes = {};
	this.isRaw = false;
	this.children = [];
	this._style = {}; // Internal style object
	this.style = new TW_Style(this); // Proxy for style management
	this.namespaceURI = namespace || "http://www.w3.org/1999/xhtml";
};


Object.setPrototypeOf(TW_Element.prototype,TW_Node.prototype);

Object.defineProperty(TW_Element.prototype, "nodeType", {
	get: function() {
		return this.ELEMENT_NODE;
	}
});

TW_Element.prototype.getAttribute = function(name) {
	if(this.isRaw) {
		throw "Cannot getAttribute on a raw TW_Element";
	}
	return this.attributes[name];
};

TW_Element.prototype.setAttribute = function(name,value) {
	if(this.isRaw) {
		throw "Cannot setAttribute on a raw TW_Element";
	}
	if(name === "style") {
		this.style.set(value);
	} else {
		this.attributes[name] = value + "";
	}
};

TW_Element.prototype.setAttributeNS = function(namespace,name,value) {
	this.setAttribute(name,value);
};

TW_Element.prototype.removeAttribute = function(name) {
	if(this.isRaw) {
		throw "Cannot removeAttribute on a raw TW_Element";
	}
	if($tw.utils.hop(this.attributes,name)) {
		delete this.attributes[name];
	}
};

TW_Element.prototype.appendChild = function(node) {
	this.children.push(node);
	node.parentNode = this;
};

TW_Element.prototype.insertBefore = function(node,nextSibling) {
	if(nextSibling) {
		var p = this.children.indexOf(nextSibling);
		if(p !== -1) {
			this.children.splice(p,0,node);
			node.parentNode = this;
		} else {
			this.appendChild(node);
		}
	} else {
		this.appendChild(node);
	}
};

TW_Element.prototype.removeChild = function(node) {
	var p = this.children.indexOf(node);
	if(p !== -1) {
		this.children.splice(p,1);
	}
};

TW_Element.prototype.hasChildNodes = function() {
	return !!this.children.length;
};

Object.defineProperty(TW_Element.prototype, "childNodes", {
	get: function() {
		return this.children;
	}
});

Object.defineProperty(TW_Element.prototype, "firstChild", {
	get: function() {
		return this.children[0];
	}
});

TW_Element.prototype.addEventListener = function(type,listener,useCapture) {
	// Do nothing
};

Object.defineProperty(TW_Element.prototype, "tagName", {
	get: function() {
		return this.tag || "";
	}
});

Object.defineProperty(TW_Element.prototype, "className", {
	get: function() {
		return this.attributes["class"] || "";
	},
	set: function(value) {
		this.attributes["class"] = value + "";
	}
});

Object.defineProperty(TW_Element.prototype, "value", {
	get: function() {
		return this.attributes.value || "";
	},
	set: function(value) {
		this.attributes.value = value + "";
	}
});

Object.defineProperty(TW_Element.prototype, "outerHTML", {
	get: function() {
		var output = [],attr,a,v;
		output.push("<",this.tag);
		if(this.attributes) {
			attr = [];
			for(a in this.attributes) {
				attr.push(a);
			}
			attr.sort();
			for(a=0; a<attr.length; a++) {
				v = this.attributes[attr[a]];
				if(v !== undefined) {
					output.push(" ",attr[a],"=\"",$tw.utils.htmlEncode(v),"\"");
				}
			}
		}
		if(this._style) {
			var style = [];
			for(var s in this._style) {
				style.push($tw.utils.convertPropertyNameToStyleName(s) + ":" + this._style[s] + ";");
			}
			if(style.length > 0) {
				output.push(" style=\"",style.join(""),"\"");
			}
		}
		output.push(">");
		if($tw.config.htmlVoidElements.indexOf(this.tag) === -1) {
			output.push(this.innerHTML);
			output.push("</",this.tag,">");
		}
		return output.join("");
	}
});

Object.defineProperty(TW_Element.prototype, "innerHTML", {
	get: function() {
		if(this.isRaw) {
			return this.rawHTML;
		} else {
			var b = [];
			$tw.utils.each(this.children,function(node) {
				if(node instanceof TW_Element) {
					b.push(node.outerHTML);
				} else if(node instanceof TW_TextNode) {
					b.push($tw.utils.htmlTextEncode(node.textContent));
				}
			});
			return b.join("");
		}
	},
	set: function(value) {
		this.isRaw = true;
		this.rawHTML = value;
		this.rawTextContent = null;
	}
});

Object.defineProperty(TW_Element.prototype, "textInnerHTML", {
	set: function(value) {
		if(this.isRaw) {
			this.rawTextContent = value;
		} else {
			throw "Cannot set textInnerHTML of a non-raw TW_Element";
		}
	}
});

Object.defineProperty(TW_Element.prototype, "textContent", {
	get: function() {
		if(this.isRaw) {
			if(this.rawTextContent === null) {
				return "";
			} else {
				return this.rawTextContent;
			}
		} else {
			var b = [];
			$tw.utils.each(this.children,function(node) {
				b.push(node.textContent);
			});
			return b.join("");
		}
	},
	set: function(value) {
		this.children = [new TW_TextNode(value)];
	}
});

Object.defineProperty(TW_Element.prototype, "formattedTextContent", {
	get: function() {
		if(this.isRaw) {
			return "";
		} else {
			var b = [],
				isBlock = $tw.config.htmlBlockElements.indexOf(this.tag) !== -1;
			if(isBlock) {
				b.push("\n");
			}
			if(this.tag === "li") {
				b.push("* ");
			}
			$tw.utils.each(this.children,function(node) {
				b.push(node.formattedTextContent);
			});
			if(isBlock) {
				b.push("\n");
			}
			return b.join("");
		}
	}
});

var document = {
	setSequenceNumber: function(value) {
		sequenceNumber = value;
	},
	createElementNS: function(namespace,tag) {
		return new TW_Element(tag,namespace);
	},
	createElement: function(tag) {
		return new TW_Element(tag);
	},
	createTextNode: function(text) {
		return new TW_TextNode(text);
	},
	compatMode: "CSS1Compat", // For KaTeX to know that we're not a browser in quirks mode
	isTiddlyWikiFakeDom: true
};

exports.fakeDocument = document;

})();
