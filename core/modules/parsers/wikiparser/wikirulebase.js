/*\
title: $:/core/modules/parsers/wikiparser/rules/wikirulebase.js
type: application/javascript
module-type: global

Base class for wiki parser rules

\*/

"use strict";

/**
 * @typedef {import('../base.js').ParseTreeNode} ParseTreeNode
 * @typedef {import('../base.js').ParseTreeAttribute} ParseTreeAttribute
 */

/**
 * Base class for all wiki parser rules.
 *
 * Individual rules extend this class by adding properties such as
 * `name`, `types`, `matchRegExp`, `init()`, and `parse()`.
 *
 * This constructor is always overridden with a blank constructor in subclasses
 * and so should not be used directly.
 *
 * @class
 */
function WikiRuleBase() {
}

/**
 * Rule name identifier, set by each rule module (e.g. `"codeblock"`, `"html"`).
 * @type {string}
 */
WikiRuleBase.prototype.name = "";

/**
 * Flags indicating which parsing context(s) the rule applies to.
 * @type {{ block?: boolean, inline?: boolean, pragma?: boolean }}
 */
WikiRuleBase.prototype.types = {};

/**
 * The regexp used to locate the next match in the source.
 * Must be set by each rule's `init()` method.
 * @type {RegExp}
 */
WikiRuleBase.prototype.matchRegExp = /(?!)/;

/**
 * The most recent regexp match result, set by `findNextMatch()`.
 * @type {RegExpExecArray | null}
 */
WikiRuleBase.prototype.match = null;

/**
 * Reference to the parent WikiParser instance.
 * @type {any} WikiParser — avoids circular import; import wikiparser.js directly for the full type
 */
WikiRuleBase.prototype.parser = /** @type {any} */ (null);

/**
 * Flags indicating which context this rule instance is operating in.
 * @type {{ block?: boolean, inline?: boolean, pragma?: boolean }}
 */
WikiRuleBase.prototype.is = {};

/**
 * Initialise the rule with the given parser instance.
 * Individual rules override this to set `this.matchRegExp` etc.
 *
 * @param {any} parser - The active WikiParser instance
 */
WikiRuleBase.prototype.init = function(parser) {
	this.parser = parser;
};

/**
 * Find the next position in the source where this rule matches,
 * starting from `startPos`. Returns `undefined` if no match is found.
 *
 * The default implementation uses `this.matchRegExp`. Rules that need
 * more complex look-ahead override this method.
 *
 * @param {number} startPos - Position to start searching from
 * @returns {number | undefined} Index of the next match, or `undefined`
 */
WikiRuleBase.prototype.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	return this.match ? this.match.index : undefined;
};

/**
 * Parse the most recent match and return an array of parse tree nodes.
 * Must be overridden by each rule.
 *
 * @returns {ParseTreeNode[]} Resulting parse tree nodes
 */
WikiRuleBase.prototype.parse = function() {
	return [];
};

exports.WikiRuleBase = WikiRuleBase;
