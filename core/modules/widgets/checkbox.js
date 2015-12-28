/*\
title: $:/core/modules/widgets/checkbox.js
type: application/javascript
module-type: widget

The Checkbox widget toggles the value of a field between two string values

\*/
(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	var Widget = require("$:/core/modules/widgets/widget.js").widget;

	var CheckboxWidget = function (parseTreeNode, options) {
		this.initialise(parseTreeNode, options);
	};

	/*
	Inherit from the base widget class
	*/
	CheckboxWidget.prototype = new Widget();

	/*
	Render this widget into the DOM
	*/
	CheckboxWidget.prototype.render = function (parent, nextSibling) {
		this.parentDomNode = parent;
		this.computeAttributes();
		this.execute();
		this.labelDomNode = this.document.createElement("label");
		this.labelDomNode.setAttribute("class", this.checkboxClass);
		this.inputDomNode = this.document.createElement("input");
		this.inputDomNode.setAttribute("type", "checkbox");
		if (this.getValue()) {
			this.inputDomNode.setAttribute("checked", "true");
		}
		this.labelDomNode.appendChild(this.inputDomNode);
		this.spanDomNode = this.document.createElement("span");
		this.labelDomNode.appendChild(this.spanDomNode);
		$tw.utils.addEventListeners(this.inputDomNode, [{
			name: "change",
			handlerObject: this,
			handlerMethod: "handleChangeEvent"
		}]);
		parent.insertBefore(this.labelDomNode, nextSibling);
		this.renderChildren(this.spanDomNode, null);
		this.domNodes.push(this.labelDomNode);
	};

	CheckboxWidget.prototype.getValue = function () {
		var tiddler = this.wiki.getTiddler(this.checkboxTitle),
			value;
		if (tiddler && this.checkboxField) {
			value = tiddler.fields[this.checkboxField] || this.checkboxDefault || "";
		} else {
			value = this.checkboxDefault;
		}
		return (value === this.checkboxChecked) ? true :
			(value === this.checkboxUnchecked) ? false :
			false;
	};

	CheckboxWidget.prototype.handleChangeEvent = function (event) {
		var checked = this.inputDomNode.checked,
			tiddler = this.wiki.getTiddler(this.checkboxTitle),
			fallbackFields = {text: ""},
			newFields = {title: this.checkboxTitle},
			hasChanged = false;
		// Set the field if specified
		if (this.checkboxField) {
			var value = checked ? this.checkboxChecked : this.checkboxUnchecked;
			if (!tiddler || tiddler.fields[this.checkboxField] !== value) {
				newFields[this.checkboxField] = value;
				hasChanged = true;
			}
		}
		if (hasChanged) {
			this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(), fallbackFields, tiddler, newFields, this.wiki.getModificationFields()));
		}
	};

	/*
	Compute the internal state of the widget
	*/
	CheckboxWidget.prototype.execute = function () {
		// Get the parameters from the attributes
		this.checkboxTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
		this.checkboxField = this.getAttribute("field");
		this.checkboxChecked = this.getAttribute("checked");
		this.checkboxUnchecked = this.getAttribute("unchecked");
		this.checkboxDefault = this.getAttribute("default");
		this.checkboxClass = this.getAttribute("class", "");
		// Make the child widgets
		this.makeChildWidgets();
	};

	/*
	Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
	*/
	CheckboxWidget.prototype.refresh = function (changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		if (changedAttributes.tiddler || changedAttributes.field || changedAttributes.checked || changedAttributes.unchecked || changedAttributes["default"] || changedAttributes["class"]) {
			this.refreshSelf();
			return true;
		} else {
			var refreshed = false;
			if (changedTiddlers[this.checkboxTitle]) {
				this.inputDomNode.checked = this.getValue();
				refreshed = true;
			}
			return this.refreshChildren(changedTiddlers) || refreshed;
		}
	};

	exports.checkbox = CheckboxWidget;

})();
