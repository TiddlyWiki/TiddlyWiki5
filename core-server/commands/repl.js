/*\
title: $:/poc2go/modules/commands/repl.js
type: application/javascript
module-type: command

node.js REPL with access to $tw

Optional params = REPL prompt

\*/

"use strict";

// Terminal colours
const colour = {
	log: (txt="", fg=255, bg=0, efg=255, ebg=0) => process.stdout.write(
		`\x1b[38;5;${fg};48;5;${bg}m${txt}\x1b[38;5;${efg};48;5;${ebg}m`),

	txt: (txt="", fg=255, bg=0, efg=255, ebg=0) =>
		`\x1b[38;5;${fg};48;5;${bg}m${txt}\x1b[38;5;${efg};48;5;${ebg}m`,
}

exports.info = {
	name: "repl",
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

	var repl = require("repl");
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

    // Custom writer to control output depth
    function customWriter(output) {
        return util.inspect(output, {
            colors: true,
            depth: 1 // Only one level deep
        });
    }

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

			const SIGNATURE_THRESHOLD = 50;
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

	this.runtime = repl.start({
		prompt: this.params.length ? this.params[0] : colour.txt("$command: > ",33,0,7,0),
		useColors: true,
		ignoreUndefined: true,
		completer: completer,
		writer: customWriter
	});

	this.runtime.defineCommand("quit", {
		help: "Exit the REPL",
		action() {
			this.close();
		}
	});

	this.runtime.on("reset", function() {
		self.runtime.context.$tw = $tw;
	});

	this.runtime.context.$tw = $tw;

	return null;
};

exports.Command = Command;
