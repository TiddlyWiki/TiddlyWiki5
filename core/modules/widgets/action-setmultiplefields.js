/*\
title: $:/core/modules/widgets/action-setmultiplefields.js
type: application/javascript
module-type: widget

Action widget to set multiple fields or indexes on a tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetMultipleFieldsWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetMultipleFieldsWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SetMultipleFieldsWidget.prototype.render = function(parent,nextSibling) {
    this.computeAttributes();
    this.execute();
};

/*
Compute the internal state of the widget
*/
SetMultipleFieldsWidget.prototype.execute = function() {
    this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
    this.actionFields = this.getAttribute("$fields");
    this.actionIndexes = this.getAttribute("$indexes");
    this.actionValues = this.getAttribute("$values");
    this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SetMultipleFieldsWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(changedAttributes["$tiddler"] || changedAttributes["$fields"] || changedAttributes["$indexes"] || changedAttributes["$values"] || changedAttributes["$timestamp"]) {
        this.refreshSelf();
        return true;
    }
    return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
SetMultipleFieldsWidget.prototype.invokeAction = function(triggeringWidget,event) {
    var tiddler = this.wiki.getTiddler(this.actionTiddler),
        additions = {},
        values = this.wiki.filterTiddlers(this.actionValues,this),
        names;
    if(this.actionFields) {
        names = this.wiki.filterTiddlers(this.actionFields,this);
        $tw.utils.each(names,function(fieldname,index) {
            additions[fieldname] = values[index] || "";
        });
    } else if(this.actionIndexes) {
        // TODO: Set indexes
    }
    // TODO: Respect this.actionTimestamp
    this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),tiddler,{title: this.actionTiddler},this.wiki.getModificationFields(),additions));
    return true; // Action was invoked
};

exports["action-setmultiplefields"] = SetMultipleFieldsWidget;

})();
    