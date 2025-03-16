/*\
title: $:/core/modules/widgets/image.js
type: application/javascript
module-type: widget

The image widget displays an image referenced with an external URI or with a local tiddler title.

```
<$image src="TiddlerTitle" width="320" height="400" class="classnames">
```

The image source can be the title of an existing tiddler or the URL of an external image.

External images always generate an HTML `<img>` tag.

Tiddlers that have a _canonical_uri field generate an HTML `<img>` tag with the src attribute containing the URI.

Tiddlers that contain image data generate an HTML `<img>` tag with the src attribute containing a base64 representation of the image.

Tiddlers that contain wikitext could be rendered to a DIV of the usual size of a tiddler, and then transformed to the size requested.

The width and height attributes are interpreted as a number of pixels, and do not need to include the "px" suffix.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ImageWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ImageWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ImageWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Create element
	// Determine what type of image it is
	var tag = "img", src = "",
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
	// Create the element and assign the attributes
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
	// Add classes when the image loads or fails
	$tw.utils.addClass(domNode,"tc-image-loading");
	domNode.addEventListener("load",function() {
		$tw.utils.removeClass(domNode,"tc-image-loading");
		$tw.utils.addClass(domNode,"tc-image-loaded");
	},false);
	domNode.addEventListener("error",function() {
		$tw.utils.removeClass(domNode,"tc-image-loading");
		$tw.utils.addClass(domNode,"tc-image-error");
	},false);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
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
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ImageWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.source || changedAttributes.width || changedAttributes.height || changedAttributes["class"] || changedAttributes.usemap || changedAttributes.tooltip || changedTiddlers[this.imageSource]) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.image = ImageWidget;
