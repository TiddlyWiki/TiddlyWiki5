/*\
title: $:/core/modules/widgets/action-clipboard.js
type: application/javascript
module-type: widget

Action widget to copy things to clipboard.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ClipboardWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ClipboardWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ClipboardWidget.prototype.render = function(parent,nextSibling) {
    this.computeAttributes();
    this.execute();
};

/*
Compute the internal state of the widget
*/
ClipboardWidget.prototype.execute = function() {
    this.actionTiddler = this.getAttribute("$tiddler", null);
    this.copyText = this.getAttribute("$text", null);
    this.tiddlerFormat = this.getAttribute("$format", null);
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ClipboardWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
    return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ClipboardWidget.prototype.invokeAction = function(triggeringWidget,event) {

    if(this.actionTiddler !== null) {
        var tiddler = this.wiki.getTiddler(self.actionTiddler);
        console.log(self.actionTiddler)
    }

    console.log(self.copyText)

    function listener(e) {
        e.clipboardData.setData("URL","data:text/vnd.tiddler," + encodeURIComponent(JSON.stringify(tiddlerData)));
        e.clipboardData.setData("text",JSON.stringify(tiddlerData));
        e.preventDefault();
    }

    document.addEventListener("copy",listener);
    //document.execCommand("copy");
    document.removeEventListener("copy",listener);

    return true; // Action was invoked
};

exports["action-clipboard"] = ClipboardWidget;

})();
    