let prosemirror_state = require("prosemirror-state");
let prosemirror_model = require("prosemirror-model");
let prosemirror_view = require("prosemirror-view");
let prosemirror_keymap = require("prosemirror-keymap");
let prosemirror_transform = require("prosemirror-transform");

//#region src/tablemap.ts
let readFromCache;
let addToCache;
if (typeof WeakMap != "undefined") {
	let cache = /* @__PURE__ */ new WeakMap();
	readFromCache = (key) => cache.get(key);
	addToCache = (key, value) => {
		cache.set(key, value);
		return value;
	};
} else {
	const cache = [];
	const cacheSize = 10;
	let cachePos = 0;
	readFromCache = (key) => {
		for (let i = 0; i < cache.length; i += 2) if (cache[i] == key) return cache[i + 1];
	};
	addToCache = (key, value) => {
		if (cachePos == cacheSize) cachePos = 0;
		cache[cachePos++] = key;
		return cache[cachePos++] = value;
	};
}
/**
* A table map describes the structure of a given table. To avoid
* recomputing them all the time, they are cached per table node. To
* be able to do that, positions saved in the map are relative to the
* start of the table, rather than the start of the document.
*
* @public
*/
var TableMap = class {
	constructor(width, height, map, problems) {
		this.width = width;
		this.height = height;
		this.map = map;
		this.problems = problems;
	}
	findCell(pos) {
		for (let i = 0; i < this.map.length; i++) {
			const curPos = this.map[i];
			if (curPos != pos) continue;
			const left = i % this.width;
			const top = i / this.width | 0;
			let right = left + 1;
			let bottom = top + 1;
			for (let j = 1; right < this.width && this.map[i + j] == curPos; j++) right++;
			for (let j = 1; bottom < this.height && this.map[i + this.width * j] == curPos; j++) bottom++;
			return {
				left,
				top,
				right,
				bottom
			};
		}
		throw new RangeError(`No cell with offset ${pos} found`);
	}
	colCount(pos) {
		for (let i = 0; i < this.map.length; i++) if (this.map[i] == pos) return i % this.width;
		throw new RangeError(`No cell with offset ${pos} found`);
	}
	nextCell(pos, axis, dir) {
		const { left, right, top, bottom } = this.findCell(pos);
		if (axis == "horiz") {
			if (dir < 0 ? left == 0 : right == this.width) return null;
			return this.map[top * this.width + (dir < 0 ? left - 1 : right)];
		} else {
			if (dir < 0 ? top == 0 : bottom == this.height) return null;
			return this.map[left + this.width * (dir < 0 ? top - 1 : bottom)];
		}
	}
	rectBetween(a, b) {
		const { left: leftA, right: rightA, top: topA, bottom: bottomA } = this.findCell(a);
		const { left: leftB, right: rightB, top: topB, bottom: bottomB } = this.findCell(b);
		return {
			left: Math.min(leftA, leftB),
			top: Math.min(topA, topB),
			right: Math.max(rightA, rightB),
			bottom: Math.max(bottomA, bottomB)
		};
	}
	cellsInRect(rect) {
		const result = [];
		const seen = {};
		for (let row = rect.top; row < rect.bottom; row++) for (let col = rect.left; col < rect.right; col++) {
			const index = row * this.width + col;
			const pos = this.map[index];
			if (seen[pos]) continue;
			seen[pos] = true;
			if (col == rect.left && col && this.map[index - 1] == pos || row == rect.top && row && this.map[index - this.width] == pos) continue;
			result.push(pos);
		}
		return result;
	}
	positionAt(row, col, table) {
		for (let i = 0, rowStart = 0;; i++) {
			const rowEnd = rowStart + table.child(i).nodeSize;
			if (i == row) {
				let index = col + row * this.width;
				const rowEndIndex = (row + 1) * this.width;
				while (index < rowEndIndex && this.map[index] < rowStart) index++;
				return index == rowEndIndex ? rowEnd - 1 : this.map[index];
			}
			rowStart = rowEnd;
		}
	}
	static get(table) {
		return readFromCache(table) || addToCache(table, computeMap(table));
	}
};
function computeMap(table) {
	if (table.type.spec.tableRole != "table") throw new RangeError("Not a table node: " + table.type.name);
	const width = findWidth(table), height = table.childCount;
	const map = [];
	let mapPos = 0;
	let problems = null;
	const colWidths = [];
	for (let i = 0, e = width * height; i < e; i++) map[i] = 0;
	for (let row = 0, pos = 0; row < height; row++) {
		const rowNode = table.child(row);
		pos++;
		for (let i = 0;; i++) {
			while (mapPos < map.length && map[mapPos] != 0) mapPos++;
			if (i == rowNode.childCount) break;
			const cellNode = rowNode.child(i);
			const { colspan, rowspan, colwidth } = cellNode.attrs;
			for (let h = 0; h < rowspan; h++) {
				if (h + row >= height) {
					(problems || (problems = [])).push({
						type: "overlong_rowspan",
						pos,
						n: rowspan - h
					});
					break;
				}
				const start = mapPos + h * width;
				for (let w = 0; w < colspan; w++) {
					if (map[start + w] == 0) map[start + w] = pos;
					else (problems || (problems = [])).push({
						type: "collision",
						row,
						pos,
						n: colspan - w
					});
					const colW = colwidth && colwidth[w];
					if (colW) {
						const widthIndex = (start + w) % width * 2, prev = colWidths[widthIndex];
						if (prev == null || prev != colW && colWidths[widthIndex + 1] == 1) {
							colWidths[widthIndex] = colW;
							colWidths[widthIndex + 1] = 1;
						} else if (prev == colW) colWidths[widthIndex + 1]++;
					}
				}
			}
			mapPos += colspan;
			pos += cellNode.nodeSize;
		}
		const expectedPos = (row + 1) * width;
		let missing = 0;
		while (mapPos < expectedPos) if (map[mapPos++] == 0) missing++;
		if (missing) (problems || (problems = [])).push({
			type: "missing",
			row,
			n: missing
		});
		pos++;
	}
	if (width === 0 || height === 0) (problems || (problems = [])).push({ type: "zero_sized" });
	const tableMap = new TableMap(width, height, map, problems);
	let badWidths = false;
	for (let i = 0; !badWidths && i < colWidths.length; i += 2) if (colWidths[i] != null && colWidths[i + 1] < height) badWidths = true;
	if (badWidths) findBadColWidths(tableMap, colWidths, table);
	return tableMap;
}
function findWidth(table) {
	let width = -1;
	let hasRowSpan = false;
	for (let row = 0; row < table.childCount; row++) {
		const rowNode = table.child(row);
		let rowWidth = 0;
		if (hasRowSpan) for (let j = 0; j < row; j++) {
			const prevRow = table.child(j);
			for (let i = 0; i < prevRow.childCount; i++) {
				const cell = prevRow.child(i);
				if (j + cell.attrs.rowspan > row) rowWidth += cell.attrs.colspan;
			}
		}
		for (let i = 0; i < rowNode.childCount; i++) {
			const cell = rowNode.child(i);
			rowWidth += cell.attrs.colspan;
			if (cell.attrs.rowspan > 1) hasRowSpan = true;
		}
		if (width == -1) width = rowWidth;
		else if (width != rowWidth) width = Math.max(width, rowWidth);
	}
	return width;
}
function findBadColWidths(map, colWidths, table) {
	if (!map.problems) map.problems = [];
	const seen = {};
	for (let i = 0; i < map.map.length; i++) {
		const pos = map.map[i];
		if (seen[pos]) continue;
		seen[pos] = true;
		const node = table.nodeAt(pos);
		if (!node) throw new RangeError(`No cell with offset ${pos} found`);
		let updated = null;
		const attrs = node.attrs;
		for (let j = 0; j < attrs.colspan; j++) {
			const colWidth = colWidths[(i + j) % map.width * 2];
			if (colWidth != null && (!attrs.colwidth || attrs.colwidth[j] != colWidth)) (updated || (updated = freshColWidth(attrs)))[j] = colWidth;
		}
		if (updated) map.problems.unshift({
			type: "colwidth mismatch",
			pos,
			colwidth: updated
		});
	}
}
function freshColWidth(attrs) {
	if (attrs.colwidth) return attrs.colwidth.slice();
	const result = [];
	for (let i = 0; i < attrs.colspan; i++) result.push(0);
	return result;
}

//#endregion
//#region src/schema.ts
function getCellAttrs(dom, extraAttrs) {
	if (typeof dom === "string") return {};
	const widthAttr = dom.getAttribute("data-colwidth");
	const widths = widthAttr && /^\d+(,\d+)*$/.test(widthAttr) ? widthAttr.split(",").map((s) => Number(s)) : null;
	const colspan = Number(dom.getAttribute("colspan") || 1);
	const result = {
		colspan,
		rowspan: Number(dom.getAttribute("rowspan") || 1),
		colwidth: widths && widths.length == colspan ? widths : null
	};
	for (const prop in extraAttrs) {
		const getter = extraAttrs[prop].getFromDOM;
		const value = getter && getter(dom);
		if (value != null) result[prop] = value;
	}
	return result;
}
function setCellAttrs(node, extraAttrs) {
	const attrs = {};
	if (node.attrs.colspan != 1) attrs.colspan = node.attrs.colspan;
	if (node.attrs.rowspan != 1) attrs.rowspan = node.attrs.rowspan;
	if (node.attrs.colwidth) attrs["data-colwidth"] = node.attrs.colwidth.join(",");
	for (const prop in extraAttrs) {
		const setter = extraAttrs[prop].setDOMAttr;
		if (setter) setter(node.attrs[prop], attrs);
	}
	return attrs;
}
function validateColwidth(value) {
	if (value === null) return;
	if (!Array.isArray(value)) throw new TypeError("colwidth must be null or an array");
	for (const item of value) if (typeof item !== "number") throw new TypeError("colwidth must be null or an array of numbers");
}
/**
* This function creates a set of [node
* specs](http://prosemirror.net/docs/ref/#model.SchemaSpec.nodes) for
* `table`, `table_row`, and `table_cell` nodes types as used by this
* module. The result can then be added to the set of nodes when
* creating a schema.
*
* @public
*/
function tableNodes(options) {
	const extraAttrs = options.cellAttributes || {};
	const cellAttrs = {
		colspan: {
			default: 1,
			validate: "number"
		},
		rowspan: {
			default: 1,
			validate: "number"
		},
		colwidth: {
			default: null,
			validate: validateColwidth
		}
	};
	for (const prop in extraAttrs) cellAttrs[prop] = {
		default: extraAttrs[prop].default,
		validate: extraAttrs[prop].validate
	};
	return {
		table: {
			content: "table_row+",
			tableRole: "table",
			isolating: true,
			group: options.tableGroup,
			parseDOM: [{ tag: "table" }],
			toDOM() {
				return ["table", ["tbody", 0]];
			}
		},
		table_row: {
			content: "(table_cell | table_header)*",
			tableRole: "row",
			parseDOM: [{ tag: "tr" }],
			toDOM() {
				return ["tr", 0];
			}
		},
		table_cell: {
			content: options.cellContent,
			attrs: cellAttrs,
			tableRole: "cell",
			isolating: true,
			parseDOM: [{
				tag: "td",
				getAttrs: (dom) => getCellAttrs(dom, extraAttrs)
			}],
			toDOM(node) {
				return [
					"td",
					setCellAttrs(node, extraAttrs),
					0
				];
			}
		},
		table_header: {
			content: options.cellContent,
			attrs: cellAttrs,
			tableRole: "header_cell",
			isolating: true,
			parseDOM: [{
				tag: "th",
				getAttrs: (dom) => getCellAttrs(dom, extraAttrs)
			}],
			toDOM(node) {
				return [
					"th",
					setCellAttrs(node, extraAttrs),
					0
				];
			}
		}
	};
}
/**
* @public
*/
function tableNodeTypes(schema) {
	let result = schema.cached.tableNodeTypes;
	if (!result) {
		result = schema.cached.tableNodeTypes = {};
		for (const name in schema.nodes) {
			const type = schema.nodes[name], role = type.spec.tableRole;
			if (role) result[role] = type;
		}
	}
	return result;
}

