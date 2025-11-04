/*\
title: $:/core/modules/commands/sandbox.js
type: application/javascript
module-type: command

node.js REPL with access to $tw

Optional params = REPL prompt

\*/

"use strict";

const path = require("path");
const os = require("os");

// Threshold for showing function signatures in completions
const SIGNATURE_THRESHOLD = 50;

// Path to REPL history file
const REPL_HISTORY_PATH = path.join(os.homedir(), ".tiddlywiki_repl_history");

// Terminal colours
const colour = {
	log: (txt="", fg=255, bg=0, efg=255, ebg=0) => process.stdout.write(
		`\x1b[38;5;${fg};48;5;${bg}m${txt}\x1b[38;5;${efg};48;5;${ebg}m`),

	txt: (txt="", fg=255, bg=0, efg=255, ebg=0) =>
		`\x1b[38;5;${fg};48;5;${bg}m${txt}\x1b[38;5;${efg};48;5;${ebg}m`,
}

exports.info = {
	name: "inspect",
	synchronous: true
};

var Command = function(params,commander,callback) {
	var self = this;
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;

	const repl = require("repl");
	const util = require("util");

	// Helper to get a function's parameters as a string
	function getFunctionSignature(func) {
		const funcString = func.toString();
		const signatureMatch = funcString.match(/(?:async\s+)?function\s*\*?\s*[^(]*\(([^)]*)\)/) ||
							funcString.match(/^\(([^)]*)\)\s*=>/) ||
							funcString.match(/^([^=()]+)=>/);
		if (signatureMatch) {
			return signatureMatch[1] ? signatureMatch[1].trim() : "";
		}
		return null;
	}

	function truncateLongText(obj, maxLines = 10) {
		const seen = new WeakMap();

		function truncate(value) {
			if (typeof value === "string") {
				const lines = value.split("\n");
				if (lines.length > maxLines) {
					return lines.slice(0, maxLines).join("\n") + `\n... (${lines.length - maxLines} more lines)`;
				}
			}
			return value;
		}

		function walk(o) {
			if (o === null || typeof o !== "object") {
				return truncate(o);
			}
			if (seen.has(o)) {
				return seen.get(o);
			}
			if (Array.isArray(o)) {
				const newArr = [];
				seen.set(o, newArr);
				for (let i = 0; i < o.length; i++) {
					newArr[i] = walk(o[i]);
				}
				return newArr;
			}
			const newObj = {};
			seen.set(o, newObj);
			for (const key in o) {
				if (Object.prototype.hasOwnProperty.call(o, key)) {
					newObj[key] = walk(o[key]);
				}
			}
			return newObj;
		}
		return walk(obj);
	}

    // Custom writer to control output depth
    function customWriter(output) {
        return util.inspect(truncateLongText(output), {
            colors: true,
            depth: 2 // Only one level deep
        });
    }

	// Custom completer to provide property and method name completions
	function completer(line) {
		if (!self.runtime || !self.runtime.context) {
			return [[], line];
		}
		const context = self.runtime.context;
		let hits = [];
		try {
			const parts = line.split(".");
			const partial = parts.pop() || "";
			const path = parts.join(".");
			let obj = context;
			if (path) {
				obj = path.split(".").reduce((o, p) => o && o[p], context);
			}
			if (obj === undefined || obj === null) {
				return [[], line];
			}
			let allProperties = [];
			let currentObj = obj;
			do {
				allProperties = allProperties.concat(Object.getOwnPropertyNames(currentObj));
			} while ((currentObj = Object.getPrototypeOf(currentObj)));
			const properties = [...new Set(allProperties)];
			const filteredProperties = properties.filter(p => !p.startsWith("__"));
			const matchingProperties = filteredProperties.filter(p => p.startsWith(partial));

			// Special case: if there's a single exact match for a function, complete its signature
			if (matchingProperties.length === 1 && matchingProperties[0] === partial) {
				const propName = matchingProperties[0];
				const target = obj[propName];
				if (typeof target === "function") {
					const signature = getFunctionSignature(target);
					if (signature !== null) {
						hits.push(`${line}(${signature})`);
						return [hits, line];
					}
				}
			}

			// If we have a small number of matches, show signatures for functions
			if (matchingProperties.length > 0 && matchingProperties.length < SIGNATURE_THRESHOLD) {
				hits = matchingProperties.map(propName => {
					const target = obj[propName];
					const prefix = (path ? path + "." : "");
					if (typeof target === "function") {
						const signature = getFunctionSignature(target);
						if (signature !== null) {
							return prefix + `${propName}(${signature})`;
						}
					}
					// For non-functions, just return the name
					return prefix + propName;
				});
			} else {
				// Otherwise, just show the property names
				hits = matchingProperties.map(p => (path ? path + "." : "") + p);
			}
		} catch (e) {
		}
		return [hits, line];
	}

	// Start the REPL
	this.runtime = repl.start({
		prompt: this.params.length ? colour.txt(this.params[0],33,0,7,0) : colour.txt("$command: > ",33,0,7,0),
		useColors: true,
		ignoreUndefined: true,
		completer: completer,
		writer: customWriter
	});

	// Initialie History Setup
	this.runtime.setupHistory({
		filePath: REPL_HISTORY_PATH,
		size: 200,
		removeHistoryDuplicates: true
	}, (err) => {
		if (err) {
			console.error("Error setting up REPL history:", err);
		}
	});

	// Define .history command
	this.runtime.defineCommand("history", {
		help: "Use '.history' or '.history path'",
		action(input) {
			const trimmed = input.trim().toLowerCase();

			if (trimmed === "info") {
				this.outputStream.write(`History file can be found at: ${REPL_HISTORY_PATH}\n`);
				this.displayPrompt();
			} else {
				// Default behavior: list history
				const filteredHistory = [];
				const seenCommands = new Set();

				if (this.history) {
					for (const cmd of this.history) {
						const trimmedCmd = cmd.trim();
						if (trimmedCmd.length >= 3 && !seenCommands.has(trimmedCmd)) {
							filteredHistory.push(trimmedCmd);
							seenCommands.add(trimmedCmd);
						}
					}
				}

				if (filteredHistory.length > 0) {
					filteredHistory.forEach((cmd, index) => {
						console.log(`[${index + 1}] - ${cmd}`);
					});
				} else {
					console.log("No history available.");
				}
				this.displayPrompt(); // Show the prompt again after listing history
			}
		}
	});

	// On reset, restore $tw in the context
	this.runtime.on("reset", function() {
		self.runtime.context.$tw = $tw;
	});

	this.runtime.context.$tw = $tw;

	return null;
};

exports.Command = Command;
