/*\
title: $:/plugins/tiddlywiki/innerwiki/innerwiki.js
type: application/javascript
module-type: widget

Widget to display an innerwiki in an iframe

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DEFAULT_INNERWIKI_TEMPLATE = "$:/plugins/tiddlywiki/innerwiki/template";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	DataWidget = require("$:/plugins/tiddlywiki/innerwiki/data.js").data;

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
	var domWrapper = this.document.createElement("div");
	var classes = (this.innerWikiClass || "").split(" ");
	classes.push("tc-innerwiki-wrapper");
	domWrapper.className = classes.join(" ");
	domWrapper.style = this.innerWikiStyle;
	domWrapper.style.overflow = "hidden";
	domWrapper.style.position = "relative";
	domWrapper.style.boxSizing = "content-box";
	// Set up the SVG container
	var domSVG = this.document.createElementNS("http://www.w3.org/2000/svg","svg");
	domSVG.style = this.innerWikiStyle;
	domSVG.style.position = "absolute";
	domSVG.style.zIndex = "1";
	domSVG.setAttribute("viewBox","0 0 " + this.innerWikiClipWidth + " " + this.innerWikiClipHeight);
	domWrapper.appendChild(domSVG);
	this.setVariable("namespace","http://www.w3.org/2000/svg");
	// If we're on the real DOM, adjust the wrapper and iframe
	if(!this.document.isTiddlyWikiFakeDom) {
		// Create iframe
		var domIFrame = this.document.createElement("iframe");
		domIFrame.className = "tc-innerwiki-iframe";
		domIFrame.style.position = "absolute";
		domIFrame.style.maxWidth = "none";
		domIFrame.style.border = "none";
		domIFrame.width = this.innerWikiWidth;
		domIFrame.height = this.innerWikiHeight;
		domWrapper.appendChild(domIFrame);
	} else {
		// Create image placeholder
		var domImage = this.document.createElement("img");
		domImage.style = this.innerWikiStyle;
		domImage.setAttribute("src",this.innerWikiFilename);
		domWrapper.appendChild(domImage);
	}
	// Insert wrapper into the DOM
	parent.insertBefore(domWrapper,nextSibling);
	this.renderChildren(domSVG,null);
	this.domNodes.push(domWrapper);
	// If we're on the real DOM, finish the initialisation that needs us to be in the DOM
	if(!this.document.isTiddlyWikiFakeDom) {
		// Write the HTML
		domIFrame.contentWindow.document.open();
		domIFrame.contentWindow.document.write(this.createInnerHTML());
		domIFrame.contentWindow.document.close();
	}
	// Scale the iframe and adjust the height of the wrapper
	var clipLeft = this.innerWikiClipLeft,
		clipTop = this.innerWikiClipTop,
		clipWidth = this.innerWikiClipWidth,
		clipHeight = this.innerWikiClipHeight,
		translateX = -clipLeft,
		translateY = -clipTop,
		scale = domWrapper.clientWidth / clipWidth;
	if(!this.document.isTiddlyWikiFakeDom) {
		domIFrame.style.transformOrigin = (-translateX) + "px " + (-translateY) + "px";
		domIFrame.style.transform = "translate(" + translateX + "px," + translateY + "px) scale(" + scale + ")";
		domWrapper.style.height = (clipHeight * scale) + "px";
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
		tiddlers = this.findDataWidgets(this.children);
	if(parts.length === 2) {
		html = parts[0] + IMPLANT_PREFIX + JSON.stringify(tiddlers) + IMPLANT_SUFFIX + SPLIT_MARKER + parts[1];
	}
	return html;
};

/*
Find the child data widgets
*/
InnerWikiWidget.prototype.findDataWidgets = function(children) {
	var self = this,
		results = [];
	$tw.utils.each(children,function(child) {
		if(child instanceof DataWidget) {
			var item = Object.create(null);
			$tw.utils.each(child.attributes,function(value,name) {
				item[name] = value;
			});
			Array.prototype.push.apply(results,self.readDataWidget(child));
		}
		if(child.children) {
			results = results.concat(self.findDataWidgets(child.children));
		}
	});
	return results;
};

/*
Read the value(s) from a data widget
*/
InnerWikiWidget.prototype.readDataWidget = function(dataWidget) {
	// Start with a blank object
	var item = Object.create(null);
	// Read any attributes not prefixed with $
	$tw.utils.each(dataWidget.attributes,function(value,name) {
		if(name.charAt(0) !== "$") {
			item[name] = value;			
		}
	});
	// Deal with $tiddler or $filter attributes
	var titles;
	if(dataWidget.hasAttribute("$tiddler")) {
		titles = [dataWidget.getAttribute("$tiddler")];
	} else if(dataWidget.hasAttribute("$filter")) {
		titles = this.wiki.filterTiddlers(dataWidget.getAttribute("$filter"));
	}
	if(titles) {
		var results = [];
		$tw.utils.each(titles,function(title,index) {
			var tiddler = $tw.wiki.getTiddler(title),
				fields;
			if(tiddler) {
				fields = tiddler.getFieldStrings();
			}
			results.push($tw.utils.extend({},item,fields));
		})
		return results;
	} else {
		return [item];		
	}
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
		return false;		
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

})();
