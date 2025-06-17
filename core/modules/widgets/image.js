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

const directDOMAttributes =	{
	width: "width",
	height: "height",
	usemap: "usemap",
	alt: "alt",
	tooltip: "title"
}

/*
Render this widget into the DOM
*/
ImageWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();

	var tag = "img",
		src = resolveImageSource(this, this.imageSource),
		tiddler = this.wiki.getTiddler(this.imageSource);

	// If it's a PDF, use <embed>
	if(tiddler && this.wiki.isImageTiddler(this.imageSource)) {
		var type = tiddler.fields.type;
		var typeInfo = $tw.config.contentTypeInfo[type] || {};
		var deserializerType = typeInfo.deserializerType || type;
		if(deserializerType === "application/pdf") {
			tag = "embed";
		}
	}
	// Create the element and assign the attributes
	var domNode = this.document.createElement(tag);
	domNode.setAttribute("src", src);
	if(this.imageClass) {
		domNode.setAttribute("class", this.imageClass);
	}
	this.assignAttributes(domNode,{
		sourcePrefix: "data-",
		destPrefix: "data-",
		additionalAttributesMap: directDOMAttributes
	});
	if(this.lazyLoading && tag === "img") {
		domNode.setAttribute("loading", this.lazyLoading);
	}
	if(this.imageSrcset && tag === "img") {
		domNode.setAttribute("srcset", resolveSrcset(this.imageSrcset, this));
	}
	if(this.imageSizes && tag === "img") {
		domNode.setAttribute("sizes", this.imageSizes);
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

ImageWidget.prototype.execute = function() {
	this.imageSource = this.getAttribute("source");
	this.imageWidth = this.getAttribute("width");
	this.imageHeight = this.getAttribute("height");
	this.imageClass = this.getAttribute("class");
	this.imageUsemap = this.getAttribute("usemap");
	this.imageTooltip = this.getAttribute("tooltip");
	this.imageAlt = this.getAttribute("alt");
	this.lazyLoading = this.getAttribute("loading");
	this.imageSrcset = this.getAttribute("srcset");
	this.imageSizes = this.getAttribute("sizes");
	var allSources = [this.imageSource].concat(parseSrcsetTitles(this.imageSrcset));
	this.tiddlerDependencies = allSources.filter(function(title, index, arr) {
		return title && arr.indexOf(title) === index && this.wiki.getTiddler(title);
	}, this);
};

ImageWidget.prototype.refresh = function(changedTiddlers) {
	if(this.tiddlerDependencies && this.tiddlerDependencies.some(title => changedTiddlers[title])) {
		this.refreshSelf();
		return true;
	}
	const alwaysRefreshAttributes = [
			"source",
			"srcset",
			"sizes",
			"loading"
		],
		changedAttributes = this.computeAttributes();

	if(alwaysRefreshAttributes.some(key => changedAttributes.hasOwnProperty(key))) {
		this.refreshSelf();
		return true;
	}

	const attributeRefreshHandlers = {

	};

	let hasOtherChangedAttributes = !!Object.keys(changedAttributes).length;
	Object.keys(changedAttributes).forEach(key => {
		if(attributeRefreshHandlers.hasOwnProperty(key)) {
			const handler = attributeRefreshHandlers[key];
			if(handler) {
				handler(changedAttributes[key], changedTiddlers);
			}
		} else {
			hasOtherChangedAttributes = true;
		}
	});

	if(hasOtherChangedAttributes) {
		this.assignAttributes(this.domNodes[0], {
			sourcePrefix: "data-",
			destPrefix: "data-",
			changedAttributes: changedAttributes,
			additionalAttributesMap: directDOMAttributes
		});
	}
	return false;
};

function resolveImageSource(widget, titleOrUrl) {
	var wiki = widget.wiki,
		tiddler = wiki.getTiddler(titleOrUrl);
	if(!tiddler) {
		// Not a tiddler, assume it's a URL
		return widget.getVariable("tv-get-export-image-link",{params: [{name: "src",value: titleOrUrl}],defaultValue: titleOrUrl});
	}
	if(wiki.isImageTiddler(titleOrUrl)) {
		var blobUrl = getBlobUrlFromTiddler(widget, titleOrUrl);
		if(blobUrl) return blobUrl;
		// fallback to data URI if Blob fails
		var type = tiddler.fields.type,
			text = tiddler.fields.text,
			typeInfo = $tw.config.contentTypeInfo[type] || {},
			deserializerType = typeInfo.deserializerType || type;
		if(text) {
			var encoding = typeInfo.encoding || "utf8";
			if(encoding === "base64") {
				return "data:" + deserializerType + ";base64," + text;
			} else {
				return "data:" + deserializerType + "," + encodeURIComponent(text);
			}
		}
		if(tiddler.fields._canonical_uri) {
			return tiddler.fields._canonical_uri;
		}
	}
	// Not an image tiddler, just return the title
	return titleOrUrl;
}

function parseSrcsetTitles(srcset) {
	if(!srcset) return [];
	return srcset.split(",").map(function(candidate) {
		return candidate.trim().split(/\s+/)[0];
	});
}

function resolveSrcset(srcset, widget) {
	if(!srcset) {
		return "";
	}
	return srcset.split(",").map(function(candidate) {
		var parts = candidate.trim().split(/\s+/);
		var title = parts[0];
		var descriptor = parts.slice(1).join(" ");
		var url = resolveImageSource(widget, title);
		return [url, descriptor].filter(Boolean).join(" ");
	}).join(", ");
}

function getBlobUrlFromTiddler(widget, titleOrUrl) {
	var wiki = widget.wiki,
		tiddler = wiki.getTiddler(titleOrUrl);
	if(!tiddler || !wiki.isImageTiddler(titleOrUrl)) return null;
	var type = tiddler.fields.type,
		text = tiddler.fields.text,
		typeInfo = $tw.config.contentTypeInfo[type] || {},
		encoding = typeInfo.encoding || "utf8";
	if(!text) return null;
	var byteString;
	try {
		if(encoding === "base64") {
			byteString = atob(text);
		} else {
			byteString = decodeURIComponent(text);
		}
		var arrayBuffer = new Uint8Array(byteString.length);
		for(var i = 0; i < byteString.length; i++) {
			arrayBuffer[i] = byteString.charCodeAt(i);
		}
		var blob = new Blob([arrayBuffer], {type: type});
		return URL.createObjectURL(blob);
	} catch(e) {
		if(console && console.warn) {
			console.warn("Failed to create Blob URL for tiddler:", titleOrUrl, e);
		}
		return null; // Fallback will be handled by resolveImageSource
	}
}

exports.image = ImageWidget;
