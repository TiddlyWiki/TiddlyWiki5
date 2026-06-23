/*\
title: $:/core/modules/commands/inspect/completer.js
type: application/javascript
module-type: library

\*/

"use strict";

const { getFunctionSignature, colour, SIGNATURE_THRESHOLD } = require("$:/core/modules/commands/inspect/utils.js");

exports.createCompleter = function(commandInstance) {
	return function completer(line) {
		if(!commandInstance.runtime || !commandInstance.runtime.context) {
			return [[], line];
		}
		const context = commandInstance.runtime.context;
		let hits = [];
		try {
			const parts = line.split(".");
			const partial = parts.pop() || "";
			const path = parts.join(".");
			let obj = context;
			if(path) {
				obj = path.split(".").reduce((o, p) => o && o[p], context);
			}
			if(obj === undefined || obj === null) {
				return [[], line];
			}
			let allProperties = [];
			let currentObj = obj;

			do {
				allProperties = allProperties.concat(Object.getOwnPropertyNames(currentObj));
			} while((currentObj = Object.getPrototypeOf(currentObj)));

			const properties = [...new Set(allProperties)];
			const filteredProperties = properties.filter((p) => !p.startsWith("__"));
			const matchingProperties = filteredProperties.filter((p) => p.toLowerCase().startsWith(partial.toLowerCase()));

			// Special case: if the partial is an exact match for a property,
			// complete intelligently (append dot for objects, show signature for functions)
			if(partial && filteredProperties.indexOf(partial) !== -1) {
				const target = obj[partial];
				if(typeof target === "function") {
					const signature = getFunctionSignature(target);
					if(signature !== null) {
						const coloredSignature = colour.txt(`(${signature})`, 248, 0, 255, 0);
						hits.push(line + `(${signature})`);
						return [hits, line];
					}
				}
				// For objects, append a dot so the next TAB shows their properties
				if(target !== null && typeof target === "object") {
					hits.push(line + ".");
					return [hits, line];
				}
			}

			// If we have a small number of matches, show signatures for functions
			if(matchingProperties.length > 0 && matchingProperties.length < SIGNATURE_THRESHOLD) {
				hits = matchingProperties.map((propName) => {
					const target = obj[propName];
					const prefix = (path ? path + "." : "");
					if(typeof target === "function") {
						const signature = getFunctionSignature(target);
						if(signature !== null) {
							const coloredSignature = colour.txt(`(${signature})`, 248, 0, 255, 0);
							return prefix + propName + `(${signature})`;
						}
					}
					// For non-functions, just return the name
					return prefix + propName;
				});
			} else {
				// Otherwise, just show the property names
				hits = matchingProperties.map((p) => (path ? path + "." : "") + p);
			}
		} catch (e) {
		}
		return [hits, line];
	};
};
