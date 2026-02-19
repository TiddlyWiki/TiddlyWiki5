/*\
title: $:/core/modules/widgets/setmultiplevariables.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetMultipleVariablesWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
};

SetMultipleVariablesWidget.prototype = new Widget();

SetMultipleVariablesWidget.prototype.render = function(parent,nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    this.renderChildren(parent,nextSibling);
};

SetMultipleVariablesWidget.prototype.execute = function() {
    // Setup our variables
    this.setVariables();
    // Construct the child widgets
    this.makeChildWidgets();
};

SetMultipleVariablesWidget.prototype.setVariables = function() {
    // Set the variables
    var self = this,
        filterNames = this.getAttribute("$names",""),
        filterValues = this.getAttribute("$values","");
    this.variableNames = [];
    this.variableValues = [];
    if(filterNames && filterValues) {
        this.variableNames = this.wiki.filterTiddlers(filterNames,this);
        this.variableValues = this.wiki.filterTiddlers(filterValues,this);
        $tw.utils.each(this.variableNames,function(varname,index) {
            self.setVariable(varname,self.variableValues[index]);
        });
    }
};

SetMultipleVariablesWidget.prototype.refresh = function(changedTiddlers) {
    var filterNames = this.getAttribute("$names",""),
        filterValues = this.getAttribute("$values",""),
        variableNames = this.wiki.filterTiddlers(filterNames,this),
        variableValues = this.wiki.filterTiddlers(filterValues,this);
    if(!$tw.utils.isArrayEqual(this.variableNames,variableNames) || !$tw.utils.isArrayEqual(this.variableValues,variableValues)) {
        this.refreshSelf();
        return true;
    }
    return this.refreshChildren(changedTiddlers);
};

exports["setmultiplevariables"] = SetMultipleVariablesWidget;
