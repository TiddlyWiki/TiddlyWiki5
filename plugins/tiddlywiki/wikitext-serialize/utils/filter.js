/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/utils/filter.js
type: application/javascript
module-type: utils

Filter parse tree serialization utility functions.

Serializes the output of $tw.wiki.parseFilter() back into a filter string.

Why this fits in one file: the filter AST has a uniform, flat schema —
every node follows the same shape (run → operators → operands), unlike
the wikitext AST where each rule creates entirely different node structures.

The filter parser preserves CST (Concrete Syntax Tree) information in the
`titleQuote` property on shorthand title operators so that the original
quote style can be round-tripped:
  - `titleQuote: "double"` → "My Title"
  - `titleQuote: "single"` → 'My Title'
  - `titleQuote: "none"`   → MyTitle  (unquoted)
  - absent / undefined     → [title[My Title]]  (explicit bracket form)

\*/

"use strict";

/*
Serialize a single filter operand back to its bracket string.
*/
const serializeOperand = (operand) => {
	if(operand.indirect) return `{${operand.text}}`;
	if(operand.variable) return `<${operand.text}>`;
	if(operand.multiValuedVariable) return `(${operand.text})`;
	return `[${operand.text}]`;
};

/*
Serialize a single filter operator (name + optional suffix + operands) to string.
When the operator is a shorthand title (`titleQuote` present), emit the original
quoting style instead of the canonical bracket form.
*/
const serializeOperator = (operator) => {
	// Shorthand title syntax: restore original quote style
	if(operator.titleQuote !== undefined && operator.operator === "title" && operator.operands.length === 1 && !operator.prefix) {
		const text = operator.operands[0].text;
		switch(operator.titleQuote) {
			case "double": return `"${text}"`;
			case "single": return `'${text}'`;
			case "none":   return text;
		}
	}
	// Deprecated regexp operand /pattern/(flags) — operator.regexp is a compiled RegExp
	if(operator.regexp) {
		const flagsPart = operator.regexp.flags ? `(${operator.regexp.flags})` : "";
		return `${operator.prefix || ""}${operator.operator}/${operator.regexp.source}/${flagsPart}`;
	}
	// Operator negation prefix ("!"), name, optional raw suffix
	let result = `${operator.prefix || ""}${operator.operator}`;
	if(operator.suffix) {
		result += `:${operator.suffix}`;
	}
	// Operands, comma-separated from the second one onwards
	operator.operands.forEach((operand, index) => {
		if(index > 0) result += ",";
		result += serializeOperand(operand);
	});
	return result;
};

/*
Serialize a filter parse tree (as returned by $tw.wiki.parseFilter()) back to a
filter string.

Options:
  maxRunsPerLine {number} - if set, insert a newline + indent after every N runs
                            (useful for formatting long filters). Default: unlimited.
  indent {string}         - indentation string used when wrapping. Default: "  ".
  wrapAt {number}         - if set, wrap at approximately this column width by
                            inserting a newline before the next run that would exceed
                            it. Default: unlimited.
*/
exports.serializeFilterParseTree = function serializeFilterParseTree(tree, options) {
	if(!$tw.utils.isArray(tree)) return "";

	options = options || {};
	const indent = options.indent !== undefined ? options.indent : "  ";
	const maxRunsPerLine = options.maxRunsPerLine || 0;
	const wrapAt = options.wrapAt || 0;

	// Skip empty operations (e.g. produced by empty quoted titles "" / '' which
	// parseFilter ignores rather than pushing into results).
	const runs = tree
		.filter(operation => operation.operators.length > 0)
		.map((operation) => {
			// Reconstruct the run prefix: named (:filter, :reduce:flat…) or symbolic (+, -, ~, =, =>)
			let prefix = "";
			if(operation.namedPrefix) {
				prefix = `:${operation.namedPrefix}`;
				if(operation.suffixes) {
					operation.suffixes.forEach((subsuffix) => {
						prefix += `:${subsuffix.join(",")}`;
					});
				}
			} else if(operation.prefix) {
				prefix = operation.prefix;
			}

			// Shorthand title operators are serialized without brackets
			const isTitleShorthand = operation.operators.length === 1 &&
				operation.operators[0].titleQuote !== undefined &&
				operation.operators[0].operator === "title" &&
				!operation.operators[0].prefix &&
				operation.operators[0].operands.length === 1;
			if(isTitleShorthand) {
				return prefix + serializeOperator(operation.operators[0]);
			}

			const operatorsStr = operation.operators.map(serializeOperator).join("");
			return `${prefix}[${operatorsStr}]`;
		});

	// Simple join if no wrapping requested
	if(!maxRunsPerLine && !wrapAt) {
		return runs.join(" ");
	}

	// Apply wrapping: the inter-run space separator is replaced by newline + indent
	// when wrapping is needed. No trailing space is left on the wrapped line.
	let output = "";
	let lineLen = 0;
	let runsOnLine = 0;
	runs.forEach((run, index) => {
		const needsWrap = index > 0 &&
			((maxRunsPerLine && runsOnLine >= maxRunsPerLine) ||
			 (wrapAt && lineLen + 1 + run.length > wrapAt));
		if(needsWrap) {
			output += "\n" + indent + run;
			lineLen = indent.length + run.length;
			runsOnLine = 1;
		} else {
			if(index > 0) output += " ";
			output += run;
			lineLen += (index > 0 ? 1 : 0) + run.length;
			runsOnLine++;
		}
	});
	return output;
};
