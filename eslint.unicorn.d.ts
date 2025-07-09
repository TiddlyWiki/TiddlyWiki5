import {Linter} from "eslint";
type RuleValue = Linter.RuleEntry;
declare module "eslint" {
	namespace Linter {
		interface RulesRecord {
			/**  🔧
			- Improve regexes by making them shorter, consistent, and safer. */
			"unicorn/better-regex": RuleValue;
			/** ✅ 🔧
			- Enforce a specific parameter name in catch clauses. */
			"unicorn/catch-error-name": RuleValue;
			/** ✅ 🔧
			- Enforce consistent assertion style with node:assert. */
			"unicorn/consistent-assert": RuleValue;
			/** ✅ 🔧
			- Prefer passing Date directly to the constructor when cloning. */
			"unicorn/consistent-date-clone": RuleValue;
			/**  🔧 💡
			- Use destructured variables over properties. */
			"unicorn/consistent-destructuring": RuleValue;
			/** ✅ 🔧
			- Prefer consistent types when spreading a ternary in an array literal. */
			"unicorn/consistent-empty-array-spread": RuleValue;
			/** ✅ 🔧
			- Enforce consistent style for element existence checks with indexOf(), lastIndexOf(), findIndex(), and findLastIndex(). */
			"unicorn/consistent-existence-index-check": RuleValue;
			/** ✅
			- Move function definitions to the highest possible scope. */
			"unicorn/consistent-function-scoping": RuleValue;
			/**  🔧
			- Enforce correct Error subclassing. */
			"unicorn/custom-error-definition": RuleValue;
			/** ✅ 🔧
			- Enforce no spaces between braces. */
			"unicorn/empty-brace-spaces": RuleValue;
			/** ✅
			- Enforce passing a message value when creating a built-in error. */
			"unicorn/error-message": RuleValue;
			/** ✅ 🔧
			- Require escape sequences to use uppercase or lowercase values. */
			"unicorn/escape-case": RuleValue;
			/** ✅
			- Add expiration conditions to TODO comments. */
			"unicorn/expiring-todo-comments": RuleValue;
			/** ✅ 🔧 💡
			- Enforce explicitly comparing the length or size property of a value. */
			"unicorn/explicit-length-check": RuleValue;
			/** ✅
			- Enforce a case style for filenames. */
			"unicorn/filename-case": RuleValue;
			/** ✅
			- Enforce specific import styles per module. */
			"unicorn/import-style": RuleValue;
			/** ✅ 🔧 💡
			- Enforce the use of new for all builtins, except String, Number, Boolean, Symbol and BigInt. */
			"unicorn/new-for-builtins": RuleValue;
			/** ✅
			- Enforce specifying rules to disable in eslint-disable comments. */
			"unicorn/no-abusive-eslint-disable": RuleValue;
			/** ✅
			- Disallow recursive access to this within getters and setters. */
			"unicorn/no-accessor-recursion": RuleValue;
			/** ✅  💡
			- Disallow anonymous functions and classes as the default export. */
			"unicorn/no-anonymous-default-export": RuleValue;
			/** ✅  💡
			- Prevent passing a function reference directly to iterator methods. */
			"unicorn/no-array-callback-reference": RuleValue;
			/** ✅ 🔧 💡
			- Prefer for…of over the forEach method. */
			"unicorn/no-array-for-each": RuleValue;
			/** ✅ 🔧 💡
			- Disallow using the this argument in array methods. */
			"unicorn/no-array-method-this-argument": RuleValue;
			/** ✅
			- Disallow Array#reduce() and Array#reduceRight(). */
			"unicorn/no-array-reduce": RuleValue;
			/** ✅ 🔧
			- Disallow member access from await expression. */
			"unicorn/no-await-expression-member": RuleValue;
			/** ✅  💡
			- Disallow using await in Promise method parameters. */
			"unicorn/no-await-in-promise-methods": RuleValue;
			/** ✅ 🔧
			- Do not use leading/trailing space between console.log parameters. */
			"unicorn/no-console-spaces": RuleValue;
			/** ✅
			- Do not use document.cookie directly. */
			"unicorn/no-document-cookie": RuleValue;
			/** ✅
			- Disallow empty files. */
			"unicorn/no-empty-file": RuleValue;
			/** ✅ 🔧 💡
			- Do not use a for loop that can be replaced with a for-of loop. */
			"unicorn/no-for-loop": RuleValue;
			/** ✅ 🔧
			- Enforce the use of Unicode escapes instead of hexadecimal escapes. */
			"unicorn/no-hex-escape": RuleValue;
			/** ✅ 🔧 💡
			- Disallow instanceof with built-in objects */
			"unicorn/no-instanceof-builtins": RuleValue;
			/** ✅
			- Disallow invalid options in fetch() and new Request(). */
			"unicorn/no-invalid-fetch-options": RuleValue;
			/** ✅
			- Prevent calling EventTarget#removeEventListener() with the result of an expression. */
			"unicorn/no-invalid-remove-event-listener": RuleValue;
			/**
			- Disallow identifiers starting with new or class. */
			"unicorn/no-keyword-prefix": RuleValue;
			/** ✅ 🔧
			- Disallow if statements as the only statement in if blocks without else. */
			"unicorn/no-lonely-if": RuleValue;
			/** ✅
			- Disallow a magic number as the depth argument in Array#flat(…). */
			"unicorn/no-magic-array-flat-depth": RuleValue;
			/** ✅ 🔧
			- Disallow named usage of default import and export. */
			"unicorn/no-named-default": RuleValue;
			/** ✅ 🔧
			- Disallow negated conditions. */
			"unicorn/no-negated-condition": RuleValue;
			/** ✅  💡
			- Disallow negated expression in equality check. */
			"unicorn/no-negation-in-equality-check": RuleValue;
			/** ✅ 🔧
			- Disallow nested ternary expressions. */
			"unicorn/no-nested-ternary": RuleValue;
			/** ✅ 🔧 💡
			- Disallow new Array(). */
			"unicorn/no-new-array": RuleValue;
			/** ✅ 🔧 💡
			- Enforce the use of Buffer.from() and Buffer.alloc() instead of the deprecated new Buffer(). */
			"unicorn/no-new-buffer": RuleValue;
			/** ✅ 🔧 💡
			- Disallow the use of the null literal. */
			"unicorn/no-null": RuleValue;
			/** ✅
			- Disallow the use of objects as default parameters. */
			"unicorn/no-object-as-default-parameter": RuleValue;
			/** ✅
			- Disallow process.exit(). */
			"unicorn/no-process-exit": RuleValue;
			/** ✅ 🔧 💡
			- Disallow passing single-element arrays to Promise methods. */
			"unicorn/no-single-promise-in-promise-methods": RuleValue;
			/** ✅ 🔧
			- Disallow classes that only have static members. */
			"unicorn/no-static-only-class": RuleValue;
			/** ✅
			- Disallow then property. */
			"unicorn/no-thenable": RuleValue;
			/** ✅
			- Disallow assigning this to a variable. */
			"unicorn/no-this-assignment": RuleValue;
			/** ✅ 🔧 💡
			- Disallow comparing undefined using typeof. */
			"unicorn/no-typeof-undefined": RuleValue;
			/** ✅ 🔧
			- Disallow using 1 as the depth argument of Array#flat(). */
			"unicorn/no-unnecessary-array-flat-depth": RuleValue;
			/** ✅ 🔧
			- Disallow using .length or Infinity as the deleteCount or skipCount argument of Array#{splice,toSpliced}(). */
			"unicorn/no-unnecessary-array-splice-count": RuleValue;
			/** ✅ 🔧
			- Disallow awaiting non-promise values. */
			"unicorn/no-unnecessary-await": RuleValue;
			/** ✅
			- Enforce the use of built-in methods instead of unnecessary polyfills. */
			"unicorn/no-unnecessary-polyfills": RuleValue;
			/** ✅ 🔧
			- Disallow using .length or Infinity as the end argument of {Array,String,TypedArray}#slice(). */
			"unicorn/no-unnecessary-slice-end": RuleValue;
			/** ✅ 🔧
			- Disallow unreadable array destructuring. */
			"unicorn/no-unreadable-array-destructuring": RuleValue;
			/** ✅
			- Disallow unreadable IIFEs. */
			"unicorn/no-unreadable-iife": RuleValue;
			/**
			- Disallow unused object properties. */
			"unicorn/no-unused-properties": RuleValue;
			/** ✅ 🔧
			- Disallow useless fallback when spreading in object literals. */
			"unicorn/no-useless-fallback-in-spread": RuleValue;
			/** ✅ 🔧
			- Disallow useless array length check. */
			"unicorn/no-useless-length-check": RuleValue;
			/** ✅ 🔧
			- Disallow returning/yielding Promise.resolve/reject() in async functions or promise callbacks */
			"unicorn/no-useless-promise-resolve-reject": RuleValue;
			/** ✅ 🔧
			- Disallow unnecessary spread. */
			"unicorn/no-useless-spread": RuleValue;
			/** ✅  💡
			- Disallow useless case in switch statements. */
			"unicorn/no-useless-switch-case": RuleValue;
			/** ✅ 🔧
			- Disallow useless undefined. */
			"unicorn/no-useless-undefined": RuleValue;
			/** ✅ 🔧
			- Disallow number literals with zero fractions or dangling dots. */
			"unicorn/no-zero-fractions": RuleValue;
			/** ✅ 🔧
			- Enforce proper case for numeric literals. */
			"unicorn/number-literal-case": RuleValue;
			/** ✅ 🔧
			- Enforce the style of numeric separators by correctly grouping digits. */
			"unicorn/numeric-separators-style": RuleValue;
			/** ✅ 🔧
			- Prefer .addEventListener() and .removeEventListener() over on-functions. */
			"unicorn/prefer-add-event-listener": RuleValue;
			/** ✅ 🔧 💡
			- Prefer .find(…) and .findLast(…) over the first or last element from .filter(…). */
			"unicorn/prefer-array-find": RuleValue;
			/** ✅ 🔧
			- Prefer Array#flat() over legacy techniques to flatten arrays. */
			"unicorn/prefer-array-flat": RuleValue;
			/** ✅ 🔧
			- Prefer .flatMap(…) over .map(…).flat(). */
			"unicorn/prefer-array-flat-map": RuleValue;
			/** ✅ 🔧 💡
			- Prefer Array#{indexOf,lastIndexOf}() over Array#{findIndex,findLastIndex}() when looking for the index of an item. */
			"unicorn/prefer-array-index-of": RuleValue;
			/** ✅ 🔧 💡
			- Prefer .some(…) over .filter(…).length check and .{find,findLast,findIndex,findLastIndex}(…). */
			"unicorn/prefer-array-some": RuleValue;
			/** ✅ 🔧 💡
			- Prefer .at() method for index access and String#charAt(). */
			"unicorn/prefer-at": RuleValue;
			/** ✅
			- Prefer Blob#arrayBuffer() over FileReader#readAsArrayBuffer(…) and Blob#text() over FileReader#readAsText(…). */
			"unicorn/prefer-blob-reading-methods": RuleValue;
			/** ✅  💡
			- Prefer String#codePointAt(…) over String#charCodeAt(…) and String.fromCodePoint(…) over String.fromCharCode(…). */
			"unicorn/prefer-code-point": RuleValue;
			/** ✅ 🔧
			- Prefer Date.now() to get the number of milliseconds since the Unix Epoch. */
			"unicorn/prefer-date-now": RuleValue;
			/** ✅ 🔧 💡
			- Prefer default parameters over reassignment. */
			"unicorn/prefer-default-parameters": RuleValue;
			/** ✅ 🔧
			- Prefer Node#append() over Node#appendChild(). */
			"unicorn/prefer-dom-node-append": RuleValue;
			/** ✅ 🔧
			- Prefer using .dataset on DOM elements over calling attribute methods. */
			"unicorn/prefer-dom-node-dataset": RuleValue;
			/** ✅ 🔧 💡
			- Prefer childNode.remove() over parentNode.removeChild(childNode). */
			"unicorn/prefer-dom-node-remove": RuleValue;
			/** ✅  💡
			- Prefer .textContent over .innerText. */
			"unicorn/prefer-dom-node-text-content": RuleValue;
			/** ✅
			- Prefer EventTarget over EventEmitter. */
			"unicorn/prefer-event-target": RuleValue;
			/** ✅ 🔧 💡
			- Prefer export…from when re-exporting. */
			"unicorn/prefer-export-from": RuleValue;
			/** ✅ 🔧
			- Prefer globalThis over window, self, and global. */
			"unicorn/prefer-global-this": RuleValue;
			/**  🔧
			- Prefer import.meta.{dirname,filename} over legacy techniques for getting file paths. */
			"unicorn/prefer-import-meta-properties": RuleValue;
			/** ✅ 🔧 💡
			- Prefer .includes() over .indexOf(), .lastIndexOf(), and Array#some() when checking for existence or non-existence. */
			"unicorn/prefer-includes": RuleValue;
			/**  🔧
			- Prefer reading a JSON file as a buffer. */
			"unicorn/prefer-json-parse-buffer": RuleValue;
			/** ✅ 🔧
			- Prefer KeyboardEvent#key over KeyboardEvent#keyCode. */
			"unicorn/prefer-keyboard-event-key": RuleValue;
			/** ✅  💡
			- Prefer using a logical operator over a ternary. */
			"unicorn/prefer-logical-operator-over-ternary": RuleValue;
			/** ✅ 🔧
			- Prefer Math.min() and Math.max() over ternaries for simple comparisons. */
			"unicorn/prefer-math-min-max": RuleValue;
			/** ✅ 🔧 💡
			- Enforce the use of Math.trunc instead of bitwise operators. */
			"unicorn/prefer-math-trunc": RuleValue;
			/** ✅ 🔧
			- Prefer .before() over .insertBefore(), .replaceWith() over .replaceChild(), prefer one of .before(), .after(), .append() or .prepend() over insertAdjacentText() and insertAdjacentElement(). */
			"unicorn/prefer-modern-dom-apis": RuleValue;
			/** ✅ 🔧
			- Prefer modern Math APIs over legacy patterns. */
			"unicorn/prefer-modern-math-apis": RuleValue;
			/** ✅ 🔧 💡
			- Prefer JavaScript modules (ESM) over CommonJS. */
			"unicorn/prefer-module": RuleValue;
			/** ✅ 🔧
			- Prefer using String, Number, BigInt, Boolean, and Symbol directly. */
			"unicorn/prefer-native-coercion-functions": RuleValue;
			/** ✅ 🔧
			- Prefer negative index over .length - index when possible. */
			"unicorn/prefer-negative-index": RuleValue;
			/** ✅ 🔧
			- Prefer using the node: protocol when importing Node.js builtin modules. */
			"unicorn/prefer-node-protocol": RuleValue;
			/** ✅ 🔧 💡
			- Prefer Number static properties over global ones. */
			"unicorn/prefer-number-properties": RuleValue;
			/** ✅ 🔧
			- Prefer using Object.fromEntries(…) to transform a list of key-value pairs into an object. */
			"unicorn/prefer-object-from-entries": RuleValue;
			/** ✅ 🔧
			- Prefer omitting the catch binding parameter. */
			"unicorn/prefer-optional-catch-binding": RuleValue;
			/** ✅ 🔧
			- Prefer borrowing methods from the prototype instead of the instance. */
			"unicorn/prefer-prototype-methods": RuleValue;
			/** ✅ 🔧
			- Prefer .querySelector() over .getElementById(), .querySelectorAll() over .getElementsByClassName() and .getElementsByTagName() and .getElementsByName(). */
			"unicorn/prefer-query-selector": RuleValue;
			/** ✅ 🔧
			- Prefer Reflect.apply() over Function#apply(). */
			"unicorn/prefer-reflect-apply": RuleValue;
			/** ✅ 🔧 💡
			- Prefer RegExp#test() over String#match() and RegExp#exec(). */
			"unicorn/prefer-regexp-test": RuleValue;
			/** ✅ 🔧 💡
			- Prefer Set#has() over Array#includes() when checking for existence or non-existence. */
			"unicorn/prefer-set-has": RuleValue;
			/** ✅ 🔧
			- Prefer using Set#size instead of Array#length. */
			"unicorn/prefer-set-size": RuleValue;
			/** ✅ 🔧 💡
			- Enforce combining multiple Array#push(), Element#classList.{add,remove}(), and importScripts() into one call. */
			"unicorn/prefer-single-call": RuleValue;
			/** ✅ 🔧 💡
			- Prefer the spread operator over Array.from(…), Array#concat(…), Array#{slice,toSpliced}() and String#split(''). */
			"unicorn/prefer-spread": RuleValue;
			/** ✅ 🔧
			- Prefer using the String.raw tag to avoid escaping \. */
			"unicorn/prefer-string-raw": RuleValue;
			/** ✅ 🔧
			- Prefer String#replaceAll() over regex searches with the global flag. */
			"unicorn/prefer-string-replace-all": RuleValue;
			/** ✅ 🔧
			- Prefer String#slice() over String#substr() and String#substring(). */
			"unicorn/prefer-string-slice": RuleValue;
			/** ✅ 🔧 💡
			- Prefer String#startsWith() & String#endsWith() over RegExp#test(). */
			"unicorn/prefer-string-starts-ends-with": RuleValue;
			/** ✅ 🔧
			- Prefer String#trimStart() / String#trimEnd() over String#trimLeft() / String#trimRight(). */
			"unicorn/prefer-string-trim-start-end": RuleValue;
			/** ✅  💡
			- Prefer using structuredClone to create a deep clone. */
			"unicorn/prefer-structured-clone": RuleValue;
			/** ✅ 🔧
			- Prefer switch over multiple else-if. */
			"unicorn/prefer-switch": RuleValue;
			/** ✅ 🔧
			- Prefer ternary expressions over simple if-else statements. */
			"unicorn/prefer-ternary": RuleValue;
			/** ✅  💡
			- Prefer top-level await over top-level promises and async function calls. */
			"unicorn/prefer-top-level-await": RuleValue;
			/** ✅ 🔧
			- Enforce throwing TypeError in type checking conditions. */
			"unicorn/prefer-type-error": RuleValue;
			/** ✅ 🔧
			- Prevent abbreviations. */
			"unicorn/prevent-abbreviations": RuleValue;
			/** ✅ 🔧 💡
			- Enforce consistent relative URL style. */
			"unicorn/relative-url-style": RuleValue;
			/** ✅ 🔧
			- Enforce using the separator argument with Array#join(). */
			"unicorn/require-array-join-separator": RuleValue;
			/** ✅ 🔧
			- Enforce using the digits argument with Number#toFixed(). */
			"unicorn/require-number-to-fixed-digits-argument": RuleValue;
			/**   💡
			- Enforce using the targetOrigin argument with window.postMessage(). */
			"unicorn/require-post-message-target-origin": RuleValue;
			/**  🔧 💡
			- Enforce better string content. */
			"unicorn/string-content": RuleValue;
			/** ✅ 🔧
			- Enforce consistent brace style for case clauses. */
			"unicorn/switch-case-braces": RuleValue;
			/** ✅ 🔧
			- Fix whitespace-insensitive template indentation. */
			"unicorn/template-indent": RuleValue;
			/** ✅ 🔧 💡
			- Enforce consistent case for text encoding identifiers. */
			"unicorn/text-encoding-identifier-case": RuleValue;
			/** ✅ 🔧
			- Require new when creating an error. */
			"unicorn/throw-new-error": RuleValue;
		}
	}
}