//#endregion
//#region src/util.ts
/**
* @public
*/
const tableEditingKey = new prosemirror_state.PluginKey("selectingCells");
/**
* @public
*/
function cellAround($pos) {
	for (let d = $pos.depth - 1; d > 0; d--) if ($pos.node(d).type.spec.tableRole == "row") return $pos.node(0).resolve($pos.before(d + 1));
	return null;
}
function cellWrapping($pos) {
	for (let d = $pos.depth; d > 0; d--) {
		const role = $pos.node(d).type.spec.tableRole;
		if (role === "cell" || role === "header_cell") return $pos.node(d);
	}
	return null;
}
/**
* @public
*/
function isInTable(state) {
	const $head = state.selection.$head;
	for (let d = $head.depth; d > 0; d--) if ($head.node(d).type.spec.tableRole == "row") return true;
	return false;
}
/**
* @internal
*/
function selectionCell(state) {
	const sel = state.selection;
	if ("$anchorCell" in sel && sel.$anchorCell) return sel.$anchorCell.pos > sel.$headCell.pos ? sel.$anchorCell : sel.$headCell;
	else if ("node" in sel && sel.node && sel.node.type.spec.tableRole == "cell") return sel.$anchor;
	const $cell = cellAround(sel.$head) || cellNear(sel.$head);
	if ($cell) return $cell;
	throw new RangeError(`No cell found around position ${sel.head}`);
}
/**
* @public
*/
function cellNear($pos) {
	for (let after = $pos.nodeAfter, pos = $pos.pos; after; after = after.firstChild, pos++) {
		const role = after.type.spec.tableRole;
		if (role == "cell" || role == "header_cell") return $pos.doc.resolve(pos);
	}
	for (let before = $pos.nodeBefore, pos = $pos.pos; before; before = before.lastChild, pos--) {
		const role = before.type.spec.tableRole;
		if (role == "cell" || role == "header_cell") return $pos.doc.resolve(pos - before.nodeSize);
	}
}
/**
* @public
*/
function pointsAtCell($pos) {
	return $pos.parent.type.spec.tableRole == "row" && !!$pos.nodeAfter;
}
/**
* @public
*/
function moveCellForward($pos) {
	return $pos.node(0).resolve($pos.pos + $pos.nodeAfter.nodeSize);
}
/**
* @internal
*/
function inSameTable($cellA, $cellB) {
	return $cellA.depth == $cellB.depth && $cellA.pos >= $cellB.start(-1) && $cellA.pos <= $cellB.end(-1);
}
/**
* @public
*/
function findCell($pos) {
	return TableMap.get($pos.node(-1)).findCell($pos.pos - $pos.start(-1));
}
/**
* @public
*/
function colCount($pos) {
	return TableMap.get($pos.node(-1)).colCount($pos.pos - $pos.start(-1));
}
/**
* @public
*/
function nextCell($pos, axis, dir) {
	const table = $pos.node(-1);
	const map = TableMap.get(table);
	const tableStart = $pos.start(-1);
	const moved = map.nextCell($pos.pos - tableStart, axis, dir);
	return moved == null ? null : $pos.node(0).resolve(tableStart + moved);
}
/**
* @public
*/
function removeColSpan(attrs, pos, n = 1) {
	const result = {
		...attrs,
		colspan: attrs.colspan - n
	};
	if (result.colwidth) {
		result.colwidth = result.colwidth.slice();
		result.colwidth.splice(pos, n);
		if (!result.colwidth.some((w) => w > 0)) result.colwidth = null;
	}
	return result;
}
/**
* @public
*/
function addColSpan(attrs, pos, n = 1) {
	const result = {
		...attrs,
		colspan: attrs.colspan + n
	};
	if (result.colwidth) {
		result.colwidth = result.colwidth.slice();
		for (let i = 0; i < n; i++) result.colwidth.splice(pos, 0, 0);
	}
	return result;
}
/**
* @public
*/
function columnIsHeader(map, table, col) {
	const headerCell = tableNodeTypes(table.type.schema).header_cell;
	for (let row = 0; row < map.height; row++) if (table.nodeAt(map.map[col + row * map.width]).type != headerCell) return false;
	return true;
}

//#endregion
//#region src/cellselection.ts
/**
* A [`Selection`](http://prosemirror.net/docs/ref/#state.Selection)
* subclass that represents a cell selection spanning part of a table.
* With the plugin enabled, these will be created when the user
* selects across cells, and will be drawn by giving selected cells a
* `selectedCell` CSS class.
*
* @public
*/
var CellSelection = class CellSelection extends prosemirror_state.Selection {
	constructor($anchorCell, $headCell = $anchorCell) {
		const table = $anchorCell.node(-1);
		const map = TableMap.get(table);
		const tableStart = $anchorCell.start(-1);
		const rect = map.rectBetween($anchorCell.pos - tableStart, $headCell.pos - tableStart);
		const doc = $anchorCell.node(0);
		const cells = map.cellsInRect(rect).filter((p) => p != $headCell.pos - tableStart);
		cells.unshift($headCell.pos - tableStart);
		const ranges = cells.map((pos) => {
			const cell = table.nodeAt(pos);
			if (!cell) throw new RangeError(`No cell with offset ${pos} found`);
			const from = tableStart + pos + 1;
			return new prosemirror_state.SelectionRange(doc.resolve(from), doc.resolve(from + cell.content.size));
		});
		super(ranges[0].$from, ranges[0].$to, ranges);
		this.$anchorCell = $anchorCell;
		this.$headCell = $headCell;
	}
	map(doc, mapping) {
		const $anchorCell = doc.resolve(mapping.map(this.$anchorCell.pos));
		const $headCell = doc.resolve(mapping.map(this.$headCell.pos));
		if (pointsAtCell($anchorCell) && pointsAtCell($headCell) && inSameTable($anchorCell, $headCell)) {
			const tableChanged = this.$anchorCell.node(-1) != $anchorCell.node(-1);
			if (tableChanged && this.isRowSelection()) return CellSelection.rowSelection($anchorCell, $headCell);
			else if (tableChanged && this.isColSelection()) return CellSelection.colSelection($anchorCell, $headCell);
			else return new CellSelection($anchorCell, $headCell);
		}
		return prosemirror_state.TextSelection.between($anchorCell, $headCell);
	}
	content() {
		const table = this.$anchorCell.node(-1);
		const map = TableMap.get(table);
		const tableStart = this.$anchorCell.start(-1);
		const rect = map.rectBetween(this.$anchorCell.pos - tableStart, this.$headCell.pos - tableStart);
		const seen = {};
		const rows = [];
		for (let row = rect.top; row < rect.bottom; row++) {
			const rowContent = [];
			for (let index = row * map.width + rect.left, col = rect.left; col < rect.right; col++, index++) {
				const pos = map.map[index];
				if (seen[pos]) continue;
				seen[pos] = true;
				const cellRect = map.findCell(pos);
				let cell = table.nodeAt(pos);
				if (!cell) throw new RangeError(`No cell with offset ${pos} found`);
				const extraLeft = rect.left - cellRect.left;
				const extraRight = cellRect.right - rect.right;
				if (extraLeft > 0 || extraRight > 0) {
					let attrs = cell.attrs;
					if (extraLeft > 0) attrs = removeColSpan(attrs, 0, extraLeft);
					if (extraRight > 0) attrs = removeColSpan(attrs, attrs.colspan - extraRight, extraRight);
					if (cellRect.left < rect.left) {
						cell = cell.type.createAndFill(attrs);
						if (!cell) throw new RangeError(`Could not create cell with attrs ${JSON.stringify(attrs)}`);
					} else cell = cell.type.create(attrs, cell.content);
				}
				if (cellRect.top < rect.top || cellRect.bottom > rect.bottom) {
					const attrs = {
						...cell.attrs,
						rowspan: Math.min(cellRect.bottom, rect.bottom) - Math.max(cellRect.top, rect.top)
					};
					if (cellRect.top < rect.top) cell = cell.type.createAndFill(attrs);
					else cell = cell.type.create(attrs, cell.content);
				}
				rowContent.push(cell);
			}
			rows.push(table.child(row).copy(prosemirror_model.Fragment.from(rowContent)));
		}
		const fragment = this.isColSelection() && this.isRowSelection() ? table : rows;
		return new prosemirror_model.Slice(prosemirror_model.Fragment.from(fragment), 1, 1);
	}
	replace(tr, content = prosemirror_model.Slice.empty) {
		const mapFrom = tr.steps.length, ranges = this.ranges;
		for (let i = 0; i < ranges.length; i++) {
			const { $from, $to } = ranges[i], mapping = tr.mapping.slice(mapFrom);
			tr.replace(mapping.map($from.pos), mapping.map($to.pos), i ? prosemirror_model.Slice.empty : content);
		}
		const sel = prosemirror_state.Selection.findFrom(tr.doc.resolve(tr.mapping.slice(mapFrom).map(this.to)), -1);
		if (sel) tr.setSelection(sel);
	}
	replaceWith(tr, node) {
		this.replace(tr, new prosemirror_model.Slice(prosemirror_model.Fragment.from(node), 0, 0));
	}
	forEachCell(f) {
		const table = this.$anchorCell.node(-1);
		const map = TableMap.get(table);
		const tableStart = this.$anchorCell.start(-1);
		const cells = map.cellsInRect(map.rectBetween(this.$anchorCell.pos - tableStart, this.$headCell.pos - tableStart));
		for (let i = 0; i < cells.length; i++) f(table.nodeAt(cells[i]), tableStart + cells[i]);
	}
	isColSelection() {
		const anchorTop = this.$anchorCell.index(-1);
		const headTop = this.$headCell.index(-1);
		if (Math.min(anchorTop, headTop) > 0) return false;
		const anchorBottom = anchorTop + this.$anchorCell.nodeAfter.attrs.rowspan;
		const headBottom = headTop + this.$headCell.nodeAfter.attrs.rowspan;
		return Math.max(anchorBottom, headBottom) == this.$headCell.node(-1).childCount;
	}
	static colSelection($anchorCell, $headCell = $anchorCell) {
		const table = $anchorCell.node(-1);
		const map = TableMap.get(table);
		const tableStart = $anchorCell.start(-1);
		const anchorRect = map.findCell($anchorCell.pos - tableStart);
		const headRect = map.findCell($headCell.pos - tableStart);
		const doc = $anchorCell.node(0);
		if (anchorRect.top <= headRect.top) {
			if (anchorRect.top > 0) $anchorCell = doc.resolve(tableStart + map.map[anchorRect.left]);
			if (headRect.bottom < map.height) $headCell = doc.resolve(tableStart + map.map[map.width * (map.height - 1) + headRect.right - 1]);
		} else {
			if (headRect.top > 0) $headCell = doc.resolve(tableStart + map.map[headRect.left]);
			if (anchorRect.bottom < map.height) $anchorCell = doc.resolve(tableStart + map.map[map.width * (map.height - 1) + anchorRect.right - 1]);
		}
		return new CellSelection($anchorCell, $headCell);
	}
	isRowSelection() {
		const table = this.$anchorCell.node(-1);
		const map = TableMap.get(table);
		const tableStart = this.$anchorCell.start(-1);
		const anchorLeft = map.colCount(this.$anchorCell.pos - tableStart);
		const headLeft = map.colCount(this.$headCell.pos - tableStart);
		if (Math.min(anchorLeft, headLeft) > 0) return false;
		const anchorRight = anchorLeft + this.$anchorCell.nodeAfter.attrs.colspan;
		const headRight = headLeft + this.$headCell.nodeAfter.attrs.colspan;
		return Math.max(anchorRight, headRight) == map.width;
	}
	eq(other) {
		return other instanceof CellSelection && other.$anchorCell.pos == this.$anchorCell.pos && other.$headCell.pos == this.$headCell.pos;
	}
	static rowSelection($anchorCell, $headCell = $anchorCell) {
		const table = $anchorCell.node(-1);
		const map = TableMap.get(table);
		const tableStart = $anchorCell.start(-1);
		const anchorRect = map.findCell($anchorCell.pos - tableStart);
		const headRect = map.findCell($headCell.pos - tableStart);
		const doc = $anchorCell.node(0);
		if (anchorRect.left <= headRect.left) {
			if (anchorRect.left > 0) $anchorCell = doc.resolve(tableStart + map.map[anchorRect.top * map.width]);
			if (headRect.right < map.width) $headCell = doc.resolve(tableStart + map.map[map.width * (headRect.top + 1) - 1]);
		} else {
			if (headRect.left > 0) $headCell = doc.resolve(tableStart + map.map[headRect.top * map.width]);
			if (anchorRect.right < map.width) $anchorCell = doc.resolve(tableStart + map.map[map.width * (anchorRect.top + 1) - 1]);
		}
		return new CellSelection($anchorCell, $headCell);
	}
	toJSON() {
		return {
			type: "cell",
			anchor: this.$anchorCell.pos,
			head: this.$headCell.pos
		};
	}
	static fromJSON(doc, json) {
		return new CellSelection(doc.resolve(json.anchor), doc.resolve(json.head));
	}
	static create(doc, anchorCell, headCell = anchorCell) {
		return new CellSelection(doc.resolve(anchorCell), doc.resolve(headCell));
	}
	getBookmark() {
		return new CellBookmark(this.$anchorCell.pos, this.$headCell.pos);
	}
};
CellSelection.prototype.visible = false;
prosemirror_state.Selection.jsonID("cell", CellSelection);
/**
* @public
*/
var CellBookmark = class CellBookmark {
	constructor(anchor, head) {
		this.anchor = anchor;
		this.head = head;
	}
	map(mapping) {
		return new CellBookmark(mapping.map(this.anchor), mapping.map(this.head));
	}
	resolve(doc) {
		const $anchorCell = doc.resolve(this.anchor), $headCell = doc.resolve(this.head);
		if ($anchorCell.parent.type.spec.tableRole == "row" && $headCell.parent.type.spec.tableRole == "row" && $anchorCell.index() < $anchorCell.parent.childCount && $headCell.index() < $headCell.parent.childCount && inSameTable($anchorCell, $headCell)) return new CellSelection($anchorCell, $headCell);
		else return prosemirror_state.Selection.near($headCell, 1);
	}
};
function drawCellSelection(state) {
	if (!(state.selection instanceof CellSelection)) return null;
	const cells = [];
	state.selection.forEachCell((node, pos) => {
		cells.push(prosemirror_view.Decoration.node(pos, pos + node.nodeSize, { class: "selectedCell" }));
	});
	return prosemirror_view.DecorationSet.create(state.doc, cells);
}
function isCellBoundarySelection({ $from, $to }) {
	if ($from.pos == $to.pos || $from.pos < $to.pos - 6) return false;
	let afterFrom = $from.pos;
	let beforeTo = $to.pos;
	let depth = $from.depth;
	for (; depth >= 0; depth--, afterFrom++) if ($from.after(depth + 1) < $from.end(depth)) break;
	for (let d = $to.depth; d >= 0; d--, beforeTo--) if ($to.before(d + 1) > $to.start(d)) break;
	return afterFrom == beforeTo && /row|table/.test($from.node(depth).type.spec.tableRole);
}
function isTextSelectionAcrossCells({ $from, $to }) {
	let fromCellBoundaryNode;
	let toCellBoundaryNode;
	for (let i = $from.depth; i > 0; i--) {
		const node = $from.node(i);
		if (node.type.spec.tableRole === "cell" || node.type.spec.tableRole === "header_cell") {
			fromCellBoundaryNode = node;
			break;
		}
	}
	for (let i = $to.depth; i > 0; i--) {
		const node = $to.node(i);
		if (node.type.spec.tableRole === "cell" || node.type.spec.tableRole === "header_cell") {
			toCellBoundaryNode = node;
			break;
		}
	}
	return fromCellBoundaryNode !== toCellBoundaryNode && $to.parentOffset === 0;
}
function normalizeSelection(state, tr, allowTableNodeSelection) {
	const sel = (tr || state).selection;
	const doc = (tr || state).doc;
	let normalize;
	let role;
	if (sel instanceof prosemirror_state.NodeSelection && (role = sel.node.type.spec.tableRole)) {
		if (role == "cell" || role == "header_cell") normalize = CellSelection.create(doc, sel.from);
		else if (role == "row") {
			const $cell = doc.resolve(sel.from + 1);
			normalize = CellSelection.rowSelection($cell, $cell);
		} else if (!allowTableNodeSelection) {
			const map = TableMap.get(sel.node);
			const start = sel.from + 1;
			const lastCell = start + map.map[map.width * map.height - 1];
			normalize = CellSelection.create(doc, start + 1, lastCell);
		}
	} else if (sel instanceof prosemirror_state.TextSelection && isCellBoundarySelection(sel)) normalize = prosemirror_state.TextSelection.create(doc, sel.from);
	else if (sel instanceof prosemirror_state.TextSelection && isTextSelectionAcrossCells(sel)) normalize = prosemirror_state.TextSelection.create(doc, sel.$from.start(), sel.$from.end());
	if (normalize) (tr || (tr = state.tr)).setSelection(normalize);
	return tr;
}

