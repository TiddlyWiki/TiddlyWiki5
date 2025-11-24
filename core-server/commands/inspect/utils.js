/*\
title: $:/core/modules/commands/inspect/utils.js
type: application/javascript
module-type: library

\*/

"use strict";

const path = require("path");
const os = require("os");

// Threshold for showing function signatures in completions
exports.SIGNATURE_THRESHOLD = 50;

// Path to REPL history file
exports.REPL_HISTORY_PATH = path.join(os.homedir(), ".tiddlywiki_repl_history");

// Max lines of source text in object output
exports.MAX_SOURCE_LINES = 10; 

// Initial inspection depth
exports.INITIAL_INSPECT_DEPTH = 1;

// Terminal colours
exports.colour = {
	log: (txt="", fg=255, bg=0, efg=255, ebg=0) => process.stdout.write(
		`\x1b[38;5;${fg};48;5;${bg}m${txt}\x1b[38;5;${efg};48;5;${ebg}m`),

	txt: (txt="", fg=255, bg=0, efg=255, ebg=0) => `\x1b[38;5;${fg};48;5;${bg}m${txt}\x1b[38;5;${efg};48;5;${ebg}m`,
};

// Helper to get a function's parameters as a string
exports.getFunctionSignature = function(func) {
	const funcString = func.toString();
	const signatureMatch = funcString.match(/(?:async\s+)?function\s*\*?\s*[^(]*\(([^)]*)\)/) ||
						funcString.match(/^\(([^)]*)\)\s*=>/) ||
						funcString.match(/^([^=()]+)=>/);
	if(signatureMatch) {
		return signatureMatch[1] ? signatureMatch[1].trim() : "";
	}
	return null;
}
