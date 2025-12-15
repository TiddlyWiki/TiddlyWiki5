/*\
title: $:/core/modules/widgets/button.js
type: application/javascript
module-type: widget

Button widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var Popup = require("$:/core/modules/utils/dom/popup.js");

var ButtonWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ButtonWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ButtonWidget.prototype.render = function(parent,nextSibling) {
	var self = this,
		tag = "button",
		domNode;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	if(this.buttonTag && $tw.config.htmlUnsafeElements.indexOf(this.buttonTag) === -1) {
		tag = this.buttonTag;
	}
	domNode = this.document.createElement(tag);
	this.domNode = domNode;
	// Assign classes
	var classes = this["class"].split(" ") || [],
		isPoppedUp = (this.popup || this.popupTitle) && this.isPoppedUp();
	if(this.selectedClass) {
		if((this.set || this.setTitle) && this.setTo && this.isSelected()) {
			$tw.utils.pushTop(classes, this.selectedClass.split(" "));
			domNode.setAttribute("aria-checked", "true");
		}
		if(isPoppedUp) {
			$tw.utils.pushTop(classes,this.selectedClass.split(" "));
		}
	}
	if(isPoppedUp) {
		$tw.utils.pushTop(classes,"tc-popup-handle");
	}
	domNode.className = classes.join(" ");
	// Assign data- attributes
	this.assignAttributes(domNode,{
		sourcePrefix: "data-",
		destPrefix: "data-"
	});
	this.assignAttributes(domNode,{
		sourcePrefix: "aria-",
		destPrefix: "aria-"
	});
	// Assign other attributes
	if(this.style) {
		domNode.setAttribute("style",this.style);
	}
	if(this.tooltip) {
		domNode.setAttribute("title",this.tooltip);
	}
	if (this.role) {
		domNode.setAttribute("role", this.role);
	}
	if(this.popup || this.popupTitle) {
		domNode.setAttribute("aria-expanded",isPoppedUp ? "true" : "false");
	}
	// Set the tabindex
	if(this.tabIndex) {
		domNode.setAttribute("tabindex",this.tabIndex);
	}
	if(this.isDisabled === "yes") {
		domNode.setAttribute("disabled",true);
	}
	// Add a click event handler
	domNode.addEventListener("click",function (event) {
		var handled = false;
		if(self.invokeActions(self,event)) {
			handled = true;
		}
		if(self.to) {
			self.navigateTo(event);
			handled = true;
		}
		if(self.message) {
			self.dispatchMessage(event);
			handled = true;
		}
		if(self.popup || self.popupTitle) {
			self.triggerPopup(event);
			handled = true;
		}
		if(self.set || self.setTitle) {
			self.setTiddler();
			handled = true;
		}
		if(self.actions) {
			var modifierKey = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
			self.invokeActionString(self.actions,self,event,{modifier: modifierKey});
		}
		if(handled) {
			event.preventDefault();
			event.stopPropagation();
		}
		return handled;
	},false);
	// Make it draggable if required
	if(this.dragTiddler || this.dragFilter) {
		$tw.utils.makeDraggable({
			domNode: domNode,
			dragTiddlerFn: function() {return self.dragTiddler;},
			dragFilterFn: function() {return self.dragFilter;},
			widget: this
		});
	}
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
We don't allow actions to propagate because we trigger actions ourselves
*/
ButtonWidget.prototype.allowActionPropagation = function() {
	return false;
};

ButtonWidget.prototype.getBoundingClientRect = function() {
	return this.domNodes[0].getBoundingClientRect();
};

ButtonWidget.prototype.isSelected = function() {
    return this.setTitle ? (this.setField ? this.wiki.getTiddler(this.setTitle).getFieldString(this.setField) === this.setTo :
		(this.setIndex ? this.wiki.extractTiddlerDataItem(this.setTitle,this.setIndex) === this.setTo :
			this.wiki.getTiddlerText(this.setTitle))) || this.defaultSetValue || this.getVariable("currentTiddler") :
		this.wiki.getTextReference(this.set,this.defaultSetValue,this.getVariable("currentTiddler")) === this.setTo;
};

ButtonWidget.prototype.isPoppedUp = function() {
	var tiddler = this.popupTitle ? this.wiki.getTiddler(this.popupTitle) : this.wiki.getTiddler(this.popup);
	var result = tiddler && tiddler.fields.text ? Popup.readPopupState(tiddler.fields.text) : false;
	return result;
};

ButtonWidget.prototype.navigateTo = function(event) {
	var bounds = this.getBoundingClientRect();
	this.dispatchEvent({
		type: "tm-navigate",
		navigateTo: this.to,
		navigateFromTitle: this.getVariable("storyTiddler"),
		navigateFromNode: this,
		navigateFromClientRect: { top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
		},
		navigateSuppressNavigation: event.metaKey || event.ctrlKey || (event.button === 1),
		event: event
	});
};

ButtonWidget.prototype.dispatchMessage = function(event) {
	this.dispatchEvent({type: this.message, param: this.param, tiddlerTitle: this.getVariable("currentTiddler"), event: event});
};

