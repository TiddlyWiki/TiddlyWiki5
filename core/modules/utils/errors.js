/*\
title: $:/core/modules/utils/errors.js
type: application/javascript
module-type: utils

Custom errors for TiddlyWiki.

\*/

function TranscludeRecursionError() {
	Error.apply(this,arguments);
	this.signatures = Object.create(null);
};

/* Maximum permitted depth of the widget tree for recursion detection */
TranscludeRecursionError.MAX_WIDGET_TREE_DEPTH = 1000;

TranscludeRecursionError.prototype = Object.create(Error);

exports.TranscludeRecursionError = TranscludeRecursionError;

function RecoverableParseError(diagnostic,tree) {
	this.name = "RecoverableParseError";
	this.message = diagnostic && diagnostic.message || "Recoverable parse error";
	this.diagnostic = diagnostic || {};
	this.tree = tree;
};

RecoverableParseError.prototype = Object.create(Error.prototype);
RecoverableParseError.prototype.constructor = RecoverableParseError;

exports.RecoverableParseError = RecoverableParseError;
