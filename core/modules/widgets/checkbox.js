/*\
title: $:/core/modules/widgets/checkbox.js
type: application/javascript
module-type: widget

Implements the checkbox widget.

```
<$checkbox tag="done"/>

<$checkbox tiddler="HelloThere" tag="red"/>

<$checkbox tag="done">
<$view field="title" format="link"/>
</$checkbox>
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CheckboxWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

CheckboxWidget.prototype.generate = function() {
	// Get the parameters from the attributes
	this.tiddlerTitle = this.renderer.getAttribute("tiddler",this.renderer.tiddlerTitle);
	this.tagName = this.renderer.getAttribute("tag");
	this["class"] = this.renderer.getAttribute("class");
	// Compute classes
	var classes = ["tw-checkbox"];
	if(this["class"]) {
		$tw.utils.pushTop(classes,this["class"]);
	}
	// Create the checkbox and span elements
	var nodeCheckbox = {
			type: "element",
			tag: "input",
			attributes: {
				type: {type: "string", value: "checkbox"}
			}
		},
		nodeSpan = {
			type: "element",
			tag: "span",
			children: this.renderer.parseTreeNode.children
		};
	// Set the state of the checkbox
	if(this.getValue()) {
		$tw.utils.addAttributeToParseTreeNode(nodeCheckbox,"checked","true");
	}
	// Set the return element
	this.tag = "label";
	this.attributes ={"class": classes.join(" ")};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,[nodeCheckbox,nodeSpan]);
	this.events = [{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}];
};

CheckboxWidget.prototype.getValue = function() {
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
	return tiddler ? tiddler.hasTag(this.tagName) : false;
};

CheckboxWidget.prototype.handleChangeEvent  = function(event) {
	var checked = this.children[0].domNode.checked,
		tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
	if(tiddler && tiddler.hasTag(this.tagName) !== checked) {
		var newTags = tiddler.fields.tags.slice(0),
			pos = newTags.indexOf(this.tagName);
		if(pos !== -1) {
			newTags.splice(pos,1);
		}
		if(checked) {
			newTags.push(this.tagName);
		}
		this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,{tags: newTags}));
	}
};

CheckboxWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.tiddler || changedAttributes.tag || changedAttributes["class"]) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else {
		// Update the checkbox if necessary
		if(changedTiddlers[this.tiddlerTitle]) {
			this.children[0].domNode.checked = this.getValue();
		}
		// Refresh children
		$tw.utils.each(this.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

exports.checkbox = CheckboxWidget;

})();
