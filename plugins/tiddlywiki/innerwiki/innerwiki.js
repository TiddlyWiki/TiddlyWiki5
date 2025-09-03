/*\
title: $:/plugins/tiddlywiki/innerwiki/innerwiki.js
type: application/javascript
module-type: widget

Widget to display an innerwiki in an iframe

\*/

"use strict";

var DEFAULT_INNERWIKI_TEMPLATE = "$:/plugins/tiddlywiki/innerwiki/template";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	DataWidget = require("$:/core/modules/widgets/data.js").data,
	dm = $tw.utils.domMaker;

var InnerWikiWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
InnerWikiWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
InnerWikiWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Create wrapper
	this.domWrapper = dm("div",{
		document: this.document,
		"class": (this.innerWikiClass || "").split(" ").concat(["tc-innerwiki-wrapper"]).join(" "),
		style: {
			overflow: "hidden",
			position: "relative",
			boxSizing: "content-box"
		}
	});
	// Set up the SVG container
	this.domSVG = dm("svg",{
		namespace: "http://www.w3.org/2000/svg",
		document: this.document,
		style: {
			width: "100%",
			position: "absolute",
			zIndex: "1",
			pointerEvents: "none"
		},
		attributes: {
			"viewBox": "0 0 " + this.innerWikiClipWidth + " " + this.innerWikiClipHeight
		}
	});
	this.domWrapper.appendChild(this.domSVG);
	this.setVariable("namespace","http://www.w3.org/2000/svg");
	// Create the iframe for the browser or image for Node.js
	if(!this.document.isTiddlyWikiFakeDom) {
		// Create iframe
		this.domIFrame = dm("iframe",{
			document: this.document,
			"class": "tc-innerwiki-iframe",
			style: {
				position: "absolute",
				maxWidth: "none",
				border: "none"
			},
			attributes: {
				width: this.innerWikiWidth,
				height: this.innerWikiHeight
			}
		});
		this.domWrapper.appendChild(this.domIFrame);
	} else {
		// Create image placeholder
		this.domImage = dm("img",{
			document: this.document,
			style: {
				width: "100%"
			},
			attributes: {
				src: this.innerWikiFilename
			}
		});
		this.domWrapper.appendChild(this.domImage);
	}
	// Insert wrapper into the DOM
	parent.insertBefore(this.domWrapper,nextSibling);
	this.renderChildren(this.domSVG,null);
	this.domNodes.push(this.domWrapper);
	// If we're on the real DOM, finish the initialisation that needs us to be in the DOM
	if(!this.document.isTiddlyWikiFakeDom) {
		// Write the HTML
		this.domIFrame.contentDocument.open();
		this.domIFrame.contentDocument.write(this.createInnerHTML());
		this.domIFrame.contentDocument.close();
	}
	// Scale the iframe and adjust the height of the wrapper
	this.clipLeft = this.innerWikiClipLeft;
	this.clipTop = this.innerWikiClipTop;
	this.clipWidth = this.innerWikiClipWidth;
	this.clipHeight = this.innerWikiClipHeight;
	this.scale = this.domWrapper.clientWidth / this.clipWidth;
	// Display the anchors
	if(!this.document.isTiddlyWikiFakeDom) {
		this.domAnchorContainer = dm("div",{
			document: this.document,
			style: {
				position: "relative",
				zIndex: "2",
				transformOrigin: "0 0",
				transform:  "scale(" + this.scale + ")"
			}
		});
		this.domAnchorBackdrop = dm("div",{
			document: this.document,
			style: {
				position: "absolute",
				display: "none"
			}
		});
		this.domAnchorContainer.appendChild(this.domAnchorBackdrop);
		this.domWrapper.insertBefore(this.domAnchorContainer,this.domWrapper.firstChild);
		self.createAnchors();
	}
	// Scale the iframe and adjust the height of the wrapper
	if(!this.document.isTiddlyWikiFakeDom) {
		this.domIFrame.style.transformOrigin = this.clipLeft + "px " + this.clipTop + "px";
		this.domIFrame.style.transform = "translate(" + (-this.clipLeft) + "px," + (-this.clipTop) + "px) scale(" + this.scale + ")";
		this.domWrapper.style.height = (this.clipHeight * this.scale) + "px";
	}
};