//#endregion
//#region src/fixtables.ts
/**
* @public
*/
const fixTablesKey = new prosemirror_state.PluginKey("fix-tables");
/**
* Helper for iterating through the nodes in a document that changed
* compared to the given previous document. Useful for avoiding
* duplicate work on each transaction.
*
* @public
*/
function changedDescendants(old, cur, offset, f) {
	const oldSize = old.childCount, curSize = cur.childCount;
	outer: for (let i = 0, j = 0; i < curSize; i++) {
		const child = cur.child(i);
		for (let scan = j, e = Math.min(oldSize, i + 3); scan < e; scan++) if (old.child(scan) == child) {
			j = scan + 1;
			offset += child.nodeSize;
			continue outer;
		}
		f(child, offset);
		if (j < oldSize && old.child(j).sameMarkup(child)) changedDescendants(old.child(j), child, offset + 1, f);
		else child.nodesBetween(0, child.content.size, f, offset + 1);
		offset += child.nodeSize;
	}
}
/**
* Inspect all tables in the given state's document and return a
* transaction that fixes them, if necessary. If `oldState` was
* provided, that is assumed to hold a previous, known-good state,
* which will be used to avoid re-scanning unchanged parts of the
* document.
*
* @public
*/
function fixTables(state, oldState) {
	let tr;
	const check = (node, pos) => {
		if (node.type.spec.tableRole == "table") tr = fixTable(state, node, pos, tr);
	};
	if (!oldState) state.doc.descendants(check);
	else if (oldState.doc != state.doc) changedDescendants(oldState.doc, state.doc, 0, check);
	return tr;
}
function fixTable(state, table, tablePos, tr) {
	const map = TableMap.get(table);
	if (!map.problems) return tr;
	if (!tr) tr = state.tr;
	const mustAdd = [];
	for (let i = 0; i < map.height; i++) mustAdd.push(0);
	for (let i = 0; i < map.problems.length; i++) {
		const prob = map.problems[i];
		if (prob.type == "collision") {
			const cell = table.nodeAt(prob.pos);
			if (!cell) continue;
			const attrs = cell.attrs;
			for (let j = 0; j < attrs.rowspan; j++) mustAdd[prob.row + j] += prob.n;
			tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, removeColSpan(attrs, attrs.colspan - prob.n, prob.n));
		} else if (prob.type == "missing") mustAdd[prob.row] += prob.n;
		else if (prob.type == "overlong_rowspan") {
			const cell = table.nodeAt(prob.pos);
			if (!cell) continue;
			tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, {
				...cell.attrs,
				rowspan: cell.attrs.rowspan - prob.n
			});
		} else if (prob.type == "colwidth mismatch") {
			const cell = table.nodeAt(prob.pos);
			if (!cell) continue;
			tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, {
				...cell.attrs,
				colwidth: prob.colwidth
			});
		} else if (prob.type == "zero_sized") {
			const pos = tr.mapping.map(tablePos);
			tr.delete(pos, pos + table.nodeSize);
		}
	}
	let first, last;
	for (let i = 0; i < mustAdd.length; i++) if (mustAdd[i]) {
		if (first == null) first = i;
		last = i;
	}
	for (let i = 0, pos = tablePos + 1; i < map.height; i++) {
		const row = table.child(i);
		const end = pos + row.nodeSize;
		const add = mustAdd[i];
		if (add > 0) {
			let role = "cell";
			if (row.firstChild) role = row.firstChild.type.spec.tableRole;
			const nodes = [];
			for (let j = 0; j < add; j++) {
				const node = tableNodeTypes(state.schema)[role].createAndFill();
				if (node) nodes.push(node);
			}
			const side = (i == 0 || first == i - 1) && last == i ? pos + 1 : end - 1;
			tr.insert(tr.mapping.map(side), nodes);
		}
		pos = end;
	}
	return tr.setMeta(fixTablesKey, { fixTables: true });
}

//#endregion
//#region src/utils/convert.ts
/**
* This function will transform the table node into a matrix of rows and columns
* respecting merged cells, for example this table:
*
* ```
* ┌──────┬──────┬─────────────┐
* │  A1  │  B1  │     C1      │
* ├──────┼──────┴──────┬──────┤
* │  A2  │     B2      │      │
* ├──────┼─────────────┤  D1  │
* │  A3  │  B3  │  C3  │      │
* └──────┴──────┴──────┴──────┘
* ```
*
* will be converted to the below:
*
* ```javascript
* [
*   [A1, B1, C1, null],
*   [A2, B2, null, D1],
*   [A3, B3, C3, null],
* ]
* ```
* @internal
*/
function convertTableNodeToArrayOfRows(tableNode) {
	const map = TableMap.get(tableNode);
	const rows = [];
	const rowCount = map.height;
	const colCount$1 = map.width;
	for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
		const row = [];
		for (let colIndex = 0; colIndex < colCount$1; colIndex++) {
			const cellIndex = rowIndex * colCount$1 + colIndex;
			const cellPos = map.map[cellIndex];
			if (rowIndex > 0) {
				const topCellIndex = cellIndex - colCount$1;
				if (cellPos === map.map[topCellIndex]) {
					row.push(null);
					continue;
				}
			}
			if (colIndex > 0) {
				const leftCellIndex = cellIndex - 1;
				if (cellPos === map.map[leftCellIndex]) {
					row.push(null);
					continue;
				}
			}
			row.push(tableNode.nodeAt(cellPos));
		}
		rows.push(row);
	}
	return rows;
}
/**
* Convert an array of rows to a table node.
*
* @internal
*/
function convertArrayOfRowsToTableNode(tableNode, arrayOfNodes) {
	const newRows = [];
	const map = TableMap.get(tableNode);
	const rowCount = map.height;
	const colCount$1 = map.width;
	for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
		const oldRow = tableNode.child(rowIndex);
		const newCells = [];
		for (let colIndex = 0; colIndex < colCount$1; colIndex++) {
			const cell = arrayOfNodes[rowIndex][colIndex];
			if (!cell) continue;
			const cellPos = map.map[rowIndex * map.width + colIndex];
			const oldCell = tableNode.nodeAt(cellPos);
			if (!oldCell) continue;
			const newCell = oldCell.type.createChecked(cell.attrs, cell.content, cell.marks);
			newCells.push(newCell);
		}
		const newRow = oldRow.type.createChecked(oldRow.attrs, newCells, oldRow.marks);
		newRows.push(newRow);
	}
	return tableNode.type.createChecked(tableNode.attrs, newRows, tableNode.marks);
}

//#endregion
//#region src/utils/move-row-in-array-of-rows.ts
/**
* Move a row in an array of rows.
*
* @internal
*/
function moveRowInArrayOfRows(rows, indexesOrigin, indexesTarget, directionOverride) {
	const direction = indexesOrigin[0] > indexesTarget[0] ? -1 : 1;
	const rowsExtracted = rows.splice(indexesOrigin[0], indexesOrigin.length);
	const positionOffset = rowsExtracted.length % 2 === 0 ? 1 : 0;
	let target;
	if (directionOverride === -1 && direction === 1) target = indexesTarget[0] - 1;
	else if (directionOverride === 1 && direction === -1) target = indexesTarget[indexesTarget.length - 1] - positionOffset + 1;
	else target = direction === -1 ? indexesTarget[0] : indexesTarget[indexesTarget.length - 1] - positionOffset;
	rows.splice(target, 0, ...rowsExtracted);
	return rows;
}

//#endregion
//#region src/utils/query.ts
/**
* Checks if the given object is a `CellSelection` instance.
*
* @internal
*/
function isCellSelection(value) {
	return value instanceof CellSelection;
}
/**
* Find the closest table node for a given position.
*
* @public
*/
function findTable($pos) {
	return findParentNode((node) => node.type.spec.tableRole === "table", $pos);
}
/**
* Try to find the anchor and head cell in the same table by using the given
* anchor and head as hit points, or fallback to the selection's anchor and
* head.
*
* @public
*/
function findCellRange(selection, anchorHit, headHit) {
	var _ref, _ref2;
	if (anchorHit == null && headHit == null && isCellSelection(selection)) return [selection.$anchorCell, selection.$headCell];
	const anchor = (_ref = anchorHit !== null && anchorHit !== void 0 ? anchorHit : headHit) !== null && _ref !== void 0 ? _ref : selection.anchor;
	const head = (_ref2 = headHit !== null && headHit !== void 0 ? headHit : anchorHit) !== null && _ref2 !== void 0 ? _ref2 : selection.head;
	const doc = selection.$head.doc;
	const $anchorCell = findCellPos(doc, anchor);
	const $headCell = findCellPos(doc, head);
	if ($anchorCell && $headCell && inSameTable($anchorCell, $headCell)) return [$anchorCell, $headCell];
	return null;
}
/**
* Try to find a resolved pos of a cell by using the given pos as a hit point.
*
* @public
*/
function findCellPos(doc, pos) {
	const $pos = doc.resolve(pos);
	return cellAround($pos) || cellNear($pos);
}
/**
* Find the closest parent node that satisfies the predicate.
*
* @internal
*/
function findParentNode(predicate, $pos) {
	for (let depth = $pos.depth; depth >= 0; depth -= 1) {
		const node = $pos.node(depth);
		if (predicate(node)) return {
			node,
			pos: depth === 0 ? 0 : $pos.before(depth),
			start: $pos.start(depth),
			depth
		};
	}
	return null;
}

