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
}

var TW_TextNode = function(text) {
	bumpSequenceNumber(this);
	this.textContent = text;
};

var TW_Element = function(tag,namespace) {
	bumpSequenceNumber(this);
	this.isTiddlyWikiFakeDom = true;
	this.tag = tag;
	this.attributes = {};
	this.isRaw = false;
	this.children = [];
	this.namespaceURI = namespace || "http://www.w3.org/1999/xhtml";
};

TW_Element.prototype.setAttribute = function(name,value) {
	if(this.isRaw) {
		throw "Cannot setAttribute on a raw TW_Element";
	}
	this.attributes[name] = value;
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
}

TW_Element.prototype.removeChild = function(node) {
	var p = this.children.indexOf(node);
	if(p !== -1) {
		this.children.splice(p,1);
	}
};

TW_Element.prototype.hasChildNodes = function() {
	return !!this.children.length;
};

Object.defineProperty(TW_Element.prototype, "firstChild", {
    get: function() {
    	return this.children[0];
    }
});

TW_Element.prototype.addEventListener = function(type,listener,useCapture) {
	// Do nothing
};

Object.defineProperty(TW_Element.prototype, "className", {
	get: function() {
		return this.attributes["class"] || "";
	},
    set: function(value) {
    	this.attributes["class"] = value;
    }
});

Object.defineProperty(TW_Element.prototype, "value", {
	get: function() {
		return this.attributes["value"] || "";
	},
    set: function(value) {
    	this.attributes["value"] = value;
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
					output.push(" ",attr[a],"='",$tw.utils.htmlEncode(v),"'");
				}
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
					b.push($tw.utils.htmlEncode(node.textContent));
				}
			});
			return b.join("");
		}
	},
    set: function(value) {
    	this.isRaw = true;
    	this.rawHTML = value;
    }
});

Object.defineProperty(TW_Element.prototype, "textContent", {
	get: function() {
		if(this.isRaw) {
			throw "Cannot get textContent on a raw TW_Element";
		} else {
			var b = [];
			$tw.utils.each(this.children,function(node) {
				b.push(node.textContent);
			});
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
};

exports.fakeDocument = document;

})();
