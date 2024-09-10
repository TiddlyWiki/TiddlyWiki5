/**
 * @typedef {import('$:/core/modules/parsers/wikiparser/rules/codeblock.js').CodeblockNode} CodeblockNode
 */

/**
 * A function that processes a code block.
 * 
 * @param {CodeblockNode[]} codeblocks - An array of codeblock rules.
 */
function processCodeblocks(codeblocks) {
	codeblocks.forEach(function(cb) {
			console.log(cb.attributes.code.value);
	});
}