//#endregion
//#region src/utils/get-cells.ts
/**
* Returns an array of cells in a column at the specified column index.
*
* @internal
*/
function getCellsInColumn(columnIndex, selection) {
	const table = findTable(selection.$from);
	if (!table) return;
	const map = TableMap.get(table.node);
	if (columnIndex < 0 || columnIndex > map.width - 1) return;
	return map.cellsInRect({
		left: columnIndex,
		right: columnIndex + 1,
		top: 0,
		bottom: map.height
	}).map((nodePos) => {
		const node = table.node.nodeAt(nodePos);
		const pos = nodePos + table.start;
		return {
			pos,
			start: pos + 1,
			node,
			depth: table.depth + 2
		};
	});
}
/**
* Returns an array of cells in a row at the specified row index.
*
* @internal
*/
function getCellsInRow(rowIndex, selection) {
	const table = findTable(selection.$from);
	if (!table) return;
	const map = TableMap.get(table.node);
	if (rowIndex < 0 || rowIndex > map.height - 1) return;
	return map.cellsInRect({
		left: 0,
		right: map.width,
		top: rowIndex,
		bottom: rowIndex + 1
	}).map((nodePos) => {
		const node = table.node.nodeAt(nodePos);
		const pos = nodePos + table.start;
		return {
			pos,
			start: pos + 1,
			node,
			depth: table.depth + 2
		};
	});
}

//#endregion
//#region src/utils/selection-range.ts
/**
* Returns a range of rectangular selection spanning all merged cells around a
* column at index `columnIndex`.
*
* Original implementation from Atlassian (Apache License 2.0)
*
* https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/5f91cb871e8248bc3bae5ddc30bb9fd9200fadbb/editor/editor-tables/src/utils/get-selection-range-in-column.ts#editor/editor-tables/src/utils/get-selection-range-in-column.ts
*
* @internal
*/
function getSelectionRangeInColumn(tr, startColIndex, endColIndex = startColIndex) {
	let startIndex = startColIndex;
	let endIndex = endColIndex;
	for (let i = startColIndex; i >= 0; i--) {
		const cells = getCellsInColumn(i, tr.selection);
		if (cells) cells.forEach((cell) => {
			const maybeEndIndex = cell.node.attrs.colspan + i - 1;
			if (maybeEndIndex >= startIndex) startIndex = i;
			if (maybeEndIndex > endIndex) endIndex = maybeEndIndex;
		});
	}
	for (let i = startColIndex; i <= endIndex; i++) {
		const cells = getCellsInColumn(i, tr.selection);
		if (cells) cells.forEach((cell) => {
			const maybeEndIndex = cell.node.attrs.colspan + i - 1;
			if (cell.node.attrs.colspan > 1 && maybeEndIndex > endIndex) endIndex = maybeEndIndex;
		});
	}
	const indexes = [];
	for (let i = startIndex; i <= endIndex; i++) {
		const maybeCells = getCellsInColumn(i, tr.selection);
		if (maybeCells && maybeCells.length > 0) indexes.push(i);
	}
	startIndex = indexes[0];
	endIndex = indexes[indexes.length - 1];
	const firstSelectedColumnCells = getCellsInColumn(startIndex, tr.selection);
	const firstRowCells = getCellsInRow(0, tr.selection);
	if (!firstSelectedColumnCells || !firstRowCells) return;
	const $anchor = tr.doc.resolve(firstSelectedColumnCells[firstSelectedColumnCells.length - 1].pos);
	let headCell;
	for (let i = endIndex; i >= startIndex; i--) {
		const columnCells = getCellsInColumn(i, tr.selection);
		if (columnCells && columnCells.length > 0) {
			for (let j = firstRowCells.length - 1; j >= 0; j--) if (firstRowCells[j].pos === columnCells[0].pos) {
				headCell = columnCells[0];
				break;
			}
			if (headCell) break;
		}
	}
	if (!headCell) return;
	return {
		$anchor,
		$head: tr.doc.resolve(headCell.pos),
		indexes
	};
}
/**
* Returns a range of rectangular selection spanning all merged cells around a
* row at index `rowIndex`.
*
* Original implementation from Atlassian (Apache License 2.0)
*
* https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/5f91cb871e8248bc3bae5ddc30bb9fd9200fadbb/editor/editor-tables/src/utils/get-selection-range-in-row.ts#editor/editor-tables/src/utils/get-selection-range-in-row.ts
*
* @internal
*/
function getSelectionRangeInRow(tr, startRowIndex, endRowIndex = startRowIndex) {
	let startIndex = startRowIndex;
	let endIndex = endRowIndex;
	for (let i = startRowIndex; i >= 0; i--) {
		const cells = getCellsInRow(i, tr.selection);
		if (cells) cells.forEach((cell) => {
			const maybeEndIndex = cell.node.attrs.rowspan + i - 1;
			if (maybeEndIndex >= startIndex) startIndex = i;
			if (maybeEndIndex > endIndex) endIndex = maybeEndIndex;
		});
	}
	for (let i = startRowIndex; i <= endIndex; i++) {
		const cells = getCellsInRow(i, tr.selection);
		if (cells) cells.forEach((cell) => {
			const maybeEndIndex = cell.node.attrs.rowspan + i - 1;
			if (cell.node.attrs.rowspan > 1 && maybeEndIndex > endIndex) endIndex = maybeEndIndex;
		});
	}
	const indexes = [];
	for (let i = startIndex; i <= endIndex; i++) {
		const maybeCells = getCellsInRow(i, tr.selection);
		if (maybeCells && maybeCells.length > 0) indexes.push(i);
	}
	startIndex = indexes[0];
	endIndex = indexes[indexes.length - 1];
	const firstSelectedRowCells = getCellsInRow(startIndex, tr.selection);
	const firstColumnCells = getCellsInColumn(0, tr.selection);
	if (!firstSelectedRowCells || !firstColumnCells) return;
	const $anchor = tr.doc.resolve(firstSelectedRowCells[firstSelectedRowCells.length - 1].pos);
	let headCell;
	for (let i = endIndex; i >= startIndex; i--) {
		const rowCells = getCellsInRow(i, tr.selection);
		if (rowCells && rowCells.length > 0) {
			for (let j = firstColumnCells.length - 1; j >= 0; j--) if (firstColumnCells[j].pos === rowCells[0].pos) {
				headCell = rowCells[0];
				break;
			}
			if (headCell) break;
		}
	}
	if (!headCell) return;
	return {
		$anchor,
		$head: tr.doc.resolve(headCell.pos),
		indexes
	};
}

//#endregion
//#region src/utils/transpose.ts
/**
* Transposes a 2D array by flipping columns to rows.
*
* Transposition is a familiar algebra concept where the matrix is flipped
* along its diagonal. For more details, see:
* https://en.wikipedia.org/wiki/Transpose
*
* @example
* ```javascript
* const arr = [
*   ['a1', 'a2', 'a3'],
*   ['b1', 'b2', 'b3'],
*   ['c1', 'c2', 'c3'],
*   ['d1', 'd2', 'd3'],
* ];
*
* const result = transpose(arr);
* result === [
*   ['a1', 'b1', 'c1', 'd1'],
*   ['a2', 'b2', 'c2', 'd2'],
*   ['a3', 'b3', 'c3', 'd3'],
* ]
* ```
*/
function transpose(array) {
	return array[0].map((_, i) => {
		return array.map((column) => column[i]);
	});
}

//#endregion
//#region src/utils/move-column.ts
/**
* Move a column from index `origin` to index `target`.
*
* @internal
*/
function moveColumn(moveColParams) {
	var _getSelectionRangeInC, _getSelectionRangeInC2;
	const { tr, originIndex, targetIndex, select, pos } = moveColParams;
	const table = findTable(tr.doc.resolve(pos));
	if (!table) return false;
	const indexesOriginColumn = (_getSelectionRangeInC = getSelectionRangeInColumn(tr, originIndex)) === null || _getSelectionRangeInC === void 0 ? void 0 : _getSelectionRangeInC.indexes;
	const indexesTargetColumn = (_getSelectionRangeInC2 = getSelectionRangeInColumn(tr, targetIndex)) === null || _getSelectionRangeInC2 === void 0 ? void 0 : _getSelectionRangeInC2.indexes;
	if (!indexesOriginColumn || !indexesTargetColumn) return false;
	if (indexesOriginColumn.includes(targetIndex)) return false;
	const newTable = moveTableColumn$1(table.node, indexesOriginColumn, indexesTargetColumn, 0);
	tr.replaceWith(table.pos, table.pos + table.node.nodeSize, newTable);
	if (!select) return true;
	const map = TableMap.get(newTable);
	const start = table.start;
	const index = targetIndex;
	const lastCell = map.positionAt(map.height - 1, index, newTable);
	const $lastCell = tr.doc.resolve(start + lastCell);
	const firstCell = map.positionAt(0, index, newTable);
	const $firstCell = tr.doc.resolve(start + firstCell);
	tr.setSelection(CellSelection.colSelection($lastCell, $firstCell));
	return true;
}
function moveTableColumn$1(table, indexesOrigin, indexesTarget, direction) {
	let rows = transpose(convertTableNodeToArrayOfRows(table));
	rows = moveRowInArrayOfRows(rows, indexesOrigin, indexesTarget, direction);
	rows = transpose(rows);
	return convertArrayOfRowsToTableNode(table, rows);
}

//#endregion
//#region src/utils/move-row.ts
/**
* Move a row from index `origin` to index `target`.
*
* @internal
*/
function moveRow(moveRowParams) {
	var _getSelectionRangeInR, _getSelectionRangeInR2;
	const { tr, originIndex, targetIndex, select, pos } = moveRowParams;
	const table = findTable(tr.doc.resolve(pos));
	if (!table) return false;
	const indexesOriginRow = (_getSelectionRangeInR = getSelectionRangeInRow(tr, originIndex)) === null || _getSelectionRangeInR === void 0 ? void 0 : _getSelectionRangeInR.indexes;
	const indexesTargetRow = (_getSelectionRangeInR2 = getSelectionRangeInRow(tr, targetIndex)) === null || _getSelectionRangeInR2 === void 0 ? void 0 : _getSelectionRangeInR2.indexes;
	if (!indexesOriginRow || !indexesTargetRow) return false;
	if (indexesOriginRow.includes(targetIndex)) return false;
	const newTable = moveTableRow$1(table.node, indexesOriginRow, indexesTargetRow, 0);
	tr.replaceWith(table.pos, table.pos + table.node.nodeSize, newTable);
	if (!select) return true;
	const map = TableMap.get(newTable);
	const start = table.start;
	const index = targetIndex;
	const lastCell = map.positionAt(index, map.width - 1, newTable);
	const $lastCell = tr.doc.resolve(start + lastCell);
	const firstCell = map.positionAt(index, 0, newTable);
	const $firstCell = tr.doc.resolve(start + firstCell);
	tr.setSelection(CellSelection.rowSelection($lastCell, $firstCell));
	return true;
}
function moveTableRow$1(table, indexesOrigin, indexesTarget, direction) {
	let rows = convertTableNodeToArrayOfRows(table);
	rows = moveRowInArrayOfRows(rows, indexesOrigin, indexesTarget, direction);
	return convertArrayOfRowsToTableNode(table, rows);
}

