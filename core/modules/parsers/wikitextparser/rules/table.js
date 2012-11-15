/*\
title: $:/core/modules/parsers/wikitextparser/rules/table.js
type: application/javascript
module-type: wikitextrule

Wiki text block rule for tables.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "table";

exports.blockParser = true;

exports.regExpString = "^\\|(?:[^\\n]*)\\|(?:[fhck]?)\\r?\\n";

var processRow = function(prevColumns) {
	var cellRegExp = /(?:\|([^\n\|]*)\|)|(\|[fhck]?\r?\n)/mg,
		cellTermRegExp = /((?:\x20*)\|)/mg,
		tree = [],
		col = 0,
		colSpanCount = 1,
		prevCell;
	// Match a single cell
	cellRegExp.lastIndex = this.pos;
	var cellMatch = cellRegExp.exec(this.source);
	while(cellMatch && cellMatch.index === this.pos) {
		if(cellMatch[1] === "~") {
			// Rowspan
			var last = prevColumns[col];
			if(last) {
				last.rowSpanCount++;
				last.element.attributes.rowspan = last.rowSpanCount;
				last.element.attributes.valign = "center";
				if(colSpanCount > 1) {
					last.element.attributes.colspan = colSpanCount;
					colSpanCount = 1;
				}
			}
			// Move to just before the `|` terminating the cell
			this.pos = cellRegExp.lastIndex - 1;
		} else if(cellMatch[1] === ">") {
			// Colspan
			colSpanCount++;
			// Move to just before the `|` terminating the cell
			this.pos = cellRegExp.lastIndex - 1;
		} else if(cellMatch[2]) {
			// End of row
			if(prevCell && colSpanCount > 1) {
				prevCell.attributes.colspan = colSpanCount;
			}
			this.pos = cellRegExp.lastIndex - 1;
			break;
		} else {
			// For ordinary cells, step beyond the opening `|`
			this.pos++;
			// Look for a space at the start of the cell
			var spaceLeft = false,
				chr = this.source.substr(this.pos,1);
			while(chr === " ") {
				spaceLeft = true;
				this.pos++;
				chr = this.source.substr(this.pos,1);
			}
			// Check whether this is a heading cell
			var cell;
			if(chr === "!") {
				this.pos++;
				cell = $tw.Tree.Element("th",{},[]);
			} else {
				cell = $tw.Tree.Element("td",{},[]);
			}
			tree.push(cell);
			// Record information about this cell
			prevCell = cell;
			prevColumns[col] = {rowSpanCount:1,element:cell};
			// Check for a colspan
			if(colSpanCount > 1) {
				cell.attributes.colspan = colSpanCount;
				colSpanCount = 1;
			}
			// Parse the cell
			cell.children = this.parseRun(cellTermRegExp);
			// Set the alignment for the cell
			if(cellMatch[1].substr(cellMatch[1].length-2,1) === " ") { // spaceRight
				cell.attributes.align = spaceLeft ? "center" : "left";
			} else if(spaceLeft) {
				cell.attributes.align = "right";
			}
			// Move back to the closing `|`
			this.pos--;
		}
		col++;
		cellRegExp.lastIndex = this.pos;
		cellMatch = cellRegExp.exec(this.source);
	}
	return tree;
};

exports.parse = function(match,isBlock) {
	var rowContainerTypes = {"c":"caption", "h":"thead", "":"tbody", "f":"tfoot"},
		table = $tw.Tree.Element("table",{"class": ["table"]},[]),
		rowRegExp = /^\|([^\n]*)\|([fhck]?)\r?\n/mg,
		rowTermRegExp = /(\|(?:[fhck]?)\r?\n)/mg,
		prevColumns = [],
		currRowType,
		rowContainer,
		rowCount = 0;
	// Match the row
	rowRegExp.lastIndex = this.pos;
	var rowMatch = rowRegExp.exec(this.source);
	while(rowMatch && rowMatch.index === this.pos) {
		var rowType = rowMatch[2];
		// Check if it is a class assignment
		if(rowType === "k") {
			table.attributes["class"].push(rowMatch[1]);
			this.pos = rowMatch.index + rowMatch[0].length;
		} else {
			// Otherwise, create a new row if this one is of a different type
			if(rowType != currRowType) {
				rowContainer = $tw.Tree.Element(rowContainerTypes[rowType],{},[]);
				table.children.push(rowContainer);
				currRowType = rowType;
			}
			// Is this a caption row?
			if(currRowType === "c") {
				// If so, move past the opening `|` of the row
				this.pos++;
				// Move the caption to the first row if it isn't already
				if(table.children.length !== 1) {
					table.children.pop(); // Take rowContainer out of the children array
					table.children.splice(0,0,rowContainer); // Insert it at the bottom						
				}
				// Set the alignment - TODO: figure out why TW did this
				rowContainer.attributes.align = rowCount === 0 ? "top" : "bottom";
				// Parse the caption
				rowContainer.children = this.parseRun(rowTermRegExp);
			} else {
				// Create the row
				var theRow = $tw.Tree.Element("tr",{},[]);
				theRow.attributes["class"] = rowCount%2 ? "oddRow" : "evenRow";
				rowContainer.children.push(theRow);
				// Process the row
				theRow.children = processRow.call(this,prevColumns);
				this.pos = rowMatch.index + rowMatch[0].length;
				// Increment the row count
				rowCount++;
			}
		}
		rowRegExp.lastIndex = this.pos;
		rowMatch = rowRegExp.exec(this.source);
	}
	return [table];
};

})();
