/*\
title: $:/core/modules/commands/inspect/output.js
type: application/javascript
module-type: library

\*/

"use strict";

const util = require("util");
const{ getFunctionSignature, colour, MAX_SOURCE_LINES } = require("$:/core/modules/commands/inspect/utils.js");

// utils.inspect: Custom inspect function
class CustomFunctionInspect {
	constructor(val, depth, colour_ref) {
		this.val = val;
		this.depth = depth;
		this.colour = colour_ref;
	}

	[util.inspect.custom](depth, opts) {
		const keys = Object.keys(this.val);
		if(this.depth === 0 && keys.length === 0) {
			// Top-level function with no properties, show code
			let code = this.val.toString();
			if(code.split("\n").length > 30) {
				code = code.split("\n").slice(0,10).join("\n") + "\n...";
			}
			return code;
		} else {
			// Nested function, or function with properties, show signature
			const signatureParams = getFunctionSignature(this.val);
			let signature = `function ${this.val.name || ""}(${signatureParams || ""})`;
			// Apply light gray color
			signature = this.colour.txt(signature, 69, 0, 255, 0);

			let s = signature;

			if(keys.length > 0) {
				const props = {};
				const newOpts = Object.assign({}, opts, { depth: opts.depth === null ? null : opts.depth - 1 });
				if(opts.depth !== null && opts.depth <= 0) {
					s += " [Object]";
				} else {
					for(const key of keys) {
						props[key] = this.val[key];
					}
					s += " " + util.inspect(props, newOpts);
				}
			}
			return s;
		}
	}
}

// REPL: Custom output processing
exports.processOutput = function(obj, maxLines = MAX_SOURCE_LINES) {
	if(maxLines === 0) {
		return obj;
	}
	const seen = new WeakMap();

	function walk(o, depth) {
		if(o === null || (typeof o !== "object" && typeof o !== "function")) {
			if(typeof o === "string") {
				const lines = o.split("\n");
				if(lines.length > maxLines) {
					return lines.slice(0, maxLines).join("\n") + `\n... (${lines.length - maxLines} more lines)`;
				}
			}
			return o;
		}

		// Likely an Error-like object / o instanceof Error was not detected
		// Only show the important parts
		if(Object.prototype.toString.call(o) === "[object Error]") {
			return {
				message: o.message,
				stack: o.stack
			};
		}

		if(seen.has(o)) {
			return seen.get(o);
		}

		if(typeof o === "function") {
			const wrapped = new CustomFunctionInspect(o, depth, colour);
			seen.set(o, wrapped);
			return wrapped;
		}

		if(Array.isArray(o)) {
			const newArr = [];
			seen.set(o, newArr);
			for(let i = 0; i < o.length; i++) {
				newArr[i] = walk(o[i], depth + 1);
			}
			return newArr;
		}

		const newObj = {};
		seen.set(o, newObj);

		let allProperties = [];
		let currentObj = o;

		do {
			allProperties = allProperties.concat(Object.getOwnPropertyNames(currentObj));
		} while((currentObj = Object.getPrototypeOf(currentObj)));

		// Remove duplicates
		const properties = [...new Set(allProperties)];

		const propertiesToFilter = [
			"constructor",
			"hasOwnProperty",
			"isPrototypeOf",
			"propertyIsEnumerable",
			"toString",
			"valueOf",
			"toLocaleString"
		];

		// Filter out internal and Object.prototype properties
		const filteredProperties = properties.filter(p => !p.startsWith("__") && propertiesToFilter.indexOf(p) === -1);
		for(const key of filteredProperties) {
			try {
				// Accessing properties can throw errors (e.g., getters)
				newObj[key] = walk(o[key], depth + 1);
			} catch (e) {
				newObj[key] = `[Error: ${e.message}]`;
			}
		}
		return newObj;
	}
	return walk(obj, 0);
}
