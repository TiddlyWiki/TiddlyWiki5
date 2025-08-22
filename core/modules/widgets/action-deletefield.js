/*\
title: $:/core/modules/widgets/action-deletefield.js
type: application/javascript
module-type: widget

Action widget to delete fields of a tiddler.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

class DeleteFieldWidget {
	constructor(parseTreeNode, options) {
		super();
		this.initialise(parseTreeNode, options);
	}
	/*
	Render this widget into the DOM
	*/
	render(parent, nextSibling) {
		this.computeAttributes();
		this.execute();
	}
	/*
	Compute the internal state of the widget
	*/
	execute() {
		this.actionTiddler = this.getAttribute("$tiddler", this.getVariable("currentTiddler"));
		this.actionField = this.getAttribute("$field", null);
		this.actionTimestamp = this.getAttribute("$timestamp", "yes") === "yes";
	}
	/*
	Refresh the widget by ensuring our attributes are up to date
	*/
	refresh(changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		if (changedAttributes["$tiddler"]) {
			this.refreshSelf();
			return true;
		}
		return this.refreshChildren(changedTiddlers);
	}
	/*
	Invoke the action associated with this widget
	*/
	invokeAction(triggeringWidget, event) {
		var self = this, tiddler = this.wiki.getTiddler(self.actionTiddler), removeFields = {}, hasChanged = false;
		if ((this.actionField !== null) && tiddler) {
			removeFields[this.actionField] = undefined;
			if (this.actionField in tiddler.fields) {
				hasChanged = true;
			}
		}
		if (tiddler) {
			$tw.utils.each(this.attributes, function (attribute, name) {
				if (name.charAt(0) !== "$" && name !== "title") {
					removeFields[name] = undefined;
					if (name in tiddler.fields) {
						hasChanged = true;
					}
				}
			});
			if (hasChanged) {
				var creationFields = this.actionTimestamp ? this.wiki.getCreationFields() : {};
				var modificationFields = this.actionTimestamp ? this.wiki.getModificationFields() : {};
				this.wiki.addTiddler(new $tw.Tiddler(creationFields, tiddler, removeFields, modificationFields));
			}
		}
		return true; // Action was invoked
	}
}

exports["action-deletefield"] = DeleteFieldWidget;
