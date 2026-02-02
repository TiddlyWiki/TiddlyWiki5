/*\
title: $:/core/modules/filters/substitute.js
type: application/javascript
module-type: filteroperator

Filter operator for substituting variables and embedded filter expressions with their corresponding values

\*/

/* Export our filter function */

exports.substitute = function(source, operator, options) {
	const results = [];

	const hasMultiValueOperands = operator.multiValueOperands.some(operand => Array.isArray(operand) && operand.length !== 1);

	if(!hasMultiValueOperands) {
		// We use the original simple substitution without list processing for speed
		const operands = [];
		$tw.utils.each(operator.operands, function(operand, index) {
			operands.push({
				name: (index + 1).toString(),
				value: operand
			});
		});
		source(function(tiddler, title) {
			if(title) {
				results.push(options.wiki.getSubstitutedText(title, options.widget, {substitutions: operands}));
			}
		});
		return results;
	}

	// We collect all input titles
	let inputTitles = [];
	source((tiddler, title) => {
		if(title) {
			inputTitles.push(title);
		}
	});

	// Without input titles, we return empty results
	if(inputTitles.length === 0) {
		return results;
	}

	// We parse the operands and track their length
	const parsedOperands = operator.multiValueOperands.map((list, index) => ({
		index: index + 1,
		list,
		length: list.length
	}));

	// We calculate maxLength for expansion of singular items
	const maxLength = Math.max(inputTitles.length, ...parsedOperands.map(operand => operand.length));

	// We expand any singular and empty operands to maxLength
	parsedOperands.forEach(operand => {
		if(operand.length === 0 && maxLength > 0) {
			// Empty operand: fill with empty strings
			operand.list = Array(maxLength).fill("");
			operand.length = maxLength;
		} else if(operand.length === 1 && maxLength > 1) {
			// Single-value operand: repeat the value
			operand.list = Array(maxLength).fill(operand.list[0]);
			operand.length = maxLength;
		}
	});

	// We expand a singular input to maxLength
	if(inputTitles.length === 1 && maxLength > 1) {
		inputTitles = Array(maxLength).fill(inputTitles[0]);
	}

	// We validate that all lists have the same length after expansion
	const allSameLength = parsedOperands.every(operand => operand.length === maxLength);

	if(!allSameLength || inputTitles.length !== maxLength) {
		return ["substitute error: All parameter lists and input titles must have the same length or be singular."];
	}

	// Apply the ith input with the ith parameter values
	for(let i = 0; i < maxLength; i++) {
		const substitutions = parsedOperands.map(operand => ({
			name: operand.index.toString(),
			value: operand.list[i]
		}));

		results.push(options.wiki.getSubstitutedText(inputTitles[i], options.widget, {substitutions}));
	}

	return results;
};