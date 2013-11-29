/*\
title: $:/core/modules/widgets/checkbox.js
type: application/javascript
module-type: widget

Checkbox widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var CheckboxWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
CheckboxWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CheckboxWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our elements
	this.labelDomNode = this.document.createElement("label");
	this.inputDomNode = this.document.createElement("input");
	if (this.checkboxRadio == "") {
		this.inputDomNode.setAttribute("type","checkbox");
	}
	else  {
		this.inputDomNode.setAttribute("type","radio");
		this.inputDomNode.setAttribute("name",this.checkboxRadio);
	}
	if(this.getValue()) {
		this.inputDomNode.setAttribute("checked","true");
	}
	this.labelDomNode.appendChild(this.inputDomNode);
	this.spanDomNode = this.document.createElement("span");
	this.labelDomNode.appendChild(this.spanDomNode);
	// Add a click event handler
	$tw.utils.addEventListeners(this.inputDomNode,[
		{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}
	]);
	// Insert the label into the DOM and render any children
	parent.insertBefore(this.labelDomNode,nextSibling);
	this.renderChildren(this.spanDomNode,null);
	this.domNodes.push(this.labelDomNode);
};

CheckboxWidget.prototype.getValue = function() {
	var tiddler = this.wiki.getTiddler(this.checkboxTitle);
	return tiddler ? tiddler.hasTag(this.checkboxTag) : false;
};

CheckboxWidget.prototype.handleChangeEvent = function(event) {
	var checked = this.inputDomNode.checked,
		tiddler = this.wiki.getTiddler(this.checkboxTitle);
	if(tiddler && tiddler.hasTag(this.checkboxTag) !== checked) {
		var newTags = (tiddler.fields.tags || []).slice(0),
			pos = newTags.indexOf(this.checkboxTag);
		if(pos !== -1) {
			newTags.splice(pos,1);
		}
		if(checked) {
			newTags.push(this.checkboxTag);
		}
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,{tags: newTags},this.wiki.getModificationFields()));
		// If it was a radio button, and it was checked,
		// it was the one clicked upon
		// Now we need to remove the unchecked tags
		if (checked && this.checkboxRadio) {
			// get all the other radiobuttons
			var radios= document.getElementsByName(this.checkboxRadio);
			// We will fire change events to all unchecked radios buttons
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent("change", true, true ); // event type,bubbling,cancelable
			for (var i=radios.length; i--;) {
				// just unchecked ones are interesting
				if (! radios[i].checked) {
					 radios[i].dispatchEvent(evt);
				}
			}
		}
	}
};

/*
Compute the internal state of the widget
*/
CheckboxWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.checkboxTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.checkboxTag = this.getAttribute("tag");
	// Is it supposed to be a radio button?
	this.checkboxRadio = this.getAttribute("radio") ? this.checkboxTitle + "::" + this.getAttribute("radio") : "";
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CheckboxWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.tag || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.checkboxTitle]) {
			this.inputDomNode.checked = this.getValue();
			refreshed = true;
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.checkbox = CheckboxWidget;

})();
