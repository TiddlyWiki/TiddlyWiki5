/*\
title: $:/core/modules/widgets/set.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

SetWidget.prototype = new Widget();

SetWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

SetWidget.prototype.execute = function() {
	// Get our parameters
	this.setName = this.getAttribute("name","currentTiddler");
	this.setFilter = this.getAttribute("filter");
	this.setSelect = this.getAttribute("select");
	this.setTiddler = this.getAttribute("tiddler");
	this.setSubTiddler = this.getAttribute("subtiddler");
	this.setField = this.getAttribute("field");
	this.setIndex = this.getAttribute("index");
	this.setValue = this.getAttribute("value");
	this.setEmptyValue = this.getAttribute("emptyValue");
	// Set context variable
	if(this.parseTreeNode.isMacroDefinition) {
		this.setVariable(this.setName,this.getValue(),this.parseTreeNode.params,true);
	} else if(this.parseTreeNode.isFunctionDefinition) {
		this.setVariable(this.setName,this.getValue(),this.parseTreeNode.params,undefined,{isFunctionDefinition: true});
	} else if(this.parseTreeNode.isProcedureDefinition) {
		this.setVariable(this.setName,this.getValue(),this.parseTreeNode.params,undefined,{isProcedureDefinition: true, configTrimWhiteSpace: this.parseTreeNode.configTrimWhiteSpace});
	} else if(this.parseTreeNode.isWidgetDefinition) {
		this.setVariable(this.setName,this.getValue(),this.parseTreeNode.params,undefined,{isWidgetDefinition: true, configTrimWhiteSpace: this.parseTreeNode.configTrimWhiteSpace});
	} else {
		this.setVariable(this.setName,this.getValue());
	}

	this.makeChildWidgets();
};

SetWidget.prototype.getValue = function() {
	var value = this.setValue;
	if(this.setTiddler) {
		var tiddler;
		if(this.setSubTiddler) {
			tiddler = this.wiki.getSubTiddler(this.setTiddler,this.setSubTiddler);
		} else {
			tiddler = this.wiki.getTiddler(this.setTiddler);
		}
		if(!tiddler) {
			value = this.setEmptyValue;
		} else if(this.setField) {
			value = tiddler.getFieldString(this.setField) || this.setEmptyValue;
		} else if(this.setIndex) {
			value = this.wiki.extractTiddlerDataItem(this.setTiddler,this.setIndex,this.setEmptyValue);
		} else {
			value = tiddler.fields.text || this.setEmptyValue ;
		}
	} else if(this.setFilter) {
		var results = this.wiki.filterTiddlers(this.setFilter,this);
		if(this.setValue == null) {
			var select;
			if(this.setSelect) {
				select = parseInt(this.setSelect,10);
			}
			if(select !== undefined) {
				value = results[select] || "";
			} else {
				value = $tw.utils.stringifyList(results);
			}
		}
		if(results.length === 0 && this.setEmptyValue !== undefined) {
			value = this.setEmptyValue;
		}
	} else if(!value && this.setEmptyValue) {
		value = this.setEmptyValue;
	}
	return value || "";
};

SetWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name || changedAttributes.filter || changedAttributes.select || changedAttributes.tiddler || (this.setTiddler && changedTiddlers[this.setTiddler]) || changedAttributes.field || changedAttributes.index || changedAttributes.value || changedAttributes.emptyValue ||
	   (this.setFilter && this.getValue() != this.variables[this.setName].value)) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.setvariable = SetWidget;
exports.set = SetWidget;