//#endregion
//#region src/commands.ts
/**
* Helper to get the selected rectangle in a table, if any. Adds table
* map, table node, and table start offset to the object for
* convenience.
*
* @public
*/
function selectedRect(state) {
	const sel = state.selection;
	const $pos = selectionCell(state);
	const table = $pos.node(-1);
	const tableStart = $pos.start(-1);
	const map = TableMap.get(table);
	return {
		...sel instanceof CellSelection ? map.rectBetween(sel.$anchorCell.pos - tableStart, sel.$headCell.pos - tableStart) : map.findCell($pos.pos - tableStart),
		tableStart,
		map,
		table
	};
}
/**
* Add a column at the given position in a table.
*
* @public
*/
function addColumn(tr, { map, tableStart, table }, col) {
	let refColumn = col > 0 ? -1 : 0;
	if (columnIsHeader(map, table, col + refColumn)) refColumn = col == 0 || col == map.width ? null : 0;
	for (let row = 0; row < map.height; row++) {
		const index = row * map.width + col;
		if (col > 0 && col < map.width && map.map[index - 1] == map.map[index]) {
			const pos = map.map[index];
			const cell = table.nodeAt(pos);
			tr.setNodeMarkup(tr.mapping.map(tableStart + pos), null, addColSpan(cell.attrs, col - map.colCount(pos)));
			row += cell.attrs.rowspan - 1;
		} else {
			const type = refColumn == null ? tableNodeTypes(table.type.schema).cell : table.nodeAt(map.map[index + refColumn]).type;
			const pos = map.positionAt(row, col, table);
			tr.insert(tr.mapping.map(tableStart + pos), type.createAndFill());
		}
	}
	return tr;
}
/**
* Command to add a column before the column with the selection.
*
* @public
*/
function addColumnBefore(state, dispatch) {
	if (!isInTable(state)) return false;
	if (dispatch) {
		const rect = selectedRect(state);
		dispatch(addColumn(state.tr, rect, rect.left));
	}
	return true;
}
/**
* Command to add a column after the column with the selection.
*
* @public
*/
function addColumnAfter(state, dispatch) {
	if (!isInTable(state)) return false;
	if (dispatch) {
		const rect = selectedRect(state);
		dispatch(addColumn(state.tr, rect, rect.right));
	}
	return true;
}
/**
* @public
*/
function removeColumn(tr, { map, table, tableStart }, col) {
	const mapStart = tr.mapping.maps.length;
	for (let row = 0; row < map.height;) {
		const index = row * map.width + col;
		const pos = map.map[index];
		const cell = table.nodeAt(pos);
		const attrs = cell.attrs;
		if (col > 0 && map.map[index - 1] == pos || col < map.width - 1 && map.map[index + 1] == pos) tr.setNodeMarkup(tr.mapping.slice(mapStart).map(tableStart + pos), null, removeColSpan(attrs, col - map.colCount(pos)));
		else {
			const start = tr.mapping.slice(mapStart).map(tableStart + pos);
			tr.delete(start, start + cell.nodeSize);
		}
		row += attrs.rowspan;
	}
}
/**
* Command function that removes the selected columns from a table.
*
* @public
*/
function deleteColumn(state, dispatch) {
	if (!isInTable(state)) return false;
	if (dispatch) {
		const rect = selectedRect(state);
		const tr = state.tr;
		if (rect.left == 0 && rect.right == rect.map.width) return false;
		for (let i = rect.right - 1;; i--) {
			removeColumn(tr, rect, i);
			if (i == rect.left) break;
			const table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
			if (!table) throw new RangeError("No table found");
			rect.table = table;
			rect.map = TableMap.get(table);
		}
		dispatch(tr);
	}
	return true;
}
/**
* @public
*/
function rowIsHeader(map, table, row) {
	var _table$nodeAt;
	const headerCell = tableNodeTypes(table.type.schema).header_cell;
	for (let col = 0; col < map.width; col++) if (((_table$nodeAt = table.nodeAt(map.map[col + row * map.width])) === null || _table$nodeAt === void 0 ? void 0 : _table$nodeAt.type) != headerCell) return false;
	return true;
}
/**
* @public
*/
function addRow(tr, { map, tableStart, table }, row) {
	let rowPos = tableStart;
	for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize;
	const cells = [];
	let refRow = row > 0 ? -1 : 0;
	if (rowIsHeader(map, table, row + refRow)) refRow = row == 0 || row == map.height ? null : 0;
	for (let col = 0, index = map.width * row; col < map.width; col++, index++) if (row > 0 && row < map.height && map.map[index] == map.map[index - map.width]) {
		const pos = map.map[index];
		const attrs = table.nodeAt(pos).attrs;
		tr.setNodeMarkup(tableStart + pos, null, {
			...attrs,
			rowspan: attrs.rowspan + 1
		});
		col += attrs.colspan - 1;
	} else {
		var _table$nodeAt2;
		const type = refRow == null ? tableNodeTypes(table.type.schema).cell : (_table$nodeAt2 = table.nodeAt(map.map[index + refRow * map.width])) === null || _table$nodeAt2 === void 0 ? void 0 : _table$nodeAt2.type;
		const node = type === null || type === void 0 ? void 0 : type.createAndFill();
		if (node) cells.push(node);
	}
	tr.insert(rowPos, tableNodeTypes(table.type.schema).row.create(null, cells));
	return tr;
}
/**
* Add a table row before the selection.
*
* @public
*/
function addRowBefore(state, dispatch) {
	if (!isInTable(state)) return false;
	if (dispatch) {
		const rect = selectedRect(state);
		dispatch(addRow(state.tr, rect, rect.top));
	}
	return true;
}
/**
* Add a table row after the selection.
*
* @public
*/
function addRowAfter(state, dispatch) {
	if (!isInTable(state)) return false;
	if (dispatch) {
		const rect = selectedRect(state);
		dispatch(addRow(state.tr, rect, rect.bottom));
	}
	return true;
}
/**
* @public
*/
function removeRow(tr, { map, table, tableStart }, row) {
	let rowPos = 0;
	for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize;
	const nextRow = rowPos + table.child(row).nodeSize;
	const mapFrom = tr.mapping.maps.length;
	tr.delete(rowPos + tableStart, nextRow + tableStart);
	const seen = /* @__PURE__ */ new Set();
	for (let col = 0, index = row * map.width; col < map.width; col++, index++) {
		const pos = map.map[index];
		if (seen.has(pos)) continue;
		seen.add(pos);
		if (row > 0 && pos == map.map[index - map.width]) {
			const attrs = table.nodeAt(pos).attrs;
			tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + tableStart), null, {
				...attrs,
				rowspan: attrs.rowspan - 1
			});
			col += attrs.colspan - 1;
		} else if (row < map.height && pos == map.map[index + map.width]) {
			const cell = table.nodeAt(pos);
			const attrs = cell.attrs;
			const copy = cell.type.create({
				...attrs,
				rowspan: cell.attrs.rowspan - 1
			}, cell.content);
			const newPos = map.positionAt(row + 1, col, table);
			tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), copy);
			col += attrs.colspan - 1;
		}
	}
}
/**
* Remove the selected rows from a table.
*
* @public
*/
function deleteRow(state, dispatch) {
	if (!isInTable(state)) return false;
	if (dispatch) {
		const rect = selectedRect(state), tr = state.tr;
		if (rect.top == 0 && rect.bottom == rect.map.height) return false;
		for (let i = rect.bottom - 1;; i--) {
			removeRow(tr, rect, i);
			if (i == rect.top) break;
			const table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
			if (!table) throw new RangeError("No table found");
			rect.table = table;
			rect.map = TableMap.get(rect.table);
		}
		dispatch(tr);
	}
	return true;
}
function isEmpty(cell) {
	const c = cell.content;
	return c.childCount == 1 && c.child(0).isTextblock && c.child(0).childCount == 0;
}
function cellsOverlapRectangle({ width, height, map }, rect) {
	let indexTop = rect.top * width + rect.left, indexLeft = indexTop;
	let indexBottom = (rect.bottom - 1) * width + rect.left, indexRight = indexTop + (rect.right - rect.left - 1);
	for (let i = rect.top; i < rect.bottom; i++) {
		if (rect.left > 0 && map[indexLeft] == map[indexLeft - 1] || rect.right < width && map[indexRight] == map[indexRight + 1]) return true;
		indexLeft += width;
		indexRight += width;
	}
	for (let i = rect.left; i < rect.right; i++) {
		if (rect.top > 0 && map[indexTop] == map[indexTop - width] || rect.bottom < height && map[indexBottom] == map[indexBottom + width]) return true;
		indexTop++;
		indexBottom++;
	}
	return false;
}
/**
* Merge the selected cells into a single cell. Only available when
* the selected cells' outline forms a rectangle.
*
* @public
*/
function mergeCells(state, dispatch) {
	const sel = state.selection;
	if (!(sel instanceof CellSelection) || sel.$anchorCell.pos == sel.$headCell.pos) return false;
	const rect = selectedRect(state), { map } = rect;
	if (cellsOverlapRectangle(map, rect)) return false;
	if (dispatch) {
		const tr = state.tr;
		const seen = {};
		let content = prosemirror_model.Fragment.empty;
		let mergedPos;
		let mergedCell;
		for (let row = rect.top; row < rect.bottom; row++) for (let col = rect.left; col < rect.right; col++) {
			const cellPos = map.map[row * map.width + col];
			const cell = rect.table.nodeAt(cellPos);
			if (seen[cellPos] || !cell) continue;
			seen[cellPos] = true;
			if (mergedPos == null) {
				mergedPos = cellPos;
				mergedCell = cell;
			} else {
				if (!isEmpty(cell)) content = content.append(cell.content);
				const mapped = tr.mapping.map(cellPos + rect.tableStart);
				tr.delete(mapped, mapped + cell.nodeSize);
			}
		}
		if (mergedPos == null || mergedCell == null) return true;
		tr.setNodeMarkup(mergedPos + rect.tableStart, null, {
			...addColSpan(mergedCell.attrs, mergedCell.attrs.colspan, rect.right - rect.left - mergedCell.attrs.colspan),
			rowspan: rect.bottom - rect.top
		});
		if (content.size > 0) {
			const end = mergedPos + 1 + mergedCell.content.size;
			const start = isEmpty(mergedCell) ? mergedPos + 1 : end;
			tr.replaceWith(start + rect.tableStart, end + rect.tableStart, content);
		}
		tr.setSelection(new CellSelection(tr.doc.resolve(mergedPos + rect.tableStart)));
		dispatch(tr);
	}
	return true;
}
/**
* Split a selected cell, whose rowpan or colspan is greater than one,
* into smaller cells. Use the first cell type for the new cells.
*
* @public
*/
function splitCell(state, dispatch) {
	const nodeTypes = tableNodeTypes(state.schema);
	return splitCellWithType(({ node }) => {
		return nodeTypes[node.type.spec.tableRole];
	})(state, dispatch);
}
/**
* Split a selected cell, whose rowpan or colspan is greater than one,
* into smaller cells with the cell type (th, td) returned by getType function.
*
* @public
*/
function splitCellWithType(getCellType) {
	return (state, dispatch) => {
		const sel = state.selection;
		let cellNode;
		let cellPos;
		if (!(sel instanceof CellSelection)) {
			var _cellAround;
			cellNode = cellWrapping(sel.$from);
			if (!cellNode) return false;
			cellPos = (_cellAround = cellAround(sel.$from)) === null || _cellAround === void 0 ? void 0 : _cellAround.pos;
		} else {
			if (sel.$anchorCell.pos != sel.$headCell.pos) return false;
			cellNode = sel.$anchorCell.nodeAfter;
			cellPos = sel.$anchorCell.pos;
		}
		if (cellNode == null || cellPos == null) return false;
		if (cellNode.attrs.colspan == 1 && cellNode.attrs.rowspan == 1) return false;
		if (dispatch) {
			let baseAttrs = cellNode.attrs;
			const attrs = [];
			const colwidth = baseAttrs.colwidth;
			if (baseAttrs.rowspan > 1) baseAttrs = {
				...baseAttrs,
				rowspan: 1
			};
			if (baseAttrs.colspan > 1) baseAttrs = {
				...baseAttrs,
				colspan: 1
			};
			const rect = selectedRect(state), tr = state.tr;
			for (let i = 0; i < rect.right - rect.left; i++) attrs.push(colwidth ? {
				...baseAttrs,
				colwidth: colwidth && colwidth[i] ? [colwidth[i]] : null
			} : baseAttrs);
			let lastCell;
			for (let row = rect.top; row < rect.bottom; row++) {
				let pos = rect.map.positionAt(row, rect.left, rect.table);
				if (row == rect.top) pos += cellNode.nodeSize;
				for (let col = rect.left, i = 0; col < rect.right; col++, i++) {
					if (col == rect.left && row == rect.top) continue;
					tr.insert(lastCell = tr.mapping.map(pos + rect.tableStart, 1), getCellType({
						node: cellNode,
						row,
						col
					}).createAndFill(attrs[i]));
				}
			}
			tr.setNodeMarkup(cellPos, getCellType({
				node: cellNode,
				row: rect.top,
				col: rect.left
			}), attrs[0]);
			if (sel instanceof CellSelection) tr.setSelection(new CellSelection(tr.doc.resolve(sel.$anchorCell.pos), lastCell ? tr.doc.resolve(lastCell) : void 0));
			dispatch(tr);
		}
		return true;
	};
}
/**
* Returns a command that sets the given attribute to the given value,
* and is only available when the currently selected cell doesn't
* already have that attribute set to that value.
*
* @public
*/
function setCellAttr(name, value) {
	return function(state, dispatch) {
		if (!isInTable(state)) return false;
		const $cell = selectionCell(state);
		if ($cell.nodeAfter.attrs[name] === value) return false;
		if (dispatch) {
			const tr = state.tr;
			if (state.selection instanceof CellSelection) state.selection.forEachCell((node, pos) => {
				if (node.attrs[name] !== value) tr.setNodeMarkup(pos, null, {
					...node.attrs,
					[name]: value
				});
			});
			else tr.setNodeMarkup($cell.pos, null, {
				...$cell.nodeAfter.attrs,
				[name]: value
			});
			dispatch(tr);
		}
		return true;
	};
}
function deprecated_toggleHeader(type) {
	return function(state, dispatch) {
		if (!isInTable(state)) return false;
		if (dispatch) {
			const types = tableNodeTypes(state.schema);
			const rect = selectedRect(state), tr = state.tr;
			const cells = rect.map.cellsInRect(type == "column" ? {
				left: rect.left,
				top: 0,
				right: rect.right,
				bottom: rect.map.height
			} : type == "row" ? {
				left: 0,
				top: rect.top,
				right: rect.map.width,
				bottom: rect.bottom
			} : rect);
			const nodes = cells.map((pos) => rect.table.nodeAt(pos));
			for (let i = 0; i < cells.length; i++) if (nodes[i].type == types.header_cell) tr.setNodeMarkup(rect.tableStart + cells[i], types.cell, nodes[i].attrs);
			if (tr.steps.length === 0) for (let i = 0; i < cells.length; i++) tr.setNodeMarkup(rect.tableStart + cells[i], types.header_cell, nodes[i].attrs);
			dispatch(tr);
		}
		return true;
	};
}
function isHeaderEnabledByType(type, rect, types) {
	const cellPositions = rect.map.cellsInRect({
		left: 0,
		top: 0,
		right: type == "row" ? rect.map.width : 1,
		bottom: type == "column" ? rect.map.height : 1
	});
	for (let i = 0; i < cellPositions.length; i++) {
		const cell = rect.table.nodeAt(cellPositions[i]);
		if (cell && cell.type !== types.header_cell) return false;
	}
	return true;
}
/**
* Toggles between row/column header and normal cells (Only applies to first row/column).
* For deprecated behavior pass `useDeprecatedLogic` in options with true.
*
* @public
*/
function toggleHeader(type, options) {
	options = options || { useDeprecatedLogic: false };
	if (options.useDeprecatedLogic) return deprecated_toggleHeader(type);
	return function(state, dispatch) {
		if (!isInTable(state)) return false;
		if (dispatch) {
			const types = tableNodeTypes(state.schema);
			const rect = selectedRect(state), tr = state.tr;
			const isHeaderRowEnabled = isHeaderEnabledByType("row", rect, types);
			const isHeaderColumnEnabled = isHeaderEnabledByType("column", rect, types);
			const selectionStartsAt = (type === "column" ? isHeaderRowEnabled : type === "row" ? isHeaderColumnEnabled : false) ? 1 : 0;
			const cellsRect = type == "column" ? {
				left: 0,
				top: selectionStartsAt,
				right: 1,
				bottom: rect.map.height
			} : type == "row" ? {
				left: selectionStartsAt,
				top: 0,
				right: rect.map.width,
				bottom: 1
			} : rect;
			const newType = type == "column" ? isHeaderColumnEnabled ? types.cell : types.header_cell : type == "row" ? isHeaderRowEnabled ? types.cell : types.header_cell : types.cell;
			rect.map.cellsInRect(cellsRect).forEach((relativeCellPos) => {
				const cellPos = relativeCellPos + rect.tableStart;
				const cell = tr.doc.nodeAt(cellPos);
				if (cell) tr.setNodeMarkup(cellPos, newType, cell.attrs);
			});
			dispatch(tr);
		}
		return true;
	};
}
/**
* Toggles whether the selected row contains header cells.
*
* @public
*/
const toggleHeaderRow = toggleHeader("row", { useDeprecatedLogic: true });
/**
* Toggles whether the selected column contains header cells.
*
* @public
*/
const toggleHeaderColumn = toggleHeader("column", { useDeprecatedLogic: true });
/**
* Toggles whether the selected cells are header cells.
*
* @public
*/
const toggleHeaderCell = toggleHeader("cell", { useDeprecatedLogic: true });
function findNextCell($cell, dir) {
	if (dir < 0) {
		const before = $cell.nodeBefore;
		if (before) return $cell.pos - before.nodeSize;
		for (let row = $cell.index(-1) - 1, rowEnd = $cell.before(); row >= 0; row--) {
			const rowNode = $cell.node(-1).child(row);
			const lastChild = rowNode.lastChild;
			if (lastChild) return rowEnd - 1 - lastChild.nodeSize;
			rowEnd -= rowNode.nodeSize;
		}
	} else {
		if ($cell.index() < $cell.parent.childCount - 1) return $cell.pos + $cell.nodeAfter.nodeSize;
		const table = $cell.node(-1);
		for (let row = $cell.indexAfter(-1), rowStart = $cell.after(); row < table.childCount; row++) {
			const rowNode = table.child(row);
			if (rowNode.childCount) return rowStart + 1;
			rowStart += rowNode.nodeSize;
		}
	}
	return null;
}
/**
* Returns a command for selecting the next (direction=1) or previous
* (direction=-1) cell in a table.
*
* @public
*/
function goToNextCell(direction) {
	return function(state, dispatch) {
		if (!isInTable(state)) return false;
		const cell = findNextCell(selectionCell(state), direction);
		if (cell == null) return false;
		if (dispatch) {
			const $cell = state.doc.resolve(cell);
			dispatch(state.tr.setSelection(prosemirror_state.TextSelection.between($cell, moveCellForward($cell))).scrollIntoView());
		}
		return true;
	};
}
/**
* Deletes the table around the selection, if any.
*
* @public
*/
function deleteTable(state, dispatch) {
	const $pos = state.selection.$anchor;
	for (let d = $pos.depth; d > 0; d--) if ($pos.node(d).type.spec.tableRole == "table") {
		if (dispatch) dispatch(state.tr.delete($pos.before(d), $pos.after(d)).scrollIntoView());
		return true;
	}
	return false;
}
/**
* Deletes the content of the selected cells, if they are not empty.
*
* @public
*/
function deleteCellSelection(state, dispatch) {
	const sel = state.selection;
	if (!(sel instanceof CellSelection)) return false;
	if (dispatch) {
		const tr = state.tr;
		const baseContent = tableNodeTypes(state.schema).cell.createAndFill().content;
		sel.forEachCell((cell, pos) => {
			if (!cell.content.eq(baseContent)) tr.replace(tr.mapping.map(pos + 1), tr.mapping.map(pos + cell.nodeSize - 1), new prosemirror_model.Slice(baseContent, 0, 0));
		});
		if (tr.docChanged) dispatch(tr);
	}
	return true;
}
/**
* Move a table row from index `from` to index `to`.
*
* @public
*/
function moveTableRow(options) {
	return (state, dispatch) => {
		const { from: originIndex, to: targetIndex, select = true, pos = state.selection.from } = options;
		const tr = state.tr;
		if (moveRow({
			tr,
			originIndex,
			targetIndex,
			select,
			pos
		})) {
			dispatch === null || dispatch === void 0 || dispatch(tr);
			return true;
		}
		return false;
	};
}
/**
* Move a table column from index `from` to index `to`.
*
* @public
*/
function moveTableColumn(options) {
	return (state, dispatch) => {
		const { from: originIndex, to: targetIndex, select = true, pos = state.selection.from } = options;
		const tr = state.tr;
		if (moveColumn({
			tr,
			originIndex,
			targetIndex,
			select,
			pos
		})) {
			dispatch === null || dispatch === void 0 || dispatch(tr);
			return true;
		}
		return false;
	};
}

