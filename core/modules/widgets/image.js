/*\
title: $:/core/modules/widgets/image.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ImageWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

ImageWidget.prototype = new Widget();

ImageWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Create element

	var tag = "img", src = "", self = this,
		tiddler = this.wiki.getTiddler(this.imageSource);
	if(!tiddler) {
		// The source isn't the title of a tiddler, so we'll assume it's a URL
		src = this.getVariable("tv-get-export-image-link",{params: [{name: "src",value: this.imageSource}],defaultValue: this.imageSource});
	} else {
		// Check if it is an image tiddler
		if(this.wiki.isImageTiddler(this.imageSource)) {
			var type = tiddler.fields.type,
				text = tiddler.fields.text,
				_canonical_uri = tiddler.fields._canonical_uri,
				typeInfo = $tw.config.contentTypeInfo[type] || {},
				deserializerType = typeInfo.deserializerType || type;
			// If the tiddler has body text then it doesn't need to be lazily loaded
			if(text) {
				// Render the appropriate element for the image type by looking up the encoding in the content type info
				var encoding = typeInfo.encoding || "utf8";
				if (encoding === "base64") {
					// .pdf .png .jpg etc.
					src = "data:" + deserializerType + ";base64," + text;
					if (deserializerType === "application/pdf") {
						tag = "embed";
					}
				} else {
					// .svg .tid .xml etc.
					src = "data:" + deserializerType + "," + encodeURIComponent(text);
				}
			} else if(_canonical_uri) {
				switch(deserializerType) {
					case "application/pdf":
						tag = "embed";
						src = _canonical_uri;
						break;
					case "image/svg+xml":
						src = _canonical_uri;
						break;
					default:
						src = _canonical_uri;
						break;
				}
			} else {
				// Just trigger loading of the tiddler
				this.wiki.getTiddlerText(this.imageSource);
			}
		}
	}

	var domNode = this.document.createElement(tag);
	domNode.setAttribute("src",src);
	if(this.imageClass) {
		domNode.setAttribute("class",this.imageClass);
	}
	if(this.imageUsemap) {
	    	domNode.setAttribute("usemap",this.imageUsemap);
	}
	if(this.imageWidth) {
		domNode.setAttribute("width",this.imageWidth);
	}
	if(this.imageHeight) {
		domNode.setAttribute("height",this.imageHeight);
	}
	if(this.imageTooltip) {
		domNode.setAttribute("title",this.imageTooltip);
	}
	if(this.imageAlt) {
		domNode.setAttribute("alt",this.imageAlt);
	}
	if(this.lazyLoading && tag === "img") {
		domNode.setAttribute("loading",this.lazyLoading);
	}
	this.assignAttributes(domNode,{
		sourcePrefix: "data-",
		destPrefix: "data-"
	});
	// Add classes when the image loads or fails
	$tw.utils.addClass(domNode,"tc-image-loading");
	domNode.addEventListener("load",function(event) {
		$tw.utils.removeClass(domNode,"tc-image-loading");
		$tw.utils.addClass(domNode,"tc-image-loaded");
		if(self.loadedActions) {
			var variables = $tw.utils.collectDOMVariables(domNode,null,event);
			variables["img-natural-width"] = domNode.naturalWidth.toString();
			variables["img-natural-height"] = domNode.naturalHeight.toString();
			self.invokeActionString(self.loadedActions,self,event,variables);
		}
	},false);
	domNode.addEventListener("error",function() {
		$tw.utils.removeClass(domNode,"tc-image-loading");
		$tw.utils.addClass(domNode,"tc-image-error");
	},false);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
};

ImageWidget.prototype.execute = function() {
	// Get our parameters
	this.imageSource = this.getAttribute("source");
	this.imageWidth = this.getAttribute("width");
	this.imageHeight = this.getAttribute("height");
	this.imageClass = this.getAttribute("class");
    	this.imageUsemap = this.getAttribute("usemap");
	this.imageTooltip = this.getAttribute("tooltip");
	this.imageAlt = this.getAttribute("alt");
	this.lazyLoading = this.getAttribute("loading");
	this.loadedActions = this.getAttribute("loadActions");
};

ImageWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		hasChangedAttributes = $tw.utils.count(changedAttributes) > 0;
	if(changedAttributes.source || changedAttributes["class"] || changedAttributes.usemap || changedAttributes.tooltip || changedTiddlers[this.imageSource] ||changedAttributes.loadActions) {
		this.refreshSelf();
		return true;
	} else if(hasChangedAttributes) {
		this.assignAttributes(this.domNodes[0],{
			sourcePrefix: "data-",
			destPrefix: "data-"
		});
		if(changedAttributes.width) {
			this.domNodes[0].setAttribute("width",this.getAttribute("width"));
		}
		if(changedAttributes.height) {
			this.domNodes[0].setAttribute("height",this.getAttribute("height"));
		}
	}
	else {
		return false;
	}
};

exports.image = ImageWidget;