ButtonWidget.prototype.triggerPopup = function(event) {
	if(this.popupTitle) {
		$tw.popup.triggerPopup({
			domNode: this.domNodes[0],
			absolute: (this.popupAbsCoords === "yes"),
			title: this.popupTitle,
			wiki: this.wiki,
			noStateReference: true
		});
	} else {
		$tw.popup.triggerPopup({
			domNode: this.domNodes[0],
			absolute: (this.popupAbsCoords === "yes"),
			title: this.popup,
			wiki: this.wiki
		});
	}
};

ButtonWidget.prototype.setTiddler = function() {
	if(this.setTitle) {
		this.setField ? this.wiki.setText(this.setTitle,this.setField,undefined,this.setTo) :
				(this.setIndex ? this.wiki.setText(this.setTitle,undefined,this.setIndex,this.setTo) :
				this.wiki.setText(this.setTitle,"text",undefined,this.setTo));
	} else {
		this.wiki.setTextReference(this.set,this.setTo,this.getVariable("currentTiddler"));
	}
};

/*
Collect the attributes we need, in the process determining whether we're being used in legacy mode
*/
ButtonWidget.prototype.collectAttributes = function() {
	// Detect legacy mode: true if no attributes start with $
	this.legacyMode = this.isLegacyMode();
	// Get attributes for the appropriate mode
	var prefix = this.legacyMode ? "" : "$";
	this.actions = this.getAttribute(prefix + "actions");
	this.to = this.getAttribute(prefix + "to");
	this.message = this.getAttribute(prefix + "message");
	this.param = this.getAttribute(prefix + "param");
	this.set = this.getAttribute(prefix + "set");
	this.setTo = this.getAttribute(prefix + "setTo");
	this.popup = this.getAttribute(prefix + "popup");
	this.hover = this.getAttribute(prefix + "hover");
	this.role = this.getAttribute(prefix + "role");
	this.tooltip = this.getAttribute(prefix + "tooltip");
	this.style = this.getAttribute(prefix + "style");
	this["class"] = this.getAttribute(prefix + "class","");
	this.selectedClass = this.getAttribute(prefix + "selectedClass");
	this.defaultSetValue = this.getAttribute(prefix + "default","");
	this.buttonTag = this.getAttribute(prefix + "tag");
	this.dragTiddler = this.getAttribute(prefix + "dragTiddler");
	this.dragFilter = this.getAttribute(prefix + "dragFilter");
	this.setTitle = this.getAttribute(prefix + "setTitle");
	this.setField = this.getAttribute(prefix + "setField");
	this.setIndex = this.getAttribute(prefix + "setIndex");
	this.popupTitle = this.getAttribute(prefix + "popupTitle");
	this.popupAbsCoords = this.getAttribute(prefix + "popupAbsCoords", "no");
	this.tabIndex = this.getAttribute(prefix + "tabindex");
	this.isDisabled = this.getAttribute(prefix + "disabled","no");
};

/*
Compute the internal state of the widget
*/
ButtonWidget.prototype.execute = function() {
	// Get attributes
	this.collectAttributes();
	// Make child widgets
	this.makeChildWidgets();
};

ButtonWidget.prototype.updateDomNodeClasses = function() {
	var domNodeClasses = this.domNode.className.split(" "),
		oldClasses = this.class.split(" "),
		newClasses;
	var classAttr = this.legacyMode ? "class" : "$class";
	this["class"] = this.getAttribute(classAttr,"");
	newClasses = this.class.split(" ");
	//Remove classes assigned from the old value of class attribute
	$tw.utils.each(oldClasses,function(oldClass){
		var i = domNodeClasses.indexOf(oldClass);
		if(i !== -1) {
			domNodeClasses.splice(i,1);
		}
	});
	//Add new classes from updated class attribute.
	$tw.utils.pushTop(domNodeClasses,newClasses);
	this.domNode.className = domNodeClasses.join(" ");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ButtonWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(this.hasChangedAttributes([
		"tooltip","actions","to","message","param","set","setTo","popup","hover",
		"selectedClass","style","dragFilter","dragTiddler","popupAbsCoords",
		"setTitle","setField","setIndex","popupTitle","disabled","default"
	],changedAttributes) || 
	   (this.set && changedTiddlers[this.set]) || 
	   (this.popup && changedTiddlers[this.popup]) || 
	   (this.popupTitle && changedTiddlers[this.popupTitle])) {
		this.refreshSelf();
		return true;
	} else {
		if(this.hasChangedAttributes(["class"],changedAttributes)) {
			this.updateDomNodeClasses();
		}
		this.assignAttributes(this.domNodes[0],{
			changedAttributes: changedAttributes,
			sourcePrefix: "data-",
			destPrefix: "data-"
		});
		this.assignAttributes(this.domNodes[0],{
			sourcePrefix: "aria-",
			destPrefix: "aria-"
		});
	}
	return this.refreshChildren(changedTiddlers);
};

exports.button = ButtonWidget;