//#endregion
//#region src/copypaste.ts
/**
* Get a rectangular area of cells from a slice, or null if the outer
* nodes of the slice aren't table cells or rows.
*
* @internal
*/
function pastedCells(slice) {
	if (slice.size === 0) return null;
	let { content, openStart, openEnd } = slice;
	while (content.childCount == 1 && (openStart > 0 && openEnd > 0 || content.child(0).type.spec.tableRole == "table")) {
		openStart--;
		openEnd--;
		content = content.child(0).content;
	}
	const first = content.child(0);
	const role = first.type.spec.tableRole;
	const schema = first.type.schema, rows = [];
	if (role == "row") for (let i = 0; i < content.childCount; i++) {
		let cells = content.child(i).content;
		const left = i ? 0 : Math.max(0, openStart - 1);
		const right = i < content.childCount - 1 ? 0 : Math.max(0, openEnd - 1);
		if (left || right) cells = fitSlice(tableNodeTypes(schema).row, new prosemirror_model.Slice(cells, left, right)).content;
		rows.push(cells);
	}
	else if (role == "cell" || role == "header_cell") rows.push(openStart || openEnd ? fitSlice(tableNodeTypes(schema).row, new prosemirror_model.Slice(content, openStart, openEnd)).content : content);
	else return null;
	return ensureRectangular(schema, rows);
}
function ensureRectangular(schema, rows) {
	const widths = [];
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		for (let j = row.childCount - 1; j >= 0; j--) {
			const { rowspan, colspan } = row.child(j).attrs;
			for (let r = i; r < i + rowspan; r++) widths[r] = (widths[r] || 0) + colspan;
		}
	}
	let width = 0;
	for (let r = 0; r < widths.length; r++) width = Math.max(width, widths[r]);
	for (let r = 0; r < widths.length; r++) {
		if (r >= rows.length) rows.push(prosemirror_model.Fragment.empty);
		if (widths[r] < width) {
			const empty = tableNodeTypes(schema).cell.createAndFill();
			const cells = [];
			for (let i = widths[r]; i < width; i++) cells.push(empty);
			rows[r] = rows[r].append(prosemirror_model.Fragment.from(cells));
		}
	}
	return {
		height: rows.length,
		width,
		rows
	};
}
function fitSlice(nodeType, slice) {
	const node = nodeType.createAndFill();
	return new prosemirror_transform.Transform(node).replace(0, node.content.size, slice).doc;
}
/**
* Clip or extend (repeat) the given set of cells to cover the given
* width and height. Will clip rowspan/colspan cells at the edges when
* they stick out.
*
* @internal
*/
function clipCells({ width, height, rows }, newWidth, newHeight) {
	if (width != newWidth) {
		const added = [];
		const newRows = [];
		for (let row = 0; row < rows.length; row++) {
			const frag = rows[row], cells = [];
			for (let col = added[row] || 0, i = 0; col < newWidth; i++) {
				let cell = frag.child(i % frag.childCount);
				if (col + cell.attrs.colspan > newWidth) cell = cell.type.createChecked(removeColSpan(cell.attrs, cell.attrs.colspan, col + cell.attrs.colspan - newWidth), cell.content);
				cells.push(cell);
				col += cell.attrs.colspan;
				for (let j = 1; j < cell.attrs.rowspan; j++) added[row + j] = (added[row + j] || 0) + cell.attrs.colspan;
			}
			newRows.push(prosemirror_model.Fragment.from(cells));
		}
		rows = newRows;
		width = newWidth;
	}
	if (height != newHeight) {
		const newRows = [];
		for (let row = 0, i = 0; row < newHeight; row++, i++) {
			const cells = [], source = rows[i % height];
			for (let j = 0; j < source.childCount; j++) {
				let cell = source.child(j);
				if (row + cell.attrs.rowspan > newHeight) cell = cell.type.create({
					...cell.attrs,
					rowspan: Math.max(1, newHeight - cell.attrs.rowspan)
				}, cell.content);
				cells.push(cell);
			}
			newRows.push(prosemirror_model.Fragment.from(cells));
		}
		rows = newRows;
		height = newHeight;
	}
	return {
		width,
		height,
		rows
	};
}
function growTable(tr, map, table, start, width, height, mapFrom) {
	const schema = tr.doc.type.schema;
	const types = tableNodeTypes(schema);
	let empty;
	let emptyHead;
	if (width > map.width) for (let row = 0, rowEnd = 0; row < map.height; row++) {
		const rowNode = table.child(row);
		rowEnd += rowNode.nodeSize;
		const cells = [];
		let add;
		if (rowNode.lastChild == null || rowNode.lastChild.type == types.cell) add = empty || (empty = types.cell.createAndFill());
		else add = emptyHead || (emptyHead = types.header_cell.createAndFill());
		for (let i = map.width; i < width; i++) cells.push(add);
		tr.insert(tr.mapping.slice(mapFrom).map(rowEnd - 1 + start), cells);
	}
	if (height > map.height) {
		const cells = [];
		for (let i = 0, start$1 = (map.height - 1) * map.width; i < Math.max(map.width, width); i++) {
			const header = i >= map.width ? false : table.nodeAt(map.map[start$1 + i]).type == types.header_cell;
			cells.push(header ? emptyHead || (emptyHead = types.header_cell.createAndFill()) : empty || (empty = types.cell.createAndFill()));
		}
		const emptyRow = types.row.create(null, prosemirror_model.Fragment.from(cells)), rows = [];
		for (let i = map.height; i < height; i++) rows.push(emptyRow);
		tr.insert(tr.mapping.slice(mapFrom).map(start + table.nodeSize - 2), rows);
	}
	return !!(empty || emptyHead);
}
function isolateHorizontal(tr, map, table, start, left, right, top, mapFrom) {
	if (top == 0 || top == map.height) return false;
	let found = false;
	for (let col = left; col < right; col++) {
		const index = top * map.width + col, pos = map.map[index];
		if (map.map[index - map.width] == pos) {
			found = true;
			const cell = table.nodeAt(pos);
			const { top: cellTop, left: cellLeft } = map.findCell(pos);
			tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + start), null, {
				...cell.attrs,
				rowspan: top - cellTop
			});
			tr.insert(tr.mapping.slice(mapFrom).map(map.positionAt(top, cellLeft, table)), cell.type.createAndFill({
				...cell.attrs,
				rowspan: cellTop + cell.attrs.rowspan - top
			}));
			col += cell.attrs.colspan - 1;
		}
	}
	return found;
}
function isolateVertical(tr, map, table, start, top, bottom, left, mapFrom) {
	if (left == 0 || left == map.width) return false;
	let found = false;
	for (let row = top; row < bottom; row++) {
		const index = row * map.width + left, pos = map.map[index];
		if (map.map[index - 1] == pos) {
			found = true;
			const cell = table.nodeAt(pos);
			const cellLeft = map.colCount(pos);
			const updatePos = tr.mapping.slice(mapFrom).map(pos + start);
			tr.setNodeMarkup(updatePos, null, removeColSpan(cell.attrs, left - cellLeft, cell.attrs.colspan - (left - cellLeft)));
			tr.insert(updatePos + cell.nodeSize, cell.type.createAndFill(removeColSpan(cell.attrs, 0, left - cellLeft)));
			row += cell.attrs.rowspan - 1;
		}
	}
	return found;
}
/**
* Insert the given set of cells (as returned by `pastedCells`) into a
* table, at the position pointed at by rect.
*
* @internal
*/
function insertCells(state, dispatch, tableStart, rect, cells) {
	let table = tableStart ? state.doc.nodeAt(tableStart - 1) : state.doc;
	if (!table) throw new Error("No table found");
	let map = TableMap.get(table);
	const { top, left } = rect;
	const right = left + cells.width, bottom = top + cells.height;
	const tr = state.tr;
	let mapFrom = 0;
	function recomp() {
		table = tableStart ? tr.doc.nodeAt(tableStart - 1) : tr.doc;
		if (!table) throw new Error("No table found");
		map = TableMap.get(table);
		mapFrom = tr.mapping.maps.length;
	}
	if (growTable(tr, map, table, tableStart, right, bottom, mapFrom)) recomp();
	if (isolateHorizontal(tr, map, table, tableStart, left, right, top, mapFrom)) recomp();
	if (isolateHorizontal(tr, map, table, tableStart, left, right, bottom, mapFrom)) recomp();
	if (isolateVertical(tr, map, table, tableStart, top, bottom, left, mapFrom)) recomp();
	if (isolateVertical(tr, map, table, tableStart, top, bottom, right, mapFrom)) recomp();
	for (let row = top; row < bottom; row++) {
		const from = map.positionAt(row, left, table), to = map.positionAt(row, right, table);
		tr.replace(tr.mapping.slice(mapFrom).map(from + tableStart), tr.mapping.slice(mapFrom).map(to + tableStart), new prosemirror_model.Slice(cells.rows[row - top], 0, 0));
	}
	recomp();
	tr.setSelection(new CellSelection(tr.doc.resolve(tableStart + map.positionAt(top, left, table)), tr.doc.resolve(tableStart + map.positionAt(bottom - 1, right - 1, table))));
	dispatch(tr);
}

