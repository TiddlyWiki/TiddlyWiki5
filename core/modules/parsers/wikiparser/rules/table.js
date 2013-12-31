/*\
title: $:/core/modules/parsers/wikiparser/rules/table.js
type: application/javascript
module-type: wikirule

Wiki text block rule for tables.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "table";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /^\|(?:[^\n]*)\|(?:[fhck]?)\r?\n/mg;
};

var processRow = function(prevColumns) {
	var cellRegExp = /(?:\|([^\n\|]*)\|)|(\|[fhck]?\r?\n)/mg,
		cellTermRegExp = /((?:\x20*)\|)/mg,
		tree = [],
		col = 0,
		colSpanCount = 1,
		prevCell;
	// Match a single cell
	cellRegExp.lastIndex = this.parser.pos;
	var cellMatch = cellRegExp.exec(this.parser.source);
	while(cellMatch && cellMatch.index === this.parser.pos) {
		if(cellMatch[1] === "~") {
			// Rowspan
			var last = prevColumns[col];
			if(last) {
				last.rowSpanCount++;
				$tw.utils.addAttributeToParseTreeNode(last.element,"rowspan",last.rowSpanCount);
				var vAlign = $tw.utils.getAttributeValueFromParseTreeNode(last.element,"valign","center");
				$tw.utils.addAttributeToParseTreeNode(last.element,"valign",vAlign);
				if(colSpanCount > 1) {
					$tw.utils.addAttributeToParseTreeNode(last.element,"colspan",colSpanCount);
					colSpanCount = 1;
				}
			}
			// Move to just before the `|` terminating the cell
			this.parser.pos = cellRegExp.lastIndex - 1;
		} else if(cellMatch[1] === ">") {
			// Colspan
			colSpanCount++;
			// Move to just before the `|` terminating the cell
			this.parser.pos = cellRegExp.lastIndex - 1;
		} else if(cellMatch[1] === "<" && prevCell) {
			colSpanCount = 1+$tw.utils.getAttributeValueFromParseTreeNode(prevCell, "colspan", 1);
			$tw.utils.addAttributeToParseTreeNode(prevCell,"colspan",colSpanCount);
			colSpanCount = 1;
			// Move to just before the `|` terminating the cell
			this.parser.pos = cellRegExp.lastIndex - 1;
		} else if(cellMatch[2]) {
			// End of row
			if(prevCell && colSpanCount > 1) {
				try {
					colSpanCount+= prevCell.attributes.colspan.value;
				} catch (e) {
					colSpanCount-= 1;
				}
				$tw.utils.addAttributeToParseTreeNode(prevCell,"colspan",colSpanCount);
			}
			this.parser.pos = cellRegExp.lastIndex - 1;
			break;
		} else {
			// For ordinary cells, step beyond the opening `|`
			this.parser.pos++;
			// Look for a space at the start of the cell
			var spaceLeft = false,
				chr = this.parser.source.substr(this.parser.pos,1);
			var vAlign;
			if (chr === "^") {
				vAlign = "top";
			} else if(chr === ",") {
				vAlign = "bottom";
			}
			if(vAlign) {
				this.parser.pos++;
				chr = this.parser.source.substr(this.parser.pos,1);
			}
			while(chr === " ") {
				spaceLeft = true;
				this.parser.pos++;
				chr = this.parser.source.substr(this.parser.pos,1);
			}
			// Check whether this is a heading cell
			var cell;
			if(chr === "!") {
				this.parser.pos++;
				cell = {type: "element", tag: "th", children: []};
			} else {
				cell = {type: "element", tag: "td", children: []};
			}
			tree.push(cell);
			// Record information about this cell
			prevCell = cell;
			prevColumns[col] = {rowSpanCount:1,element:cell};
			// Check for a colspan
			if(colSpanCount > 1) {
				$tw.utils.addAttributeToParseTreeNode(cell,"colspan",colSpanCount);
				colSpanCount = 1;
			}
			// Parse the cell
			cell.children = this.parser.parseInlineRun(cellTermRegExp,{eatTerminator: true});
			// Set the alignment for the cell
			if(vAlign) {
				$tw.utils.addAttributeToParseTreeNode(cell,"valign",vAlign);
			}
			if(this.parser.source.substr(this.parser.pos-2,1) === " ") { // spaceRight
				$tw.utils.addAttributeToParseTreeNode(cell,"align",spaceLeft ? "center" : "left");
			} else if(spaceLeft) {
				$tw.utils.addAttributeToParseTreeNode(cell,"align","right");
			}
			// Move back to the closing `|`
			this.parser.pos--;
		}
		col++;
		cellRegExp.lastIndex = this.parser.pos;
		cellMatch = cellRegExp.exec(this.parser.source);
	}
	return tree;
};

exports.parse = function() {
	var rowContainerTypes = {"c":"caption", "h":"thead", "":"tbody", "f":"tfoot"},
		table = {type: "element", tag: "table", children: []},
		rowRegExp = /^\|([^\n]*)\|([fhck]?)\r?\n/mg,
		rowTermRegExp = /(\|(?:[fhck]?)\r?\n)/mg,
		prevColumns = [],
		currRowType,
		rowContainer,
		rowCount = 0;
	// Match the row
	rowRegExp.lastIndex = this.parser.pos;
	var rowMatch = rowRegExp.exec(this.parser.source);
	while(rowMatch && rowMatch.index === this.parser.pos) {
		var rowType = rowMatch[2];
		// Check if it is a class assignment
		if(rowType === "k") {
			$tw.utils.addClassToParseTreeNode(table,rowMatch[1]);
			this.parser.pos = rowMatch.index + rowMatch[0].length;
		} else {
			// Otherwise, create a new row if this one is of a different type
			if(rowType != currRowType) {
				rowContainer = {type: "element", tag: rowContainerTypes[rowType], children: []};
				table.children.push(rowContainer);
				currRowType = rowType;
			}
			// Is this a caption row?
			if(currRowType === "c") {
				// If so, move past the opening `|` of the row
				this.parser.pos++;
				// Move the caption to the first row if it isn't already
				if(table.children.length !== 1) {
					table.children.pop(); // Take rowContainer out of the children array
					table.children.splice(0,0,rowContainer); // Insert it at the bottom						
				}
				// Set the alignment - TODO: figure out why TW did this
//				rowContainer.attributes.align = rowCount === 0 ? "top" : "bottom";
				// Parse the caption
				rowContainer.children = this.parser.parseInlineRun(rowTermRegExp,{eatTerminator: true});
			} else {
				// Create the row
				var theRow = {type: "element", tag: "tr", children: []};
				$tw.utils.addClassToParseTreeNode(theRow,rowCount%2 ? "oddRow" : "evenRow");
				rowContainer.children.push(theRow);
				// Process the row
				theRow.children = processRow.call(this,prevColumns);
				this.parser.pos = rowMatch.index + rowMatch[0].length;
				// Increment the row count
				rowCount++;
			}
		}
		rowMatch = rowRegExp.exec(this.parser.source);
	}
	return [table];
};

})();
