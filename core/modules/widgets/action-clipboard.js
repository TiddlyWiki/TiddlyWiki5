/*\
title: $:/core/modules/widgets/action-deletetiddler.js
type: application/javascript
module-type: widget

Action widget to delete a tiddler.

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
    this.actionTiddler = this.getAttribute("$tiddler");
    this.actionTiddler = this.getAttribute("$text");
    this.actionTiddler = this.getAttribute("$format");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ClipboardWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(changedAttributes["$tiddler"] || changedAttributes["$text"] || changedAttributes["$format"]) {
        this.refreshSelf();
        return true;
    }
    return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ClipboardWidget.prototype.invokeAction = function(triggeringWidget,event) {

    const data = {
        text: "I love TiddlyWiki",
        title: "Copy Paste Test",
        tags: "HelloThere",
        apple: "Here is a test field"
    };

    e.clipboardData.setData("URL", "data:text/vnd.tiddler," + encodeURIComponent(JSON.stringify(data)));
    e.preventDefault();

    return true; // Action was invoked
};

exports["action-clipboard"] = ClipboardWidget;

})();
    