//#endregion
//#region src/input.ts
const handleKeyDown = (0, prosemirror_keymap.keydownHandler)({
	ArrowLeft: arrow("horiz", -1),
	ArrowRight: arrow("horiz", 1),
	ArrowUp: arrow("vert", -1),
	ArrowDown: arrow("vert", 1),
	"Shift-ArrowLeft": shiftArrow("horiz", -1),
	"Shift-ArrowRight": shiftArrow("horiz", 1),
	"Shift-ArrowUp": shiftArrow("vert", -1),
	"Shift-ArrowDown": shiftArrow("vert", 1),
	Backspace: deleteCellSelection,
	"Mod-Backspace": deleteCellSelection,
	Delete: deleteCellSelection,
	"Mod-Delete": deleteCellSelection
});
function maybeSetSelection(state, dispatch, selection) {
	if (selection.eq(state.selection)) return false;
	if (dispatch) dispatch(state.tr.setSelection(selection).scrollIntoView());
	return true;
}
/**
* @internal
*/
function arrow(axis, dir) {
	return (state, dispatch, view) => {
		if (!view) return false;
		const sel = state.selection;
		if (sel instanceof CellSelection) return maybeSetSelection(state, dispatch, prosemirror_state.Selection.near(sel.$headCell, dir));
		if (axis != "horiz" && !sel.empty) return false;
		const end = atEndOfCell(view, axis, dir);
		if (end == null) return false;
		if (axis == "horiz") return maybeSetSelection(state, dispatch, prosemirror_state.Selection.near(state.doc.resolve(sel.head + dir), dir));
		else {
			const $cell = state.doc.resolve(end);
			const $next = nextCell($cell, axis, dir);
			let newSel;
			if ($next) newSel = prosemirror_state.Selection.near($next, 1);
			else if (dir < 0) newSel = prosemirror_state.Selection.near(state.doc.resolve($cell.before(-1)), -1);
			else newSel = prosemirror_state.Selection.near(state.doc.resolve($cell.after(-1)), 1);
			return maybeSetSelection(state, dispatch, newSel);
		}
	};
}
function shiftArrow(axis, dir) {
	return (state, dispatch, view) => {
		if (!view) return false;
		const sel = state.selection;
		let cellSel;
		if (sel instanceof CellSelection) cellSel = sel;
		else {
			const end = atEndOfCell(view, axis, dir);
			if (end == null) return false;
			cellSel = new CellSelection(state.doc.resolve(end));
		}
		const $head = nextCell(cellSel.$headCell, axis, dir);
		if (!$head) return false;
		return maybeSetSelection(state, dispatch, new CellSelection(cellSel.$anchorCell, $head));
	};
}
function handleTripleClick(view, pos) {
	const doc = view.state.doc, $cell = cellAround(doc.resolve(pos));
	if (!$cell) return false;
	view.dispatch(view.state.tr.setSelection(new CellSelection($cell)));
	return true;
}
/**
* @public
*/
function handlePaste(view, _, slice) {
	if (!isInTable(view.state)) return false;
	let cells = pastedCells(slice);
	const sel = view.state.selection;
	if (sel instanceof CellSelection) {
		if (!cells) cells = {
			width: 1,
			height: 1,
			rows: [prosemirror_model.Fragment.from(fitSlice(tableNodeTypes(view.state.schema).cell, slice))]
		};
		const table = sel.$anchorCell.node(-1);
		const start = sel.$anchorCell.start(-1);
		const rect = TableMap.get(table).rectBetween(sel.$anchorCell.pos - start, sel.$headCell.pos - start);
		cells = clipCells(cells, rect.right - rect.left, rect.bottom - rect.top);
		insertCells(view.state, view.dispatch, start, rect, cells);
		return true;
	} else if (cells) {
		const $cell = selectionCell(view.state);
		const start = $cell.start(-1);
		insertCells(view.state, view.dispatch, start, TableMap.get($cell.node(-1)).findCell($cell.pos - start), cells);
		return true;
	} else return false;
}
function handleMouseDown$1(view, startEvent) {
	var _cellUnderMouse;
	if (startEvent.button != 0) return;
	if (startEvent.ctrlKey || startEvent.metaKey) return;
	const startDOMCell = domInCell(view, startEvent.target);
	let $anchor;
	if (startEvent.shiftKey && view.state.selection instanceof CellSelection) {
		setCellSelection(view.state.selection.$anchorCell, startEvent);
		startEvent.preventDefault();
	} else if (startEvent.shiftKey && startDOMCell && ($anchor = cellAround(view.state.selection.$anchor)) != null && ((_cellUnderMouse = cellUnderMouse(view, startEvent)) === null || _cellUnderMouse === void 0 ? void 0 : _cellUnderMouse.pos) != $anchor.pos) {
		setCellSelection($anchor, startEvent);
		startEvent.preventDefault();
	} else if (!startDOMCell) return;
	function setCellSelection($anchor$1, event) {
		let $head = cellUnderMouse(view, event);
		const starting = tableEditingKey.getState(view.state) == null;
		if (!$head || !inSameTable($anchor$1, $head)) if (starting) $head = $anchor$1;
		else return;
		const selection = new CellSelection($anchor$1, $head);
		if (starting || !view.state.selection.eq(selection)) {
			const tr = view.state.tr.setSelection(selection);
			if (starting) tr.setMeta(tableEditingKey, $anchor$1.pos);
			view.dispatch(tr);
		}
	}
	function stop() {
		view.root.removeEventListener("mouseup", stop);
		view.root.removeEventListener("dragstart", stop);
		view.root.removeEventListener("mousemove", move);
		if (tableEditingKey.getState(view.state) != null) view.dispatch(view.state.tr.setMeta(tableEditingKey, -1));
	}
	function move(_event) {
		const event = _event;
		const anchor = tableEditingKey.getState(view.state);
		let $anchor$1;
		if (anchor != null) $anchor$1 = view.state.doc.resolve(anchor);
		else if (domInCell(view, event.target) != startDOMCell) {
			$anchor$1 = cellUnderMouse(view, startEvent);
			if (!$anchor$1) return stop();
		}
		if ($anchor$1) setCellSelection($anchor$1, event);
	}
	view.root.addEventListener("mouseup", stop);
	view.root.addEventListener("dragstart", stop);
	view.root.addEventListener("mousemove", move);
}
function atEndOfCell(view, axis, dir) {
	if (!(view.state.selection instanceof prosemirror_state.TextSelection)) return null;
	const { $head } = view.state.selection;
	for (let d = $head.depth - 1; d >= 0; d--) {
		const parent = $head.node(d);
		if ((dir < 0 ? $head.index(d) : $head.indexAfter(d)) != (dir < 0 ? 0 : parent.childCount)) return null;
		if (parent.type.spec.tableRole == "cell" || parent.type.spec.tableRole == "header_cell") {
			const cellPos = $head.before(d);
			const dirStr = axis == "vert" ? dir > 0 ? "down" : "up" : dir > 0 ? "right" : "left";
			return view.endOfTextblock(dirStr) ? cellPos : null;
		}
	}
	return null;
}
function domInCell(view, dom) {
	for (; dom && dom != view.dom; dom = dom.parentNode) if (dom.nodeName == "TD" || dom.nodeName == "TH") return dom;
	return null;
}
function cellUnderMouse(view, event) {
	const mousePos = view.posAtCoords({
		left: event.clientX,
		top: event.clientY
	});
	if (!mousePos) return null;
	let { inside, pos } = mousePos;
	return inside >= 0 && cellAround(view.state.doc.resolve(inside)) || cellAround(view.state.doc.resolve(pos));
}

//#endregion
//#region src/tableview.ts
/**
* @public
*/
var TableView = class {
	constructor(node, defaultCellMinWidth) {
		this.node = node;
		this.defaultCellMinWidth = defaultCellMinWidth;
		this.dom = document.createElement("div");
		this.dom.className = "tableWrapper";
		this.table = this.dom.appendChild(document.createElement("table"));
		this.table.style.setProperty("--default-cell-min-width", `${defaultCellMinWidth}px`);
		this.colgroup = this.table.appendChild(document.createElement("colgroup"));
		updateColumnsOnResize(node, this.colgroup, this.table, defaultCellMinWidth);
		this.contentDOM = this.table.appendChild(document.createElement("tbody"));
	}
	update(node) {
		if (node.type != this.node.type) return false;
		this.node = node;
		updateColumnsOnResize(node, this.colgroup, this.table, this.defaultCellMinWidth);
		return true;
	}
	ignoreMutation(record) {
		return record.type == "attributes" && (record.target == this.table || this.colgroup.contains(record.target));
	}
};
/**
* @public
*/
function updateColumnsOnResize(node, colgroup, table, defaultCellMinWidth, overrideCol, overrideValue) {
	let totalWidth = 0;
	let fixedWidth = true;
	let nextDOM = colgroup.firstChild;
	const row = node.firstChild;
	if (!row) return;
	for (let i = 0, col = 0; i < row.childCount; i++) {
		const { colspan, colwidth } = row.child(i).attrs;
		for (let j = 0; j < colspan; j++, col++) {
			const hasWidth = overrideCol == col ? overrideValue : colwidth && colwidth[j];
			const cssWidth = hasWidth ? hasWidth + "px" : "";
			totalWidth += hasWidth || defaultCellMinWidth;
			if (!hasWidth) fixedWidth = false;
			if (!nextDOM) {
				const col$1 = document.createElement("col");
				col$1.style.width = cssWidth;
				colgroup.appendChild(col$1);
			} else {
				if (nextDOM.style.width != cssWidth) nextDOM.style.width = cssWidth;
				nextDOM = nextDOM.nextSibling;
			}
		}
	}
	while (nextDOM) {
		var _nextDOM$parentNode;
		const after = nextDOM.nextSibling;
		(_nextDOM$parentNode = nextDOM.parentNode) === null || _nextDOM$parentNode === void 0 || _nextDOM$parentNode.removeChild(nextDOM);
		nextDOM = after;
	}
	if (fixedWidth) {
		table.style.width = totalWidth + "px";
		table.style.minWidth = "";
	} else {
		table.style.width = "";
		table.style.minWidth = totalWidth + "px";
	}
}

