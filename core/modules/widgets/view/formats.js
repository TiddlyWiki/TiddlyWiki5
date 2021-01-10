/*\
title: $:/core/modules/widgets/view/formats.js
type: application/javascript
module-type: viewwidgetformat

All the core View Widget formats.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.text = function(widget) {
	return widget.getValue({asString: true});
};

exports.htmlwikified = function(widget,mode,template) {
	return widget.wiki.renderText("text/html","text/vnd.tiddlywiki",exports.text(widget),{
		parseAsInline: mode !== "block",
		parentWidget: widget
	});
};

exports.plainwikified = function(widget,mode,template) {
	return widget.wiki.renderText("text/plain","text/vnd.tiddlywiki",exports.text(widget),{
		parseAsInline: mode !== "block",
		parentWidget: widget
	});
};

exports.htmlencodedplainwikified = function(widget,mode,template) {
	return $tw.utils.htmlEncode(widget.wiki.renderText("text/plain","text/vnd.tiddlywiki",exports.text(widget),{
		parseAsInline: mode !== "block",
		parentWidget: widget
	}));
};

exports.htmlencoded = function(widget) {
	return $tw.utils.htmlEncode(exports.text(widget));
};

exports.urlencoded = function(widget) {
	return encodeURIComponent(exports.text(widget));
};

exports.doubleurlencoded = function(widget) {
	return encodeURIComponent(encodeURIComponent(exports.text(widget)));
};

exports.date = function(widget,mode,format) {
	format = format || "YYYY MM DD 0hh:0mm";
	var value = $tw.utils.parseDate(widget.getValue());
	if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
		return $tw.utils.formatDateString(value,format);
	} else {
		return "";
	}
};

exports.relativedate = function(widget) {
	var value = $tw.utils.parseDate(widget.getValue());
	if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
		return $tw.utils.getRelativeDate((new Date()) - (new Date(value))).description;
	} else {
		return "";
	}
};

exports.stripcomments = function(widget) {
	var lines = exports.text(widget).split("\n"),
		out = [];
	for(var line=0; line<lines.length; line++) {
		var text = lines[line];
		if(!/^\s*\/\/#/.test(text)) {
			out.push(text);
		}
	}
	return out.join("\n");
};

exports.jsencoded = function(widget) {
	return $tw.utils.stringify(exports.text(widget));
};

})();
