/*\
title: $:/core/modules/widgets/grid.js
type: application/javascript
module-type: widget

The grid widget.

This example renders a table made up of tiddlers titled `MySheet_A_1`, `MySheet_A_2`, `MySheet_A_3`, ... , `MySheet_B_1`, `MySheet_B_2`, `MySheet_B_3` etc.

```
<$grid prefix="MySheet" rows=20 cols=20/>
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var GridWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate widget elements
	this.generate();
};

GridWidget.prototype.generate = function() {
	// Get our attributes
	this.prefix = this.renderer.getAttribute("prefix","Grid");
	this.rows = parseInt(this.renderer.getAttribute("rows","10"),10);
	this.cols = parseInt(this.renderer.getAttribute("cols","10"),10);
	this["class"] = this.renderer.getAttribute("class");
	// Set up the classes
	var classes = ["tw-grid-frame"];
	if(this["class"]) {
		$tw.utils.pushTop(classes,this["class"]);
	}
	// Create the grid table element
	this.tag = "div";
	this.attributes = {
		"class": classes.join(" ")
	};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.generateTable());
};

GridWidget.prototype.generateTable = function() {
	var rows = [];
	for(var row=0; row<this.rows; row++) {
		var tr = {
			type: "element",
			tag: "tr",
			children: []
		};
		rows.push(tr);
		for(var col=0; col<this.cols; col++) {
			var td = {
					type: "element",
					tag: "td",
					children: [{
						type: "element",
						tag: "$transclude",
						attributes: {
							title: {type: "string", value: this.getTableCellTitle(col,row)}
						}
					}]
				};
			tr.children.push(td);
		}
	}
	return [{
		type: "element",
		tag: "table",
		children: [{
			type: "element",
			tag: "tbody",
			children: rows
		}]
	}];
};

GridWidget.prototype.getTableCellTitle = function(col,row) {
	var c = String.fromCharCode(col % 26 + "A".charCodeAt(0));
	col = Math.floor(col/26);
	while(col>0) {
		c = String.fromCharCode(col % 26 + "A".charCodeAt(0) - 1) + c;
		col = Math.floor(col/26);
	}
	return this.prefix + "_" + c + "_" + (row + 1);
};

GridWidget.prototype.postRenderInDom = function() {
};

GridWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Reexecute the widget if any of our attributes have changed
	if(true) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else {
	}
};

exports.grid = GridWidget;

})();