/*
Create the anchors
*/
InnerWikiWidget.prototype.createAnchors = function() {
	var self = this;
	this.findChildrenDataWidgets(this.children,"anchor",function(widget) {
		var anchorWidth = 40,
			anchorHeight = 40,
			getAnchorCoordinate = function(name) {
				return parseInt(self.wiki.getTiddlerText(widget.getAttribute(name)),10) || 0;
			},
			setAnchorCoordinate = function(name,value) {
				self.wiki.addTiddler({
					title: widget.getAttribute(name),
					text: value + ""
				});
			},
			domAnchor = dm("img",{
				document: self.document,
				style: {
					position: "absolute",
					width: anchorWidth + "px",
					height: anchorHeight + "px",
					transformOrigin: "50% 50%",
					transform: "scale(" + (1 / self.scale) + ")",
					left: (getAnchorCoordinate("x") - anchorWidth / 2) + "px",
					top: (getAnchorCoordinate("y") - anchorHeight / 2) + "px"
				},
				attributes: {
					draggable: false,
					src: "data:image/svg+xml," + encodeURIComponent(self.wiki.getTiddlerText("$:/plugins/tiddlywiki/innerwiki/crosshairs.svg"))
				}
			});
		self.domAnchorContainer.appendChild(domAnchor);
		var posX,posY,dragStartX,dragStartY,deltaX,deltaY,
			fnMouseDown = function(event) {
				self.domAnchorBackdrop.style.width = self.clipWidth + "px";
				self.domAnchorBackdrop.style.height = self.clipHeight + "px";
				self.domAnchorBackdrop.style.display = "block";
				posX = domAnchor.offsetLeft;
				posY = domAnchor.offsetTop;
				dragStartX = event.clientX;
				dragStartY = event.clientY;
				deltaX = 0;
				deltaY = 0;
				self.document.addEventListener("mousemove",fnMouseMove,false);
				self.document.addEventListener("mouseup",fnMouseUp,false);
			},
			fnMouseMove = function(event) {
				deltaX = (event.clientX - dragStartX) / self.scale;
				deltaY = (event.clientY - dragStartY) / self.scale;
				domAnchor.style.left = (posX + deltaX) + "px";
				domAnchor.style.top = (posY + deltaY) + "px";
			},
			fnMouseUp = function(event) {
				var x = getAnchorCoordinate("x") + deltaX,
					y = getAnchorCoordinate("y") + deltaY;
				if(x >= 0 && x < self.clipWidth && y >= 0 && y < self.clipHeight) {
					setAnchorCoordinate("x",x);
					setAnchorCoordinate("y",y);
				} else {
					domAnchor.style.left = posX + "px";
					domAnchor.style.top = posY + "px";
				}
				self.domAnchorBackdrop.style.display = "none";
				self.document.removeEventListener("mousemove",fnMouseMove,false);
				self.document.removeEventListener("mouseup",fnMouseUp,false);
			};
		domAnchor.addEventListener("mousedown",fnMouseDown,false);
	});
};

/*
Delete the anchors
*/
InnerWikiWidget.prototype.deleteAnchors = function() {
	for(var index=this.domAnchorContainer.childNodes.length-1; index>=0; index--) {
		var node = this.domAnchorContainer.childNodes[index];
		if(node.tagName === "IMG") {
			node.parentNode.removeChild(node);
		}
	}
};

/*
Create the HTML of the innerwiki
*/
InnerWikiWidget.prototype.createInnerHTML = function() {
	// Get the HTML of the iframe
	var html = this.wiki.renderTiddler("text/plain",this.innerWikiTemplate);
	// Insert the overlay tiddlers
	var SPLIT_MARKER = "<!--~~ Boot" + " kernel ~~-->\n",
		IMPLANT_PREFIX = "<" + "script>\n$tw.preloadTiddlerArray(",
		IMPLANT_SUFFIX = ");\n</" + "script>\n",
		parts = html.split(SPLIT_MARKER),
		tiddlers = [];
	this.findChildrenDataWidgets(this.children,"data",function(widget) {
		Array.prototype.push.apply(tiddlers,widget.readDataTiddlerValues());
	});
	if(parts.length === 2) {
		html = parts[0] + IMPLANT_PREFIX + JSON.stringify(tiddlers) + IMPLANT_SUFFIX + SPLIT_MARKER + parts[1];
	}
	return html;
};

