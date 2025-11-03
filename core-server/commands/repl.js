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
	log: (txt='', fg=255, bg=0, efg=255, ebg=0) => process.stdout.write(
		`\x1b[38;5;${fg};48;5;${bg}m${txt}\x1b[38;5;${efg};48;5;${ebg}m`),

	txt: (txt='', fg=255, bg=0, efg=255, ebg=0) =>
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

	var repl = require('repl');

	function completer(line) {
		if (!self.runtime || !self.runtime.context) {
			return [[], line];
		}
		const context = self.runtime.context;
		let hits = [];
		try {
			const parts = line.split('.');
			const partial = parts.pop() || '';
			const path = parts.join('.');
			let obj = context;
			if (path) {
				obj = path.split('.').reduce((o, p) => o[p], context);
			}
			if (obj === undefined || obj === null) {
				return [[], line];
			}
			// Get all properties from the object and its prototype chain
			let allProperties = [];
			let currentObj = obj;
			do {
				allProperties = allProperties.concat(Object.getOwnPropertyNames(currentObj));
			} while ((currentObj = Object.getPrototypeOf(currentObj)));
			const properties = [...new Set(allProperties)]; // Remove duplicates

			const matchingProperties = properties.filter(p => p.startsWith(partial));
			if (matchingProperties.length === 1 && matchingProperties[0] === partial) {
				const fullProperty = matchingProperties[0];
				const target = obj[fullProperty];
				if (typeof target === 'function') {
					const funcString = target.toString();
					const signatureMatch = funcString.match(/(?:async\s+)?function\s*\*?\s*[^(]*\(([^)]*)\)/) || // function foo(a,b)
										 funcString.match(/^\(([^)]*)\)\s*=>/) || // (a,b) =>
										 funcString.match(/^([^=()]+)=>/); // a =>
					if (signatureMatch) {
						const params = signatureMatch[1] ? signatureMatch[1].trim() : "";
						hits.push(`${line}(${params})`);
						return [hits, line];
					}
				}
			}
			// Default completion
			hits = matchingProperties.map(p => (path ? path + '.' : '') + p);
		} catch (e) {
			// Suppress errors during completion
		}
		return [hits, line];
	}

	this.runtime = repl.start({
		prompt: this.params.length ? this.params[0] : colour.txt('$command: > ',33,0,7,0),
		useColors: true,
		ignoreUndefined: true,
		completer: completer
	});

	// If REPL is reset (.clear) - context needs resetting
	this.runtime.on('reset', function() {
		self.runtime.context.$tw = $tw;
	});

	// Initial context settings
	this.runtime.context.$tw = $tw;

	return null;
};

exports.Command = Command;
