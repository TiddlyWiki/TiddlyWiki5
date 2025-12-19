/*\
title: $:/core/modules/filters/substitute.js
type: application/javascript
module-type: filteroperator

Filter operator for substituting variables and embedded filter expressions with their corresponding values

\*/

/* Export our filter function */

exports.substitute = function(source, operator, options) {
	const results = [];

	const hasMultiValueOperands = operator.isMultiValueOperand &&
		operator.isMultiValueOperand.some(value => value);

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

	// We parse the operands and track their length
	const parsedOperands = operator.multiValueOperands.map((list, index) => ({
		index: index + 1,
		list,
		length: list.length
	}));

	const maxLength = Math.max(...parsedOperands.map(operand => operand.length));

	// We expand single-items to maxLength
	parsedOperands.forEach(operand => {
		if(operand.length === 1 && maxLength > 1) {
			operand.list = Array(maxLength).fill(operand.list[0]);
			operand.length = maxLength;
		}
	});

	// We check that all lists have the same length
	const allSameLength = parsedOperands.every(operand => operand.length === maxLength);

	if(!allSameLength) {
		source((tiddler, title) => {
			if(title) {
				results.push("substitute error: All parameter lists must have the same length");
			}
		});
		return results;
	}

	source((tiddler, title) => {
		if(title) {
			// We generate one output for each list index
			for(let i = 0; i < maxLength; i++) {
				const substitutions = parsedOperands.map(operand => ({
					name: operand.index.toString(),
					value: operand.list[i]
				}));

				results.push(options.wiki.getSubstitutedText(title, options.widget, {substitutions}));
			}
		}
	});

	return results;
};