/*
Compute the internal state of the widget
*/
InnerWikiWidget.prototype.execute = function() {
	var parseStringAsNumber = function(num,defaultValue) {
		num = parseInt(num + "",10);
		if(!isNaN(num)) {
			return num;
		} else {
			return parseInt(defaultValue + "",10);
		}
	};
	// Get our parameters
	this.innerWikiTemplate = this.getAttribute("template",DEFAULT_INNERWIKI_TEMPLATE);
	this.innerWikiWidth = parseStringAsNumber(this.getAttribute("width"),800);
	this.innerWikiHeight = parseStringAsNumber(this.getAttribute("height"),600);
	this.innerWikiStyle = this.getAttribute("style");
	this.innerWikiClass = this.getAttribute("class");
	this.innerWikiFilename = this.getAttribute("filename");
	this.innerWikiClipLeft = parseStringAsNumber(this.getAttribute("clipLeft"),0);
	this.innerWikiClipTop = parseStringAsNumber(this.getAttribute("clipTop"),0);
	this.innerWikiClipWidth = parseStringAsNumber(this.getAttribute("clipWidth"),this.innerWikiWidth);
	this.innerWikiClipHeight = parseStringAsNumber(this.getAttribute("clipHeight"),this.innerWikiHeight);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
InnerWikiWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.template || changedAttributes.width || changedAttributes.height || changedAttributes.style || changedAttributes.class) {
		this.refreshSelf();
		return true;
	} else {
		var childrenRefreshed = this.refreshChildren(changedTiddlers);
		if(childrenRefreshed) {
			this.deleteAnchors();
			this.createAnchors();
		}
		return childrenRefreshed
	}
};

/*
Use Puppeteer to save a screenshot to a file
*/
InnerWikiWidget.prototype.saveScreenshot = function(options,callback) {
	var self = this,
		basepath = options.basepath || ".",
		deviceScaleFactor = options.deviceScaleFactor || 1;
	// Don't do anything if we don't have a filename
	if(!this.innerWikiFilename) {
		return callback(null);
	}
	var path = require("path"),
		filepath = path.resolve(basepath,this.innerWikiFilename);
	$tw.utils.createFileDirectories(filepath);
	console.log("Taking screenshot",filepath);
	// Fire up Puppeteer
	var puppeteer;
	try {
		puppeteer = require("puppeteer");
	} catch(e) {
		throw "Google Puppeteer not found";
	}
	// Take screenshots
	puppeteer.launch().then(async browser => {
		// NOTE: Copying Google's sample code by using new fangled promises "await"
		const page = await browser.newPage();
		await page.setContent(self.createInnerHTML(),{
			waitUntil: "domcontentloaded"
		});
		await page.setViewport({
			width: Math.trunc(self.innerWikiWidth),
			height: Math.trunc(self.innerWikiHeight),
			deviceScaleFactor: deviceScaleFactor
		});
		// PDF generation isn't great: there's no clipping, and pagination is hard to control
		// await page.emulateMedia("screen");
		// await page.pdf({
		// 	scale: 0.5,
		// 	width: self.innerWikiWidth + "px",
		// 	height: self.innerWikiHeight + "px",
		// 	path: filepath + ".pdf",
		// 	printBackground: true
		// });
		await page.screenshot({
			path: filepath,
			clip: {
				x: self.innerWikiClipLeft,
				y: self.innerWikiClipTop,
				width: self.innerWikiClipWidth,
				height: self.innerWikiClipHeight
			},
			type: "png"
		});
		await browser.close();
		callback(null);
	});
};

exports.innerwiki = InnerWikiWidget;