//#endregion
//#region src/columnresizing.ts
/**
* @public
*/
const columnResizingPluginKey = new prosemirror_state.PluginKey("tableColumnResizing");
/**
* @public
*/
function columnResizing({ handleWidth = 5, cellMinWidth = 25, defaultCellMinWidth = 100, View = TableView, lastColumnResizable = true } = {}) {
	const plugin = new prosemirror_state.Plugin({
		key: columnResizingPluginKey,
		state: {
			init(_, state) {
				var _plugin$spec;
				const nodeViews = (_plugin$spec = plugin.spec) === null || _plugin$spec === void 0 || (_plugin$spec = _plugin$spec.props) === null || _plugin$spec === void 0 ? void 0 : _plugin$spec.nodeViews;
				const tableName = tableNodeTypes(state.schema).table.name;
				if (View && nodeViews) nodeViews[tableName] = (node, view) => {
					return new View(node, defaultCellMinWidth, view);
				};
				return new ResizeState(-1, false);
			},
			apply(tr, prev) {
				return prev.apply(tr);
			}
		},
		props: {
			attributes: (state) => {
				const pluginState = columnResizingPluginKey.getState(state);
				return pluginState && pluginState.activeHandle > -1 ? { class: "resize-cursor" } : {};
			},
			handleDOMEvents: {
				mousemove: (view, event) => {
					handleMouseMove(view, event, handleWidth, lastColumnResizable);
				},
				mouseleave: (view) => {
					handleMouseLeave(view);
				},
				mousedown: (view, event) => {
					handleMouseDown(view, event, cellMinWidth, defaultCellMinWidth);
				}
			},
			decorations: (state) => {
				const pluginState = columnResizingPluginKey.getState(state);
				if (pluginState && pluginState.activeHandle > -1) return handleDecorations(state, pluginState.activeHandle);
			},
			nodeViews: {}
		}
	});
	return plugin;
}
/**
* @public
*/
var ResizeState = class ResizeState {
	constructor(activeHandle, dragging) {
		this.activeHandle = activeHandle;
		this.dragging = dragging;
	}
	apply(tr) {
		const state = this;
		const action = tr.getMeta(columnResizingPluginKey);
		if (action && action.setHandle != null) return new ResizeState(action.setHandle, false);
		if (action && action.setDragging !== void 0) return new ResizeState(state.activeHandle, action.setDragging);
		if (state.activeHandle > -1 && tr.docChanged) {
			let handle = tr.mapping.map(state.activeHandle, -1);
			if (!pointsAtCell(tr.doc.resolve(handle))) handle = -1;
			return new ResizeState(handle, state.dragging);
		}
		return state;
	}
};
function handleMouseMove(view, event, handleWidth, lastColumnResizable) {
	if (!view.editable) return;
	const pluginState = columnResizingPluginKey.getState(view.state);
	if (!pluginState) return;
	if (!pluginState.dragging) {
		const target = domCellAround(event.target);
		let cell = -1;
		if (target) {
			const { left, right } = target.getBoundingClientRect();
			if (event.clientX - left <= handleWidth) cell = edgeCell(view, event, "left", handleWidth);
			else if (right - event.clientX <= handleWidth) cell = edgeCell(view, event, "right", handleWidth);
		}
		if (cell != pluginState.activeHandle) {
			if (!lastColumnResizable && cell !== -1) {
				const $cell = view.state.doc.resolve(cell);
				const table = $cell.node(-1);
				const map = TableMap.get(table);
				const tableStart = $cell.start(-1);
				if (map.colCount($cell.pos - tableStart) + $cell.nodeAfter.attrs.colspan - 1 == map.width - 1) return;
			}
			updateHandle(view, cell);
		}
	}
}
function handleMouseLeave(view) {
	if (!view.editable) return;
	const pluginState = columnResizingPluginKey.getState(view.state);
	if (pluginState && pluginState.activeHandle > -1 && !pluginState.dragging) updateHandle(view, -1);
}
function handleMouseDown(view, event, cellMinWidth, defaultCellMinWidth) {
	var _view$dom$ownerDocume;
	if (!view.editable) return false;
	const win = (_view$dom$ownerDocume = view.dom.ownerDocument.defaultView) !== null && _view$dom$ownerDocume !== void 0 ? _view$dom$ownerDocume : window;
	const pluginState = columnResizingPluginKey.getState(view.state);
	if (!pluginState || pluginState.activeHandle == -1 || pluginState.dragging) return false;
	const cell = view.state.doc.nodeAt(pluginState.activeHandle);
	const width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
	view.dispatch(view.state.tr.setMeta(columnResizingPluginKey, { setDragging: {
		startX: event.clientX,
		startWidth: width
	} }));
	function finish(event$1) {
		win.removeEventListener("mouseup", finish);
		win.removeEventListener("mousemove", move);
		const pluginState$1 = columnResizingPluginKey.getState(view.state);
		if (pluginState$1 === null || pluginState$1 === void 0 ? void 0 : pluginState$1.dragging) {
			updateColumnWidth(view, pluginState$1.activeHandle, draggedWidth(pluginState$1.dragging, event$1, cellMinWidth));
			view.dispatch(view.state.tr.setMeta(columnResizingPluginKey, { setDragging: null }));
		}
	}
	function move(event$1) {
		if (!event$1.which) return finish(event$1);
		const pluginState$1 = columnResizingPluginKey.getState(view.state);
		if (!pluginState$1) return;
		if (pluginState$1.dragging) {
			const dragged = draggedWidth(pluginState$1.dragging, event$1, cellMinWidth);
			displayColumnWidth(view, pluginState$1.activeHandle, dragged, defaultCellMinWidth);
		}
	}
	displayColumnWidth(view, pluginState.activeHandle, width, defaultCellMinWidth);
	win.addEventListener("mouseup", finish);
	win.addEventListener("mousemove", move);
	event.preventDefault();
	return true;
}
function currentColWidth(view, cellPos, { colspan, colwidth }) {
	const width = colwidth && colwidth[colwidth.length - 1];
	if (width) return width;
	const dom = view.domAtPos(cellPos);
	let domWidth = dom.node.childNodes[dom.offset].offsetWidth, parts = colspan;
	if (colwidth) {
		for (let i = 0; i < colspan; i++) if (colwidth[i]) {
			domWidth -= colwidth[i];
			parts--;
		}
	}
	return domWidth / parts;
}
function domCellAround(target) {
	while (target && target.nodeName != "TD" && target.nodeName != "TH") target = target.classList && target.classList.contains("ProseMirror") ? null : target.parentNode;
	return target;
}
function edgeCell(view, event, side, handleWidth) {
	const offset = side == "right" ? -handleWidth : handleWidth;
	const found = view.posAtCoords({
		left: event.clientX + offset,
		top: event.clientY
	});
	if (!found) return -1;
	const { pos } = found;
	const $cell = cellAround(view.state.doc.resolve(pos));
	if (!$cell) return -1;
	if (side == "right") return $cell.pos;
	const map = TableMap.get($cell.node(-1)), start = $cell.start(-1);
	const index = map.map.indexOf($cell.pos - start);
	return index % map.width == 0 ? -1 : start + map.map[index - 1];
}
function draggedWidth(dragging, event, resizeMinWidth) {
	const offset = event.clientX - dragging.startX;
	return Math.max(resizeMinWidth, dragging.startWidth + offset);
}
function updateHandle(view, value) {
	view.dispatch(view.state.tr.setMeta(columnResizingPluginKey, { setHandle: value }));
}
function updateColumnWidth(view, cell, width) {
	const $cell = view.state.doc.resolve(cell);
	const table = $cell.node(-1), map = TableMap.get(table), start = $cell.start(-1);
	const col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
	const tr = view.state.tr;
	for (let row = 0; row < map.height; row++) {
		const mapIndex = row * map.width + col;
		if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) continue;
		const pos = map.map[mapIndex];
		const attrs = table.nodeAt(pos).attrs;
		const index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
		if (attrs.colwidth && attrs.colwidth[index] == width) continue;
		const colwidth = attrs.colwidth ? attrs.colwidth.slice() : zeroes(attrs.colspan);
		colwidth[index] = width;
		tr.setNodeMarkup(start + pos, null, {
			...attrs,
			colwidth
		});
	}
	if (tr.docChanged) view.dispatch(tr);
}
function displayColumnWidth(view, cell, width, defaultCellMinWidth) {
	const $cell = view.state.doc.resolve(cell);
	const table = $cell.node(-1), start = $cell.start(-1);
	const col = TableMap.get(table).colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
	let dom = view.domAtPos($cell.start(-1)).node;
	while (dom && dom.nodeName != "TABLE") dom = dom.parentNode;
	if (!dom) return;
	updateColumnsOnResize(table, dom.firstChild, dom, defaultCellMinWidth, col, width);
}
function zeroes(n) {
	return Array(n).fill(0);
}
function handleDecorations(state, cell) {
	const decorations = [];
	const $cell = state.doc.resolve(cell);
	const table = $cell.node(-1);
	if (!table) return prosemirror_view.DecorationSet.empty;
	const map = TableMap.get(table);
	const start = $cell.start(-1);
	const col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
	for (let row = 0; row < map.height; row++) {
		const index = col + row * map.width;
		if ((col == map.width - 1 || map.map[index] != map.map[index + 1]) && (row == 0 || map.map[index] != map.map[index - map.width])) {
			var _columnResizingPlugin;
			const cellPos = map.map[index];
			const pos = start + cellPos + table.nodeAt(cellPos).nodeSize - 1;
			const dom = document.createElement("div");
			dom.className = "column-resize-handle";
			if ((_columnResizingPlugin = columnResizingPluginKey.getState(state)) === null || _columnResizingPlugin === void 0 ? void 0 : _columnResizingPlugin.dragging) decorations.push(prosemirror_view.Decoration.node(start + cellPos, start + cellPos + table.nodeAt(cellPos).nodeSize, { class: "column-resize-dragging" }));
			decorations.push(prosemirror_view.Decoration.widget(pos, dom));
		}
	}
	return prosemirror_view.DecorationSet.create(state.doc, decorations);
}

//#endregion
//#region src/index.ts
/**
* Creates a [plugin](http://prosemirror.net/docs/ref/#state.Plugin)
* that, when added to an editor, enables cell-selection, handles
* cell-based copy/paste, and makes sure tables stay well-formed (each
* row has the same width, and cells don't overlap).
*
* You should probably put this plugin near the end of your array of
* plugins, since it handles mouse and arrow key events in tables
* rather broadly, and other plugins, like the gap cursor or the
* column-width dragging plugin, might want to get a turn first to
* perform more specific behavior.
*
* @public
*/
function tableEditing({ allowTableNodeSelection = false } = {}) {
	return new prosemirror_state.Plugin({
		key: tableEditingKey,
		state: {
			init() {
				return null;
			},
			apply(tr, cur) {
				const set = tr.getMeta(tableEditingKey);
				if (set != null) return set == -1 ? null : set;
				if (cur == null || !tr.docChanged) return cur;
				const { deleted, pos } = tr.mapping.mapResult(cur);
				return deleted ? null : pos;
			}
		},
		props: {
			decorations: drawCellSelection,
			handleDOMEvents: { mousedown: handleMouseDown$1 },
			createSelectionBetween(view) {
				return tableEditingKey.getState(view.state) != null ? view.state.selection : null;
			},
			handleTripleClick,
			handleKeyDown,
			handlePaste
		},
		appendTransaction(_, oldState, state) {
			return normalizeSelection(state, fixTables(state, oldState), allowTableNodeSelection);
		}
	});
}

//#endregion
exports.CellBookmark = CellBookmark;
exports.CellSelection = CellSelection;
exports.ResizeState = ResizeState;
exports.TableMap = TableMap;
exports.TableView = TableView;
exports.__clipCells = clipCells;
exports.__insertCells = insertCells;
exports.__pastedCells = pastedCells;
exports.addColSpan = addColSpan;
exports.addColumn = addColumn;
exports.addColumnAfter = addColumnAfter;
exports.addColumnBefore = addColumnBefore;
exports.addRow = addRow;
exports.addRowAfter = addRowAfter;
exports.addRowBefore = addRowBefore;
exports.cellAround = cellAround;
exports.cellNear = cellNear;
exports.colCount = colCount;
exports.columnIsHeader = columnIsHeader;
exports.columnResizing = columnResizing;
exports.columnResizingPluginKey = columnResizingPluginKey;
exports.deleteCellSelection = deleteCellSelection;
exports.deleteColumn = deleteColumn;
exports.deleteRow = deleteRow;
exports.deleteTable = deleteTable;
exports.findCell = findCell;
exports.findCellPos = findCellPos;
exports.findCellRange = findCellRange;
exports.findTable = findTable;
exports.fixTables = fixTables;
exports.fixTablesKey = fixTablesKey;
exports.goToNextCell = goToNextCell;
exports.handlePaste = handlePaste;
exports.inSameTable = inSameTable;
exports.isInTable = isInTable;
exports.mergeCells = mergeCells;
exports.moveCellForward = moveCellForward;
exports.moveTableColumn = moveTableColumn;
exports.moveTableRow = moveTableRow;
exports.nextCell = nextCell;
exports.pointsAtCell = pointsAtCell;
exports.removeColSpan = removeColSpan;
exports.removeColumn = removeColumn;
exports.removeRow = removeRow;
exports.rowIsHeader = rowIsHeader;
exports.selectedRect = selectedRect;
exports.selectionCell = selectionCell;
exports.setCellAttr = setCellAttr;
exports.splitCell = splitCell;
exports.splitCellWithType = splitCellWithType;
exports.tableEditing = tableEditing;
exports.tableEditingKey = tableEditingKey;
exports.tableNodeTypes = tableNodeTypes;
exports.tableNodes = tableNodes;
exports.toggleHeader = toggleHeader;
exports.toggleHeaderCell = toggleHeaderCell;
exports.toggleHeaderColumn = toggleHeaderColumn;
exports.toggleHeaderRow = toggleHeaderRow;
exports.updateColumnsOnResize = updateColumnsOnResize;