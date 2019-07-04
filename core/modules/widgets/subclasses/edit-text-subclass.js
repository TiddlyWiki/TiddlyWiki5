/*\
title: $:/plugins/btc/selectable-inputs/modules/this-subclasses/edit-text-subclass.js
type: application/javascript
module-type: widget-subclass

A subclass that intercepts the refresh method of edit-text widgets for enhanced refreshing

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.baseClass = "edit-text";

exports.constructor = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

exports.prototype = {};

// Configuration tiddlers
var HEIGHT_MODE_TITLE = "$:/config/TextEditor/EditorHeight/Mode";
var ENABLE_TOOLBAR_TITLE = "$:/config/TextEditor/EnableToolbar";

exports.prototype.execute = function(event) {
	// Call the base class execute function
	Object.getPrototypeOf(Object.getPrototypeOf(this)).execute.call(this,event);
	this.refreshTiddler = this.getAttribute("refreshTiddler");
	this.refreshAction = this.getAttribute("refreshAction");
	this.saveTiddler = this.getAttribute("saveTiddler");
};

exports.prototype.refresh = function(event) {
	var changedAttributes = this.computeAttributes();

	if(changedAttributes.refreshTiddler || changedAttributes.refreshAction || changedAttributes.saveTiddler) {
		this.refreshSelf();
		return true;
	} else if(!changedAttributes.tiddler && !changedAttributes.field && !changedAttributes.index && !changedAttributes["default"] && !changedAttributes["class"] && !changedAttributes.placeholder && !changedAttributes.size && !changedAttributes.autoHeight && !changedAttributes.minHeight && !changedAttributes.focusPopup && !changedAttributes.rows && !changedAttributes.tabindex && !event[HEIGHT_MODE_TITLE] && !event[ENABLE_TOOLBAR_TITLE]) {

		var refreshCondition = this.getAttribute("refreshCondition");
		if(this.refreshTiddler && event[this.refreshTiddler] && (refreshCondition === "true" || refreshCondition === "yes")) {
			var refreshAction = this.refreshAction;
			if(refreshAction) {
				switch(refreshAction) {
					case "focus-update":
						this.engine.domNode.value = this.getEditInfo().value;
						this.engine.focus();
						break;
					case "focus":
						this.engine.focus();
						break;
					default:
				}
			}
			this.wiki.deleteTiddler(this.refreshTiddler);
		} else if(event[this.editTitle] && (event[this.editTitle].deleted !== true)) {
			if(!event[this.refreshTiddler] && refreshCondition !== "true" && refreshCondition !== "yes") {
				//update the saveTiddler with the new text
				var saveTiddler = this.wiki.getTiddler(this.saveTiddler),
					updateFields = {
						title: this.saveTiddler
					};
				updateFields[this.editField] = this.getEditInfo().value;
				this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),saveTiddler,updateFields,this.wiki.getModificationFields()));
			}
		}
	}

	// Call the base class refresh function
	Object.getPrototypeOf(Object.getPrototypeOf(this)).refresh.call(this,event);

	};

})();
