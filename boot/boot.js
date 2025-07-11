/*\
title: $:/boot/boot.js
type: application/javascript

The main boot kernel for TiddlyWiki. This single file creates a barebones TW environment that is just sufficient to bootstrap the modules containing the main logic of the application.

On the server this file is executed directly to boot TiddlyWiki. In the browser, this file is packed into a single HTML file.

\*/

const _boot = (function($tw) {

	/*jslint node: true, browser: true */
	/*global modules: false, $tw: false */
	"use strict";

	// Include bootprefix if we're not given module data
	if(!$tw) {
		$tw = require("./bootprefix.js").bootprefix();
	}

	$tw.utils = $tw.utils || Object.create(null);

	/////////////////////////// Standard node.js libraries

	let fs; let path; let vm;
	if($tw.node) {
		fs = require("fs");
		path = require("path");
		vm = require("vm");
	}

	/////////////////////////// Utility functions

	$tw.boot.log = function(str) {
		$tw.boot.logMessages = $tw.boot.logMessages || [];
		$tw.boot.logMessages.push(str);
	};

	/*
	Check if an object has a property
	*/
	$tw.utils.hop = function(object,property) {
		return object ? Object.prototype.hasOwnProperty.call(object,property) : false;
	};

	/*
	Determine if a value is an array
	*/
	$tw.utils.isArray = function(value) {
		return Object.prototype.toString.call(value) == "[object Array]";
	};

	/*
	Check if an array is equal by value and by reference.
	*/
	$tw.utils.isArrayEqual = function(array1,array2) {
		if(array1 === array2) {
			return true;
		}
		array1 = array1 || [];
		array2 = array2 || [];
		if(array1.length !== array2.length) {
			return false;
		}
		return array1.every((value,index) => {
			return value === array2[index];
		});
	};

	/*
	Add an entry to a sorted array if it doesn't already exist, while maintaining the sort order
	*/
	$tw.utils.insertSortedArray = function(array,value) {
		let low = 0; let high = array.length - 1; let mid; let cmp;
		while(low <= high) {
			mid = (low + high) >> 1;
			cmp = value.localeCompare(array[mid]);
			if(cmp > 0) {
				low = mid + 1;
			} else if(cmp < 0) {
				high = mid - 1;
			} else {
				return array;
			}
		}
		array.splice(low,0,value);
		return array;
	};

	/*
	Push entries onto an array, removing them first if they already exist in the array
		array: array to modify (assumed to be free of duplicates)
		value: a single value to push or an array of values to push
	*/
	$tw.utils.pushTop = function(array,value) {
		let t; let p;
		if($tw.utils.isArray(value)) {
			// Remove any array entries that are duplicated in the new values
			if(value.length !== 0) {
				if(array.length !== 0) {
					if(value.length < array.length) {
						for(t = 0;t < value.length;t++) {
							p = array.indexOf(value[t]);
							if(p !== -1) {
								array.splice(p,1);
							}
						}
					} else {
						for(t = array.length - 1;t >= 0;t--) {
							p = value.indexOf(array[t]);
							if(p !== -1) {
								array.splice(t,1);
							}
						}
					}
				}
				// Push the values on top of the main array
				array.push.apply(array,value);
			}
		} else {
			p = array.indexOf(value);
			if(p !== -1) {
				array.splice(p,1);
			}
			array.push(value);
		}
		return array;
	};

	/*
	Determine if a value is a date
	*/
	$tw.utils.isDate = function(value) {
		return Object.prototype.toString.call(value) === "[object Date]";
	};

	/*
	Iterate through all the own properties of an object or array. Callback is invoked with (element,title,object)
	*/
	$tw.utils.each = function(object,callback) {
		let next; let f; let length;
		if(object) {
			if(Object.prototype.toString.call(object) == "[object Array]") {
				for(f = 0,length = object.length;f < length;f++) {
					next = callback(object[f],f,object);
					if(next === false) {
						break;
					}
				}
			} else {
				const keys = Object.keys(object);
				for(f = 0,length = keys.length;f < length;f++) {
					const key = keys[f];
					next = callback(object[key],key,object);
					if(next === false) {
						break;
					}
				}
			}
		}
	};

	/*
	Helper for making DOM elements
	tag: tag name
	options: see below
	Options include:
	namespace: defaults to http://www.w3.org/1999/xhtml
	attributes: hashmap of attribute values
	style: hashmap of styles
	text: text to add as a child node
	children: array of further child nodes
	innerHTML: optional HTML for element
	class: class name(s)
	document: defaults to current document
	eventListeners: array of event listeners (this option won't work until $tw.utils.addEventListeners() has been loaded)
	*/
	$tw.utils.domMaker = function(tag,options) {
		var options = options || {};
		const doc = options.document || document;
		const element = doc.createElementNS(options.namespace || "http://www.w3.org/1999/xhtml",tag);
		if(options["class"]) {
			element.className = options["class"];
		}
		if(options.text) {
			element.appendChild(doc.createTextNode(options.text));
		}
		$tw.utils.each(options.children,(child) => {
			element.appendChild(child);
		});
		if(options.innerHTML) {
			element.innerHTML = options.innerHTML;
		}
		$tw.utils.each(options.attributes,(attribute,name) => {
			element.setAttribute(name,attribute);
		});
		$tw.utils.each(options.style,(value,name) => {
			element.style[name] = value;
		});
		if(options.eventListeners) {
			$tw.utils.addEventListeners(element,options.eventListeners);
		}
		return element;
	};

	/*
	Display an error and exit
	*/
	$tw.utils.error = function(err) {
		// Prepare the error message
		const errHeading = ($tw.language == undefined ? "Internal JavaScript Error" : $tw.language.getString("InternalJavaScriptError/Title"));
		const promptMsg = ($tw.language == undefined ? "Well, this is embarrassing. It is recommended that you restart TiddlyWiki by refreshing your browser" : $tw.language.getString("InternalJavaScriptError/Hint"));
		// Log the error to the console
		console.error($tw.node ? `\x1b[1;31m${err}\x1b[0m` : err);
		if($tw.browser && !$tw.node) {
			// Display an error message to the user
			const dm = $tw.utils.domMaker;
			const heading = dm("h1",{text: errHeading});
			const prompt = dm("div",{text: promptMsg,"class": "tc-error-prompt"});
			const message = dm("div",{text: err,"class": "tc-error-message"});
			const closeButton = dm("div",{children: [dm("button",{text: ($tw.language == undefined ? "close" : $tw.language.getString("Buttons/Close/Caption"))})],"class": "tc-error-prompt"});
			const downloadButton = dm("div",{children: [dm("button",{text: ($tw.language == undefined ? "download tiddlers" : $tw.language.getString("Buttons/EmergencyDownload/Caption"))})],"class": "tc-error-prompt"});
			const form = dm("form",{children: [heading,prompt,downloadButton,message,closeButton],"class": "tc-error-form"});
			document.body.insertBefore(form,document.body.firstChild);
			downloadButton.addEventListener("click",(event) => {
				if($tw && $tw.wiki) {
					const tiddlers = [];
					$tw.wiki.each((tiddler,title) => {
						tiddlers.push(tiddler.fields);
					});
					const link = dm("a");
					const text = JSON.stringify(tiddlers);
					if(Blob !== undefined) {
						const blob = new Blob([text],{type: "application/json"});
						link.setAttribute("href",URL.createObjectURL(blob));
					} else {
						link.setAttribute("href",`data:application/json,${encodeURIComponent(text)}`);
					}
					link.setAttribute("download",`emergency-tiddlers-${new Date()}.json`);
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
				} else {
					alert("Emergency tiddler download is not available");
				}
				event.preventDefault();
				return false;
			},true);
			form.addEventListener("submit",(event) => {
				document.body.removeChild(form);
				event.preventDefault();
				return false;
			},true);
			return null;
		} else if(!$tw.browser) {
			// Exit if we're under node.js
			process.exit(1);
		}
	};

	/*
	Use our custom error handler if we're in the browser
	*/
	if($tw.boot.tasks.trapErrors) {
		window.onerror = function(errorMsg,url,lineNumber) {
			$tw.utils.error(errorMsg);
			return false;
		};
	}

	/*
	Extend an object with the properties from a list of source objects
	*/
	$tw.utils.extend = function(object /*, sourceObjectList */) {
		$tw.utils.each(Array.prototype.slice.call(arguments,1),(source) => {
			if(source) {
				for(const p in source) {
					object[p] = source[p];
				}
			}
		});
		return object;
	};

	/*
	Fill in any null or undefined properties of an object with the properties from a list of source objects. Each property that is an object is called recursively
	*/
	$tw.utils.deepDefaults = function(object /*, sourceObjectList */) {
		$tw.utils.each(Array.prototype.slice.call(arguments,1),(source) => {
			if(source) {
				for(const p in source) {
					if(object[p] === null || object[p] === undefined) {
						object[p] = source[p];
					}
					if(typeof object[p] === "object" && typeof source[p] === "object") {
						$tw.utils.deepDefaults(object[p],source[p]);
					}
				}
			}
		});
		return object;
	};

	/*
	Convert a URIComponent encoded string to a string safely
	*/
	$tw.utils.decodeURIComponentSafe = function(s) {
		let v = s;
		try {
			v = decodeURIComponent(s);
		} catch(e) {}
		return v;
	};

	/*
	Convert a URI encoded string to a string safely
	*/
	$tw.utils.decodeURISafe = function(s) {
		let v = s;
		try {
			v = decodeURI(s);
		} catch(e) {}
		return v;
	};

	/*
	Convert "&amp;" to &, "&nbsp;" to nbsp, "&lt;" to <, "&gt;" to > and "&quot;" to "
	*/
	$tw.utils.htmlDecode = function(s) {
		return s.toString().replace(/&lt;/mg,"<").replace(/&nbsp;/mg,"\xA0").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
	};

	/*
	Get the browser location.hash. We don't use location.hash because of the way that Firefox auto-urldecodes it (see http://stackoverflow.com/questions/1703552/encoding-of-window-location-hash)
	*/
	$tw.utils.getLocationHash = function() {
		const {href} = window.location;
		const idx = href.indexOf('#');
		if(idx === -1) {
			return "#";
		} else if(href.substr(idx + 1,1) === "#" || href.substr(idx + 1,3) === "%23") {
			// Special case: ignore location hash if it itself starts with a #
			return "#";
		} else {
			return href.substring(idx);
		}
	};

	/*
	Pad a string to a given length with "0"s. Length defaults to 2
	*/
	$tw.utils.pad = function(value,length) {
		length = length || 2;
		let s = value.toString();
		if(s.length < length) {
			s = "000000000000000000000000000".substr(0,length - s.length) + s;
		}
		return s;
	};

	// Convert a date into UTC YYYYMMDDHHMMSSmmm format
	$tw.utils.stringifyDate = function(value) {
		return value.getUTCFullYear() +
			$tw.utils.pad(value.getUTCMonth() + 1) +
			$tw.utils.pad(value.getUTCDate()) +
			$tw.utils.pad(value.getUTCHours()) +
			$tw.utils.pad(value.getUTCMinutes()) +
			$tw.utils.pad(value.getUTCSeconds()) +
			$tw.utils.pad(value.getUTCMilliseconds(),3);
	};

	// Parse a date from a UTC YYYYMMDDHHMMSSmmm format string
	$tw.utils.parseDate = function(value) {
		if(typeof value === "string") {
			let negative = 1;
			if(value.charAt(0) === "-") {
				negative = -1;
				value = value.substr(1);
			}
			const year = parseInt(value.substr(0,4),10) * negative;
			const d = new Date(Date.UTC(year,
				parseInt(value.substr(4,2),10) - 1,
				parseInt(value.substr(6,2),10),
				parseInt(value.substr(8,2) || "00",10),
				parseInt(value.substr(10,2) || "00",10),
				parseInt(value.substr(12,2) || "00",10),
				parseInt(value.substr(14,3) || "000",10)));
			d.setUTCFullYear(year); // See https://stackoverflow.com/a/5870822
			return d;
		} else if($tw.utils.isDate(value)) {
			return value;
		} else {
			return null;
		}
	};

	// Stringify an array of tiddler titles into a list string
	$tw.utils.stringifyList = function(value) {
		if($tw.utils.isArray(value)) {
			const result = new Array(value.length);
			for(let t = 0,l = value.length;t < l;t++) {
				const entry = value[t] || "";
				if(entry.match(/[^\S\xA0]/mg)) {
					result[t] = `[[${entry}]]`;
				} else {
					result[t] = entry;
				}
			}
			return result.join(" ");
		} else {
			return value || "";
		}
	};

	// Parse a string array from a bracketted list. For example "OneTiddler [[Another Tiddler]] LastOne"
	$tw.utils.parseStringArray = function(value,allowDuplicate) {
		if(typeof value === "string") {
			const memberRegExp = /(?:^|[^\S\xA0])(?:\[\[(.*?)\]\])(?=[^\S\xA0]|$)|([\S\xA0]+)/mg;
			const results = []; const names = {};
			let match;
			do {
				match = memberRegExp.exec(value);
				if(match) {
					const item = match[1] || match[2];
					if(item !== undefined && (!$tw.utils.hop(names,item) || allowDuplicate)) {
						results.push(item);
						names[item] = true;
					}
				}
			} while(match);
			return results;
		} else if($tw.utils.isArray(value)) {
			return value;
		} else {
			return null;
		}
	};

	// Parse a block of name:value fields. The `fields` object is used as the basis for the return value
	$tw.utils.parseFields = function(text,fields) {
		fields = fields || Object.create(null);
		text.split(/\r?\n/mg).forEach((line) => {
			if(line.charAt(0) !== "#") {
				const p = line.indexOf(":");
				if(p !== -1) {
					const field = line.substr(0,p).trim();
					const value = line.substr(p + 1).trim();
					if(field) {
						fields[field] = value;
					}
				}
			}
		});
		return fields;
	};

	// Safely parse a string as JSON
	$tw.utils.parseJSONSafe = function(text,defaultJSON) {
		try {
			return JSON.parse(text);
		} catch(e) {
			if(typeof defaultJSON === "function") {
				return defaultJSON(e);
			} else {
				return defaultJSON || {};
			}
		}
	};

	/*
	Resolves a source filepath delimited with `/` relative to a specified absolute root filepath.
	In relative paths, the special folder name `..` refers to immediate parent directory, and the
	name `.` refers to the current directory
	*/
	$tw.utils.resolvePath = function(sourcepath,rootpath) {
		// If the source path starts with ./ or ../ then it is relative to the root
		if(sourcepath.substr(0,2) === "./" || sourcepath.substr(0,3) === "../") {
			const src = sourcepath.split("/");
			var root = rootpath.split("/");
			// Remove the filename part of the root
			root.splice(root.length - 1,1);
			// Process the source path bit by bit onto the end of the root path
			while(src.length > 0) {
				const c = src.shift();
				if(c === "..") { // Slice off the last root entry for a double dot
					if(root.length > 0) {
						root.splice(root.length - 1,1);
					}
				} else if(c !== ".") { // Ignore dots
					root.push(c); // Copy other elements across
				}
			}
			return root.join("/");
		} else {
			// If it isn't relative, just return the path
			if(rootpath) {
				var root = rootpath.split("/");
				// Remove the filename part of the root
				root.splice(root.length - 1,1);
				return `${root.join("/")}/${sourcepath}`;
			} else {
				return sourcepath;
			}
		}
	};

	/*
	Parse a semantic version string into its constituent parts -- see https://semver.org
	*/
	$tw.utils.parseVersion = function(version) {
		const match = /^v?((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?$/.exec(version);
		if(match) {
			return {
				version: match[1],
				major: parseInt(match[2],10),
				minor: parseInt(match[3],10),
				patch: parseInt(match[4],10),
				prerelease: match[5],
				build: match[6]
			};
		} else {
			return null;
		}
	};

	/*
	Returns +1 if the version string A is greater than the version string B, 0 if they are the same, and +1 if B is greater than A.
	Missing or malformed version strings are parsed as 0.0.0
	*/
	$tw.utils.compareVersions = function(versionStringA,versionStringB) {
		const defaultVersion = {
			major: 0,
			minor: 0,
			patch: 0
		};
		const versionA = $tw.utils.parseVersion(versionStringA) || defaultVersion;
		const versionB = $tw.utils.parseVersion(versionStringB) || defaultVersion;
		const diff = [
			versionA.major - versionB.major,
			versionA.minor - versionB.minor,
			versionA.patch - versionB.patch
		];
		if((diff[0] > 0) || (diff[0] === 0 && diff[1] > 0) || (diff[0] === 0 & diff[1] === 0 & diff[2] > 0)) {
			return +1;
		} else if((diff[0] < 0) || (diff[0] === 0 && diff[1] < 0) || (diff[0] === 0 & diff[1] === 0 & diff[2] < 0)) {
			return -1;
		} else {
			return 0;
		}
	};

	/*
	Returns true if the version string A is greater than the version string B. Returns true if the versions are the same
	*/
	$tw.utils.checkVersions = function(versionStringA,versionStringB) {
		return $tw.utils.compareVersions(versionStringA,versionStringB) !== -1;
	};

	/*
	Register file type information
	options: {flags: flags,deserializerType: deserializerType}
		flags:"image" for image types
		deserializerType: defaults to type if not specified
	*/
	$tw.utils.registerFileType = function(type,encoding,extension,options) {
		options = options || {};
		if($tw.utils.isArray(extension)) {
			$tw.utils.each(extension,(extension) => {
				$tw.config.fileExtensionInfo[extension] = {type};
			});
			extension = extension[0];
		} else {
			$tw.config.fileExtensionInfo[extension] = {type};
		}
		$tw.config.contentTypeInfo[type] = {encoding,extension,flags: options.flags || [],deserializerType: options.deserializerType || type};
	};

	/*
	Given an extension, always access the $tw.config.fileExtensionInfo
	using a lowercase extension only.
	*/
	$tw.utils.getFileExtensionInfo = function(ext) {
		return ext ? $tw.config.fileExtensionInfo[ext.toLowerCase()] : null;
	};

	/*
	Given an extension, get the correct encoding for that file.
	defaults to utf8
	*/
	$tw.utils.getTypeEncoding = function(ext) {
		const extensionInfo = $tw.utils.getFileExtensionInfo(ext);
		const type = extensionInfo ? extensionInfo.type : null;
		const typeInfo = type ? $tw.config.contentTypeInfo[type] : null;
		return typeInfo ? typeInfo.encoding : "utf8";
	};

	const globalCheck = [
		"  Object.defineProperty(Object.prototype, '__temp__', {",
		"    get: function () { return this; },",
		"    configurable: true",
		"  });",
		"  if(Object.keys(__temp__).length){",
		"    console.log(\"Warning: Global assignment detected\",Object.keys(__temp__));",
		"    delete Object.prototype.__temp__;",
		"  }",
		"  delete Object.prototype.__temp__;",
	].join('\n');

	/*
	Run code globally with specified context variables in scope
	*/
	$tw.utils.evalGlobal = function(code,context,filename,sandbox,allowGlobals) {
		const contextCopy = $tw.utils.extend(Object.create(null),context);
		// Get the context variables as a pair of arrays of names and values
		const contextNames = []; const contextValues = [];
		$tw.utils.each(contextCopy,(value,name) => {
			contextNames.push(name);
			contextValues.push(value);
		});
		// Add the code prologue and epilogue
		code = [
			`(function(${contextNames.join(",")}) {`,
			`  (function(){${code}\n;})();\n`,
			(!$tw.browser && sandbox && !allowGlobals) ? globalCheck : "",
			"\nreturn exports;\n",
			"})"
		].join("");

		// Compile the code into a function
		let fn;
		if($tw.browser) {
			fn = window["eval"](`${code}\n\n//# sourceURL=${filename}`);
		} else {
			if(sandbox) {
				fn = vm.runInContext(code,sandbox,filename);
			} else {
				fn = vm.runInThisContext(code,filename);
			}
		}
		// Call the function and return the exports
		return fn.apply(null,contextValues);
	};
	$tw.utils.sandbox = !$tw.browser ? vm.createContext({}) : undefined;
	/*
	Run code in a sandbox with only the specified context variables in scope
	*/
	$tw.utils.evalSandboxed = $tw.browser ? $tw.utils.evalGlobal : function(code,context,filename,allowGlobals) {
		return $tw.utils.evalGlobal(
			code,context,filename,
			allowGlobals ? vm.createContext({}) : $tw.utils.sandbox,
			allowGlobals
		);
	};

	/*
	Creates a PasswordPrompt object
	*/
	$tw.utils.PasswordPrompt = function() {
		// Store of pending password prompts
		this.passwordPrompts = [];
		// Create the wrapper
		this.promptWrapper = $tw.utils.domMaker("div",{"class": "tc-password-wrapper"});
		document.body.appendChild(this.promptWrapper);
		// Hide the empty wrapper
		this.setWrapperDisplay();
	};

	/*
	Hides or shows the wrapper depending on whether there are any outstanding prompts
	*/
	$tw.utils.PasswordPrompt.prototype.setWrapperDisplay = function() {
		if(this.passwordPrompts.length) {
			this.promptWrapper.style.display = "block";
		} else {
			this.promptWrapper.style.display = "none";
		}
	};

	/*
	Adds a new password prompt. Options are:
	submitText: text to use for submit button (defaults to "Login")
	serviceName: text of the human readable service name
	noUserName: set true to disable username prompt
	canCancel: set true to enable a cancel button (callback called with null)
	repeatPassword: set true to prompt for the password twice
	callback: function to be called on submission with parameter of object {username:,password:}. Callback must return `true` to remove the password prompt
	*/
	$tw.utils.PasswordPrompt.prototype.createPrompt = function(options) {
		// Create and add the prompt to the DOM
		var self = this;
		const submitText = options.submitText || "Login";
		const dm = $tw.utils.domMaker;
		const children = [dm("h1",{text: options.serviceName})];
		if(!options.noUserName) {
			children.push(dm("input",{
				attributes: {type: "text",name: "username",placeholder: $tw.language.getString("Encryption/Username")}
			}));
		}
		children.push(dm("input",{
			attributes: {
				type: "password",
				name: "password",
				placeholder: ($tw.language == undefined ? "Password" : $tw.language.getString("Encryption/Password"))
			}
		}));
		if(options.repeatPassword) {
			children.push(dm("input",{
				attributes: {
					type: "password",
					name: "password2",
					placeholder: $tw.language.getString("Encryption/RepeatPassword")
				}
			}));
		}
		if(options.canCancel) {
			children.push(dm("button",{
				text: $tw.language.getString("Encryption/Cancel"),
				attributes: {
					type: "button"
				},
				eventListeners: [{
					name: "click",
					handlerFunction(event) {
						self.removePrompt(promptInfo);
						options.callback(null);
					}
				}]
			}));
		}
		children.push(dm("button",{
			attributes: {type: "submit"},
			text: submitText
		}));
		const form = dm("form",{
			attributes: {autocomplete: "off"},
			children
		});
		this.promptWrapper.appendChild(form);
		window.setTimeout(() => {
			form.elements[0].focus();
		},10);
		// Add a submit event handler
		var self = this;
		form.addEventListener("submit",(event) => {
			// Collect the form data
			const data = {}; let t;
			$tw.utils.each(form.elements,(element) => {
				if(element.name && element.value) {
					data[element.name] = element.value;
				}
			});
			// Check that the passwords match
			if(options.repeatPassword && data.password !== data.password2) {
				alert($tw.language.getString("Encryption/PasswordNoMatch"));
			} else {
				// Call the callback
				if(options.callback(data)) {
					// Remove the prompt if the callback returned true
					self.removePrompt(promptInfo);
				} else {
					// Clear the password if the callback returned false
					$tw.utils.each(form.elements,(element) => {
						if(element.name === "password" || element.name === "password2") {
							element.value = "";
						}
					});
				}
			}
			event.preventDefault();
			return false;
		},true);
		// Add the prompt to the list
		var promptInfo = {
			serviceName: options.serviceName,
			callback: options.callback,
			form,
			owner: this
		};
		this.passwordPrompts.push(promptInfo);
		// Make sure the wrapper is displayed
		this.setWrapperDisplay();
		return promptInfo;
	};

	$tw.utils.PasswordPrompt.prototype.removePrompt = function(promptInfo) {
		const i = this.passwordPrompts.indexOf(promptInfo);
		if(i !== -1) {
			this.passwordPrompts.splice(i,1);
			promptInfo.form.parentNode.removeChild(promptInfo.form);
			this.setWrapperDisplay();
		}
	};

	/*
	Crypto helper object for encrypted content. It maintains the password text in a closure, and provides methods to change
	the password, and to encrypt/decrypt a block of text
	*/
	$tw.utils.Crypto = function() {
		const sjcl = $tw.node ? (global.sjcl || require("./sjcl.js")) : window.sjcl;
		let currentPassword = null;
		const callSjcl = function(method,inputText,password) {
			password = password || currentPassword;
			let outputText;
			try {
				if(password) {
					outputText = sjcl[method](password,inputText);
				}
			} catch(ex) {
				console.log(`Crypto error:${ex}`);
				outputText = null;
			}
			return outputText;
		};
		$tw.sjcl = sjcl;
		this.setPassword = function(newPassword) {
			currentPassword = newPassword;
			this.updateCryptoStateTiddler();
		};
		this.updateCryptoStateTiddler = function() {
			if($tw.wiki) {
				const state = currentPassword ? "yes" : "no";
				const tiddler = $tw.wiki.getTiddler("$:/isEncrypted");
				if(!tiddler || tiddler.fields.text !== state) {
					$tw.wiki.addTiddler(new $tw.Tiddler({title: "$:/isEncrypted",text: state}));
				}
			}
		};
		this.hasPassword = function() {
			return !!currentPassword;
		};
		this.encrypt = function(text,password) {
			return callSjcl("encrypt",text,password);
		};
		this.decrypt = function(text,password) {
			return callSjcl("decrypt",text,password);
		};
	};

	/////////////////////////// Module mechanism

	/*
	Execute the module named 'moduleName'. The name can optionally be relative to the module named 'moduleRoot'
	*/
	$tw.modules.execute = function(moduleName,moduleRoot) {
		let name = moduleName;
		if(moduleName.charAt(0) === ".") {
			name = $tw.utils.resolvePath(moduleName,moduleRoot);
		}
		if(!$tw.modules.titles[name]) {
			if($tw.modules.titles[`${name}.js`]) {
				name = `${name}.js`;
			} else if($tw.modules.titles[`${name}/index.js`]) {
				name = `${name}/index.js`;
			} else if($tw.modules.titles[moduleName]) {
				name = moduleName;
			} else if($tw.modules.titles[`${moduleName}.js`]) {
				name = `${moduleName}.js`;
			} else if($tw.modules.titles[`${moduleName}/index.js`]) {
				name = `${moduleName}/index.js`;
			}
		}
		const moduleInfo = $tw.modules.titles[name];
		const tiddler = $tw.wiki.getTiddler(name);
		const _exports = {};
		const sandbox = {
			module: {exports: _exports},
			//moduleInfo: moduleInfo,
			exports: _exports,
			console,
			setInterval,
			clearInterval,
			setTimeout,
			clearTimeout,
			Buffer: $tw.browser ? undefined : Buffer,
			$tw,
			require(title) {
				return $tw.modules.execute(title,name);
			}
		};

		Object.defineProperty(sandbox.module,"id",{
			value: name,
			writable: false,
			enumerable: true,
			configurable: false
		});

		if(!$tw.browser) {
			$tw.utils.extend(sandbox,{
				process
			});
		} else {
			/*
			CommonJS optional require.main property:
				In a browser we offer a fake main module which points back to the boot function
				(Theoretically, this may allow TW to eventually load itself as a module in the browser)
			*/
			Object.defineProperty(sandbox.require,"main",{
				value: (typeof (require) !== "undefined") ? require.main : {TiddlyWiki: _boot},
				writable: false,
				enumerable: true,
				configurable: false
			});
		}
		if(!moduleInfo) {
			// We could not find the module on this path
			// Try to defer to browserify etc, or node
			let deferredModule;
			if($tw.browser) {
				if(window.require) {
					try {
						return window.require(moduleName);
					} catch(e) {}
				}
				throw `Cannot find module named '${moduleName}' required by module '${moduleRoot}', resolved to ${name}`;
			} else {
				// If we don't have a module with that name, let node.js try to find it
				return require(moduleName);
			}
		}
		// Execute the module if we haven't already done so
		if(!moduleInfo.exports) {
			try {
				// Check the type of the definition
				if(typeof moduleInfo.definition === "function") { // Function
					moduleInfo.exports = _exports;
					moduleInfo.definition(moduleInfo,moduleInfo.exports,sandbox.require);
				} else if(typeof moduleInfo.definition === "string") { // String
					moduleInfo.exports = _exports;
					$tw.utils.evalSandboxed(moduleInfo.definition,sandbox,tiddler.fields.title);
					if(sandbox.module.exports) {
						moduleInfo.exports = sandbox.module.exports; //more codemirror workaround
					}
				} else { // Object
					moduleInfo.exports = moduleInfo.definition;
				}
			} catch(e) {
				if(e instanceof SyntaxError) {
					const line = e.lineNumber || e.line; // Firefox || Safari
					if(typeof (line) != "undefined" && line !== null) {
						$tw.utils.error(`Syntax error in boot module ${name}:${line}:\n${e.stack}`);
					} else if(!$tw.browser) {
						// this is the only way to get node.js to display the line at which the syntax error appeared,
						// and $tw.utils.error would exit anyway
						// cf. https://bugs.chromium.org/p/v8/issues/detail?id=2589
						throw e;
					} else {
						// Opera: line number is included in e.message
						// Chrome/IE: there's currently no way to get the line number
						$tw.utils.error(`Syntax error in boot module ${name}: ${e.message}\n${e.stack}`);
					}
				} else {
					// line number should be included in e.stack for runtime errors
					$tw.utils.error(`Error executing boot module ${name}: ${String(e)}\n\n${e.stack}`);
				}
			}
		}
		// Return the exports of the module
		return moduleInfo.exports;
	};

	/*
	Apply a callback to each module of a particular type
		moduleType: type of modules to enumerate
		callback: function called as callback(title,moduleExports) for each module
	*/
	$tw.modules.forEachModuleOfType = function(moduleType,callback) {
		const modules = $tw.modules.types[moduleType];
		$tw.utils.each(modules,(element,title) => {
			callback(title,$tw.modules.execute(title));
		});
	};

	/*
	Get all the modules of a particular type in a hashmap by their `name` field
	*/
	$tw.modules.getModulesByTypeAsHashmap = function(moduleType,nameField) {
		nameField = nameField || "name";
		const results = Object.create(null);
		$tw.modules.forEachModuleOfType(moduleType,(title,module) => {
			results[module[nameField]] = module;
		});
		return results;
	};

	/*
	Apply the exports of the modules of a particular type to a target object
	*/
	$tw.modules.applyMethods = function(moduleType,targetObject) {
		if(!targetObject) {
			targetObject = Object.create(null);
		}
		$tw.modules.forEachModuleOfType(moduleType,(title,module) => {
			$tw.utils.each(module,(element,title,object) => {
				targetObject[title] = module[title];
			});
		});
		return targetObject;
	};

	/*
	Return a class created from a modules. The module should export the properties to be added to those of the optional base class
	*/
	$tw.modules.createClassFromModule = function(moduleExports,baseClass) {
		const newClass = function() {};
		if(baseClass) {
			newClass.prototype = new baseClass();
			newClass.prototype.constructor = baseClass;
		}
		$tw.utils.extend(newClass.prototype,moduleExports);
		return newClass;
	};

	/*
	Return an array of classes created from the modules of a specified type. Each module should export the properties to be added to those of the optional base class
	*/
	$tw.modules.createClassesFromModules = function(moduleType,subType,baseClass) {
		const classes = Object.create(null);
		$tw.modules.forEachModuleOfType(moduleType,(title,moduleExports) => {
			if(!subType || moduleExports.types[subType]) {
				classes[moduleExports.name] = $tw.modules.createClassFromModule(moduleExports,baseClass);
			}
		});
		return classes;
	};

	/////////////////////////// Barebones tiddler object

	/*
	Construct a tiddler object from a hashmap of tiddler fields. If multiple hasmaps are provided they are merged,
	taking precedence to the right
	*/
	$tw.Tiddler = function(/* [fields,] fields */) {
		this.fields = Object.create(null);
		this.cache = Object.create(null);
		for(let c = 0;c < arguments.length;c++) {
			const arg = arguments[c];
			const src = (arg instanceof $tw.Tiddler) ? arg.fields : arg;
			for(const t in src) {
				if(src[t] === undefined || src[t] === null) {
					if(t in this.fields) {
						delete this.fields[t]; // If we get a field that's undefined, delete any previous field value
					}
				} else {
					// Parse the field with the associated field module (if any)
					const fieldModule = $tw.Tiddler.fieldModules[t];
					var value;
					if(fieldModule && fieldModule.parse) {
						value = fieldModule.parse.call(this,src[t]);
					} else {
						value = src[t];
					}
					// Freeze the field to keep it immutable
					if(value != null && typeof value === "object") {
						Object.freeze(value);
					}
					this.fields[t] = value;
				}
			}
		}
		// Freeze the tiddler against modification
		Object.freeze(this.fields);
		Object.freeze(this);
	};

	$tw.Tiddler.prototype.hasField = function(field) {
		return $tw.utils.hop(this.fields,field);
	};

	/*
	Compare two tiddlers for equality
	tiddler: the tiddler to compare
	excludeFields: array of field names to exclude from the comparison
	*/
	$tw.Tiddler.prototype.isEqual = function(tiddler,excludeFields) {
		if(!(tiddler instanceof $tw.Tiddler)) {
			return false;
		}
		excludeFields = excludeFields || [];
		const self = this;
		const differences = []; // Fields that have differences
		// Add to the differences array
		function addDifference(fieldName) {
			// Check for this field being excluded
			if(!excludeFields.includes(fieldName)) {
				// Save the field as a difference
				$tw.utils.pushTop(differences,fieldName);
			}
		}
		// Returns true if the two values of this field are equal
		function isFieldValueEqual(fieldName) {
			const valueA = self.fields[fieldName];
			const valueB = tiddler.fields[fieldName];
			// Check for identical string values
			if(typeof (valueA) === "string" && typeof (valueB) === "string" && valueA === valueB) {
				return true;
			}
			// Check for identical array values
			if($tw.utils.isArray(valueA) && $tw.utils.isArray(valueB) && $tw.utils.isArrayEqual(valueA,valueB)) {
				return true;
			}
			// Check for identical date values
			if($tw.utils.isDate(valueA) && $tw.utils.isDate(valueB) && valueA.getTime() === valueB.getTime()) {
				return true;
			}
			// Otherwise the fields must be different
			return false;
		}
		// Compare our fields
		for(var fieldName in this.fields) {
			if(!isFieldValueEqual(fieldName)) {
				addDifference(fieldName);
			}
		}
		// There's a difference for every field in the other tiddler that we don't have
		for(fieldName in tiddler.fields) {
			if(!(fieldName in this.fields)) {
				addDifference(fieldName);
			}
		}
		// Return whether there were any differences
		return differences.length === 0;
	};

	/*
	Register and install the built in tiddler field modules
	*/
	$tw.modules.define("$:/boot/tiddlerfields/modified","tiddlerfield",{
		name: "modified",
		parse: $tw.utils.parseDate,
		stringify: $tw.utils.stringifyDate
	});
	$tw.modules.define("$:/boot/tiddlerfields/created","tiddlerfield",{
		name: "created",
		parse: $tw.utils.parseDate,
		stringify: $tw.utils.stringifyDate
	});
	$tw.modules.define("$:/boot/tiddlerfields/color","tiddlerfield",{
		name: "color",
		editTag: "input",
		editType: "color"
	});
	$tw.modules.define("$:/boot/tiddlerfields/tags","tiddlerfield",{
		name: "tags",
		parse: $tw.utils.parseStringArray,
		stringify: $tw.utils.stringifyList
	});
	$tw.modules.define("$:/boot/tiddlerfields/list","tiddlerfield",{
		name: "list",
		parse: $tw.utils.parseStringArray,
		stringify: $tw.utils.stringifyList
	});

	/////////////////////////// Barebones wiki store

	/*
	Wiki constructor. State is stored in private members that only a small number of privileged accessor methods have direct access. Methods added via the prototype have to use these accessors and cannot access the state data directly.
	options include:
	enableIndexers - Array of indexer names to enable, or null to use all available indexers
	*/
	$tw.Wiki = function(options) {
		options = options || {};
		const self = this;
		const tiddlers = Object.create(null); // Hashmap of tiddlers
		let tiddlerTitles = null; // Array of tiddler titles
		const getTiddlerTitles = function() {
			if(!tiddlerTitles) {
				tiddlerTitles = Object.keys(tiddlers).sort((a,b) => {return a.localeCompare(b);});
			}
			return tiddlerTitles;
		};
		const pluginTiddlers = []; // Array of tiddlers containing registered plugins, ordered by priority
		const pluginInfo = Object.create(null); // Hashmap of parsed plugin content
		let shadowTiddlers = Object.create(null); // Hashmap by title of {source:, tiddler:}
		let shadowTiddlerTitles = null;
		const getShadowTiddlerTitles = function() {
			if(!shadowTiddlerTitles) {
				shadowTiddlerTitles = Object.keys(shadowTiddlers).sort((a,b) => {return a.localeCompare(b);});
			}
			return shadowTiddlerTitles;
		};
		const enableIndexers = options.enableIndexers || null;
		const indexers = [];
		const indexersByName = Object.create(null);

		this.addIndexer = function(indexer,name) {
			// Bail if this indexer is not enabled
			if(enableIndexers && !enableIndexers.includes(name)) {
				return;
			}
			indexers.push(indexer);
			indexersByName[name] = indexer;
			indexer.init();
		};

		this.getIndexer = function(name) {
			return indexersByName[name] || null;
		};

		// Add a tiddler to the store
		this.addTiddler = function(tiddler) {
			if(!(tiddler instanceof $tw.Tiddler)) {
				tiddler = new $tw.Tiddler(tiddler);
			}
			// Save the tiddler
			if(tiddler) {
				const {title} = tiddler.fields;
				if(title) {
					// Uncomment the following line for detailed logs of all tiddler writes
					// console.log("Adding",title,tiddler)
					// Record the old tiddler state
					const updateDescriptor = {
						old: {
							tiddler: this.getTiddler(title),
							shadow: this.isShadowTiddler(title),
							exists: this.tiddlerExists(title)
						}
					};
					// Save the new tiddler
					tiddlers[title] = tiddler;
					// Check we've got the title
					tiddlerTitles = $tw.utils.insertSortedArray(tiddlerTitles || [],title);
					// Record the new tiddler state
					updateDescriptor["new"] = {
						tiddler,
						shadow: this.isShadowTiddler(title),
						exists: this.tiddlerExists(title)
					};
					// Update indexes
					this.clearCache(title);
					this.clearGlobalCache();
					$tw.utils.each(indexers,(indexer) => {
						indexer.update(updateDescriptor);
					});
					// Queue a change event
					this.enqueueTiddlerEvent(title);
				}
			}
		};

		// Delete a tiddler
		this.deleteTiddler = function(title) {
			// Uncomment the following line for detailed logs of all tiddler deletions
			// console.log("Deleting",title)
			if($tw.utils.hop(tiddlers,title)) {
				// Record the old tiddler state
				const updateDescriptor = {
					old: {
						tiddler: this.getTiddler(title),
						shadow: this.isShadowTiddler(title),
						exists: this.tiddlerExists(title)
					}
				};
				// Delete the tiddler
				delete tiddlers[title];
				// Delete it from the list of titles
				if(tiddlerTitles) {
					const index = tiddlerTitles.indexOf(title);
					if(index !== -1) {
						tiddlerTitles.splice(index,1);
					}
				}
				// Record the new tiddler state
				updateDescriptor["new"] = {
					tiddler: this.getTiddler(title),
					shadow: this.isShadowTiddler(title),
					exists: this.tiddlerExists(title)
				};
				// Update indexes
				this.clearCache(title);
				this.clearGlobalCache();
				$tw.utils.each(indexers,(indexer) => {
					indexer.update(updateDescriptor);
				});
				// Queue a change event
				this.enqueueTiddlerEvent(title,true);
			}
		};

		// Get a tiddler from the store
		this.getTiddler = function(title) {
			if(title) {
				const t = tiddlers[title];
				if(t !== undefined) {
					return t;
				} else {
					const s = shadowTiddlers[title];
					if(s !== undefined) {
						return s.tiddler;
					}
				}
			}
			return undefined;
		};

		// Get an array of all tiddler titles
		this.allTitles = function() {
			return [...getTiddlerTitles()];
		};

		// Iterate through all tiddler titles
		this.each = function(callback) {
			const titles = getTiddlerTitles();
			let index; let titlesLength; let title;
			for(index = 0,titlesLength = titles.length;index < titlesLength;index++) {
				title = titles[index];
				callback(tiddlers[title],title);
			}
		};

		// Get an array of all shadow tiddler titles
		this.allShadowTitles = function() {
			return [...getShadowTiddlerTitles()];
		};

		// Iterate through all shadow tiddler titles
		this.eachShadow = function(callback) {
			const titles = getShadowTiddlerTitles();
			let index; let titlesLength; let title;
			for(index = 0,titlesLength = titles.length;index < titlesLength;index++) {
				title = titles[index];
				if(tiddlers[title]) {
					callback(tiddlers[title],title);
				} else {
					const shadowInfo = shadowTiddlers[title];
					callback(shadowInfo.tiddler,title);
				}
			}
		};

		// Iterate through all tiddlers and then the shadows
		this.eachTiddlerPlusShadows = function(callback) {
			let index; let titlesLength; let title;
			let titles = getTiddlerTitles();
			for(index = 0,titlesLength = titles.length;index < titlesLength;index++) {
				title = titles[index];
				callback(tiddlers[title],title);
			}
			titles = getShadowTiddlerTitles();
			for(index = 0,titlesLength = titles.length;index < titlesLength;index++) {
				title = titles[index];
				if(!tiddlers[title]) {
					const shadowInfo = shadowTiddlers[title];
					callback(shadowInfo.tiddler,title);
				}
			}
		};

		// Iterate through all the shadows and then the tiddlers
		this.eachShadowPlusTiddlers = function(callback) {
			let index; let titlesLength; let title;
			let titles = getShadowTiddlerTitles();
			for(index = 0,titlesLength = titles.length;index < titlesLength;index++) {
				title = titles[index];
				if(tiddlers[title]) {
					callback(tiddlers[title],title);
				} else {
					const shadowInfo = shadowTiddlers[title];
					callback(shadowInfo.tiddler,title);
				}
			}
			titles = getTiddlerTitles();
			for(index = 0,titlesLength = titles.length;index < titlesLength;index++) {
				title = titles[index];
				if(!shadowTiddlers[title]) {
					callback(tiddlers[title],title);
				}
			}
		};

		// Test for the existence of a tiddler (excludes shadow tiddlers)
		this.tiddlerExists = function(title) {
			return !!$tw.utils.hop(tiddlers,title);
		};

		// Determines if a tiddler is a shadow tiddler, regardless of whether it has been overridden by a real tiddler
		this.isShadowTiddler = function(title) {
			return $tw.utils.hop(shadowTiddlers,title);
		};

		this.getShadowSource = function(title) {
			if($tw.utils.hop(shadowTiddlers,title)) {
				return shadowTiddlers[title].source;
			}
			return null;
		};

		// Get an array of all the currently recognised plugin types
		this.getPluginTypes = function() {
			const types = [];
			$tw.utils.each(pluginTiddlers,(pluginTiddler) => {
				const pluginType = pluginTiddler.fields["plugin-type"];
				if(pluginType && !types.includes(pluginType)) {
					types.push(pluginType);
				}
			});
			return types;
		};

		// Read plugin info for all plugins, or just an array of titles. Returns the number of plugins updated or deleted
		this.readPluginInfo = function(titles) {
			const results = {
				modifiedPlugins: [],
				deletedPlugins: []
			};
			$tw.utils.each(titles || getTiddlerTitles(),(title) => {
				const tiddler = tiddlers[title];
				if(tiddler) {
					if(tiddler.fields.type === "application/json" && tiddler.hasField("plugin-type") && tiddler.fields.text) {
						pluginInfo[tiddler.fields.title] = $tw.utils.parseJSONSafe(tiddler.fields.text);
						results.modifiedPlugins.push(tiddler.fields.title);
					}
				} else {
					if(pluginInfo[title]) {
						delete pluginInfo[title];
						results.deletedPlugins.push(title);
					}
				}
			});
			return results;
		};

		// Get plugin info for a plugin
		this.getPluginInfo = function(title) {
			return pluginInfo[title];
		};

		// Register the plugin tiddlers of a particular type, or null/undefined for any type, optionally restricting registration to an array of tiddler titles. Return the array of titles affected
		this.registerPluginTiddlers = function(pluginType,titles) {
			const self = this;
			const registeredTitles = [];
			const checkTiddler = function(tiddler,title) {
				if(tiddler && tiddler.fields.type === "application/json" && tiddler.fields["plugin-type"] && (!pluginType || tiddler.fields["plugin-type"] === pluginType)) {
					const disablingTiddler = self.getTiddler(`$:/config/Plugins/Disabled/${title}`);
					if(title === "$:/core" || !disablingTiddler || (disablingTiddler.fields.text || "").trim() !== "yes") {
						self.unregisterPluginTiddlers(null,[title]); // Unregister the plugin if it's already registered
						pluginTiddlers.push(tiddler);
						registeredTitles.push(tiddler.fields.title);
					}
				}
			};
			if(titles) {
				$tw.utils.each(titles,(title) => {
					checkTiddler(self.getTiddler(title),title);
				});
			} else {
				this.each((tiddler,title) => {
					checkTiddler(tiddler,title);
				});
			}
			return registeredTitles;
		};

		// Unregister the plugin tiddlers of a particular type, or null/undefined for any type, optionally restricting unregistering to an array of tiddler titles. Returns an array of the titles affected
		this.unregisterPluginTiddlers = function(pluginType,titles) {
			const self = this;
			const unregisteredTitles = [];
			// Remove any previous registered plugins of this type
			for(let t = pluginTiddlers.length - 1;t >= 0;t--) {
				const tiddler = pluginTiddlers[t];
				if(tiddler.fields["plugin-type"] && (!pluginType || tiddler.fields["plugin-type"] === pluginType) && (!titles || titles.includes(tiddler.fields.title))) {
					unregisteredTitles.push(tiddler.fields.title);
					pluginTiddlers.splice(t,1);
				}
			}
			return unregisteredTitles;
		};

		// Unpack the currently registered plugins, creating shadow tiddlers for their constituent tiddlers
		this.unpackPluginTiddlers = function() {
			const self = this;
			// Sort the plugin titles by the `plugin-priority` field, if this field is missing, default to 1
			pluginTiddlers.sort((a,b) => {
				const priorityA = "plugin-priority" in a.fields ? a.fields["plugin-priority"] : 1;
				const priorityB = "plugin-priority" in b.fields ? b.fields["plugin-priority"] : 1;
				if(priorityA !== priorityB) {
					return priorityA - priorityB;
				} else if(a.fields.title < b.fields.title) {
					return -1;
				} else if(a.fields.title === b.fields.title) {
					return 0;
				} else {
					return +1;
				}
			});
			// Now go through the plugins in ascending order and assign the shadows
			shadowTiddlers = Object.create(null);
			$tw.utils.each(pluginTiddlers,(tiddler) => {
				// Extract the constituent tiddlers
				if($tw.utils.hop(pluginInfo,tiddler.fields.title)) {
					$tw.utils.each(pluginInfo[tiddler.fields.title].tiddlers,(constituentTiddler,constituentTitle) => {
						// Save the tiddler object
						if(constituentTitle) {
							shadowTiddlers[constituentTitle] = {
								source: tiddler.fields.title,
								tiddler: new $tw.Tiddler(constituentTiddler,{title: constituentTitle})
							};
						}
					});
				}
			});
			shadowTiddlerTitles = null;
			this.clearCache(null);
			this.clearGlobalCache();
			$tw.utils.each(indexers,(indexer) => {
				indexer.rebuild();
			});
		};

		if(this.addIndexersToWiki) {
			this.addIndexersToWiki();
		}
	};

	// Dummy methods that will be filled in after boot
	$tw.Wiki.prototype.clearCache =
		$tw.Wiki.prototype.clearGlobalCache =
		$tw.Wiki.prototype.enqueueTiddlerEvent = function() {};

	// Add an array of tiddlers
	$tw.Wiki.prototype.addTiddlers = function(tiddlers) {
		for(let t = 0;t < tiddlers.length;t++) {
			this.addTiddler(tiddlers[t]);
		}
	};

	/*
	Define all modules stored in ordinary tiddlers
	*/
	$tw.Wiki.prototype.defineTiddlerModules = function() {
		this.each((tiddler,title) => {
			if(tiddler.hasField("module-type")) {
				switch(tiddler.fields.type) {
					case "application/javascript": {
						// We only define modules that haven't already been defined, because in the browser modules in system tiddlers are defined in inline script
						if(!$tw.utils.hop($tw.modules.titles,tiddler.fields.title)) {
							$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],tiddler.fields.text);
						}
						break;
					}
					case "application/json": {
						$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],$tw.utils.parseJSONSafe(tiddler.fields.text));
						break;
					}
					case "application/x-tiddler-dictionary": {
						$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],$tw.utils.parseFields(tiddler.fields.text));
						break;
					}
				}
			}
		});
	};

	/*
	Register all the module tiddlers that have a module type
	*/
	$tw.Wiki.prototype.defineShadowModules = function() {
		const self = this;
		this.eachShadow((tiddler,title) => {
			// Don't define the module if it is overidden by an ordinary tiddler
			if(!self.tiddlerExists(title) && tiddler.hasField("module-type")) {
				// Define the module
				$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],tiddler.fields.text);
			}
		});
	};

	/*
	Enable safe mode by deleting any tiddlers that override a shadow tiddler
	*/
	$tw.Wiki.prototype.processSafeMode = function() {
		const self = this;
		const overrides = [];
		// Find the overriding tiddlers
		this.each((tiddler,title) => {
			if(self.isShadowTiddler(title)) {
				console.log(title);
				overrides.push(title);
			}
		});
		// Assemble a report tiddler
		const titleReportTiddler = "TiddlyWiki Safe Mode";
		const report = [];
		report.push("TiddlyWiki has been started in [[safe mode|https://tiddlywiki.com/static/SafeMode.html]]. All plugins are temporarily disabled. Most customisations have been disabled by renaming the following tiddlers:");
		// Delete the overrides
		overrides.forEach((title) => {
			const tiddler = self.getTiddler(title);
			const newTitle = `SAFE: ${title}`;
			self.deleteTiddler(title);
			self.addTiddler(new $tw.Tiddler(tiddler,{title: newTitle}));
			report.push(`* [[${title}|${newTitle}]]`);
		});
		report.push();
		this.addTiddler(new $tw.Tiddler({title: titleReportTiddler,text: report.join("\n\n")}));
		// Set $:/DefaultTiddlers to point to our report
		this.addTiddler(new $tw.Tiddler({title: "$:/DefaultTiddlers",text: `[[${titleReportTiddler}]]`}));
	};

	/*
	Extracts tiddlers from a typed block of text, specifying default field values
	*/
	$tw.Wiki.prototype.deserializeTiddlers = function(type,text,srcFields,options) {
		srcFields = srcFields || Object.create(null);
		options = options || {};
		let deserializer = $tw.Wiki.tiddlerDeserializerModules[options.deserializer];
		const fields = Object.create(null);
		if(!deserializer) {
			deserializer = $tw.Wiki.tiddlerDeserializerModules[type];
		}
		if(!deserializer && $tw.utils.getFileExtensionInfo(type)) {
			// If we didn't find the serializer, try converting it from an extension to a content type
			type = $tw.utils.getFileExtensionInfo(type).type;
			deserializer = $tw.Wiki.tiddlerDeserializerModules[type];
		}
		if(!deserializer && $tw.config.contentTypeInfo[type]) {
			// see if this type has a different deserializer registered with it
			type = $tw.config.contentTypeInfo[type].deserializerType;
			deserializer = $tw.Wiki.tiddlerDeserializerModules[type];
		}
		if(!deserializer) {
			// If we still don't have a deserializer, treat it as plain text
			deserializer = $tw.Wiki.tiddlerDeserializerModules["text/plain"];
		}
		for(const f in srcFields) {
			fields[f] = srcFields[f];
		}
		if(deserializer) {
			return deserializer.call(this,text,fields,type);
		} else {
			// Return a raw tiddler for unknown types
			fields.text = text;
			return [fields];
		}
	};

	/*
	Register the built in tiddler deserializer modules
	*/
	const deserializeHeaderComment = function(text,fields) {
		const headerCommentRegExp = new RegExp($tw.config.jsModuleHeaderRegExpString,"mg");
		const match = headerCommentRegExp.exec(text);
		fields.text = text;
		if(match) {
			fields = $tw.utils.parseFields(match[1].split(/\r?\n\r?\n/mg)[0],fields);
		}
		return [fields];
	};
	$tw.modules.define("$:/boot/tiddlerdeserializer/js","tiddlerdeserializer",{
		"application/javascript": deserializeHeaderComment
	});
	$tw.modules.define("$:/boot/tiddlerdeserializer/css","tiddlerdeserializer",{
		"text/css": deserializeHeaderComment
	});
	$tw.modules.define("$:/boot/tiddlerdeserializer/tid","tiddlerdeserializer",{
		"application/x-tiddler"(text,fields) {
			const split = text.split(/\r?\n\r?\n/mg);
			if(split.length >= 1) {
				fields = $tw.utils.parseFields(split[0],fields);
			}
			if(split.length >= 2) {
				fields.text = split.slice(1).join("\n\n");
			}
			return [fields];
		}
	});
	$tw.modules.define("$:/boot/tiddlerdeserializer/tids","tiddlerdeserializer",{
		"application/x-tiddlers"(text,fields) {
			const titles = [];
			const tiddlers = [];
			const match = /\r?\n\r?\n/mg.exec(text);
			if(match) {
				fields = $tw.utils.parseFields(text.substr(0,match.index),fields);
				const lines = text.substr(match.index + match[0].length).split(/\r?\n/mg);
				for(let t = 0;t < lines.length;t++) {
					const line = lines[t];
					if(line.charAt(0) !== "#") {
						const colonPos = line.indexOf(":");
						if(colonPos !== -1) {
							const tiddler = $tw.utils.extend(Object.create(null),fields);
							tiddler.title = (tiddler.title || "") + line.substr(0,colonPos).trim();
							if(titles.includes(tiddler.title)) {
								console.log(`Warning: .multids file contains multiple definitions for ${tiddler.title}`);
							}
							titles.push(tiddler.title);
							tiddler.text = line.substr(colonPos + 2).trim();
							tiddlers.push(tiddler);
						}
					}
				}
			}
			return tiddlers;
		}
	});
	$tw.modules.define("$:/boot/tiddlerdeserializer/txt","tiddlerdeserializer",{
		"text/plain"(text,fields,type) {
			fields.text = text;
			fields.type = type || "text/plain";
			return [fields];
		}
	});
	$tw.modules.define("$:/boot/tiddlerdeserializer/html","tiddlerdeserializer",{
		"text/html"(text,fields) {
			fields.text = text;
			fields.type = "text/html";
			return [fields];
		}
	});
	$tw.modules.define("$:/boot/tiddlerdeserializer/json","tiddlerdeserializer",{
		"application/json"(text,fields) {
			const isTiddlerValid = function(data) {
				// Not valid if it's not an object with a title property
				if(typeof (data) !== "object" || !$tw.utils.hop(data,"title")) {
					return false;
				}
				for(const f in data) {
					if($tw.utils.hop(data,f)) {
						// Check field name doesn't contain control characters
						if(typeof (data[f]) !== "string" || /[\x00-\x1F]/.test(f)) {
							return false;
						}
					}
				}
				return true;
			};
			const isTiddlerArrayValid = function(data) {
				for(let t = 0;t < data.length;t++) {
					if(!isTiddlerValid(data[t])) {
						return false;
					}
				}
				return true;
			};
			const data = $tw.utils.parseJSONSafe(text);
			if($tw.utils.isArray(data) && isTiddlerArrayValid(data)) {
				return data;
			} else if(isTiddlerValid(data)) {
				return [data];
			} else {
				// Plain JSON file
				fields.text = text;
				fields.type = "application/json";
				return [fields];
			}
		}
	});

	/////////////////////////// Browser definitions

	if($tw.browser && !$tw.node) {

		/*
		Decrypt any tiddlers stored within the element with the ID "encryptedArea". The function is asynchronous to allow the user to be prompted for a password
			callback: function to be called the decryption is complete
		*/
		$tw.boot.decryptEncryptedTiddlers = function(callback) {
			const encryptedArea = document.getElementById("encryptedStoreArea");
			if(encryptedArea) {
				const encryptedText = encryptedArea.innerHTML;
				let prompt = "Enter a password to decrypt this TiddlyWiki";
				// Prompt for the password
				if($tw.utils.hop($tw.boot,"encryptionPrompts")) {
					prompt = $tw.boot.encryptionPrompts.decrypt;
				}
				$tw.passwordPrompt.createPrompt({
					serviceName: prompt,
					noUserName: true,
					submitText: "Decrypt",
					callback(data) {
						// Attempt to decrypt the tiddlers
						$tw.crypto.setPassword(data.password);
						const decryptedText = $tw.crypto.decrypt(encryptedText);
						if(decryptedText) {
							const json = $tw.utils.parseJSONSafe(decryptedText);
							for(const title in json) {
								$tw.preloadTiddler(json[title]);
							}
							// Call the callback
							callback();
							// Exit and remove the password prompt
							return true;
						} else {
							// We didn't decrypt everything, so continue to prompt for password
							return false;
						}
					}
				});
			} else {
				// Just invoke the callback straight away if there weren't any encrypted tiddlers
				callback();
			}
		};

		/*
		Register a deserializer that can extract tiddlers from the DOM
		*/
		$tw.modules.define("$:/boot/tiddlerdeserializer/dom","tiddlerdeserializer",{
			"(DOM)"(node) {
				const extractTextTiddlers = function(node) {
					let e = node.firstChild;
					while(e && e.nodeName.toLowerCase() !== "pre") {
						e = e.nextSibling;
					}
					const title = node.getAttribute ? node.getAttribute("title") : null;
					if(e && title) {
						const attrs = node.attributes;
						const tiddler = {
							text: $tw.utils.htmlDecode(e.innerHTML)
						};
						for(let i = attrs.length - 1;i >= 0;i--) {
							tiddler[attrs[i].name] = attrs[i].value;
						}
						return [tiddler];
					} else {
						return null;
					}
				};
				const extractModuleTiddlers = function(node) {
					if(node.hasAttribute && node.hasAttribute("data-tiddler-title")) {
						let text = node.innerHTML;
						const s = text.indexOf("{");
						const e = text.lastIndexOf("}");
						if(node.hasAttribute("data-module") && s !== -1 && e !== -1) {
							text = text.substring(s + 1,e);
						}
						const fields = {text};
						const {attributes} = node;
						for(let a = 0;a < attributes.length;a++) {
							if(attributes[a].nodeName.substr(0,13) === "data-tiddler-") {
								fields[attributes[a].nodeName.substr(13)] = attributes[a].value;
							}
						}
						return [fields];
					} else {
						return null;
					}
				};
				let t; let result = [];
				if(node) {
					const type = (node.getAttribute && node.getAttribute("type")) || null;
					if(type) {
						// A new-style container with an explicit deserialization type
						result = $tw.wiki.deserializeTiddlers(type,node.textContent);
					} else {
						// An old-style container of classic DIV-based tiddlers
						for(t = 0;t < node.childNodes.length;t++) {
							const childNode = node.childNodes[t];
							let tiddlers = extractTextTiddlers(childNode);
							tiddlers = tiddlers || extractModuleTiddlers(childNode);
							if(tiddlers) {
								result.push.apply(result,tiddlers);
							}
						}
					}
				}
				return result;
			}
		});

		$tw.loadTiddlersBrowser = function() {
			// In the browser, we load tiddlers from certain elements
			const containerSelectors = [
				// IDs for old-style v5.1.x tiddler stores
				"#libraryModules",
				"#modules",
				"#bootKernelPrefix",
				"#bootKernel",
				"#styleArea",
				"#storeArea",
				"#systemArea",
				// Classes for new-style v5.2.x JSON tiddler stores
				"script.tiddlywiki-tiddler-store"
			];
			for(let t = 0;t < containerSelectors.length;t++) {
				const nodes = document.querySelectorAll(containerSelectors[t]);
				for(let n = 0;n < nodes.length;n++) {
					$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",nodes[n]));
				}
			}
		};

	} else {

		/////////////////////////// Server definitions

		/*
		Get any encrypted tiddlers
		*/
		$tw.boot.decryptEncryptedTiddlers = function(callback) {
			// Storing encrypted tiddlers on the server isn't supported yet
			callback();
		};

	} // End of if($tw.browser && !$tw.node)

	/////////////////////////// Node definitions

	if($tw.node) {

		/*
		Load the tiddlers contained in a particular file (and optionally extract fields from the accompanying .meta file) returned as {filepath:,type:,tiddlers:[],hasMetaFile:}
		*/
		$tw.loadTiddlersFromFile = function(filepath,fields) {
			let ext = path.extname(filepath);
			const extensionInfo = $tw.utils.getFileExtensionInfo(ext);
			const type = extensionInfo ? extensionInfo.type : null;
			const typeInfo = type ? $tw.config.contentTypeInfo[type] : null;
			const fileSize = fs.statSync(filepath).size;
			let data;
			if(fileSize > $tw.config.maxEditFileSize) {
				data = `File ${filepath}not loaded because it is too large`;
				console.log(`Warning: ${data}`);
				ext = ".txt";
			} else {
				data = fs.readFileSync(filepath,typeInfo ? typeInfo.encoding : "utf8");
			}
			let tiddlers = $tw.wiki.deserializeTiddlers(ext,data,fields);
			const metadata = $tw.loadMetadataForFile(filepath);
			if(metadata) {
				if(type === "application/json") {
					tiddlers = [{text: data,type: "application/json"}];
				}
				tiddlers = [$tw.utils.extend({},tiddlers[0],metadata)];
			}
			return {filepath,type,tiddlers,hasMetaFile: !!metadata};
		};

		/*
		Load the metadata fields in the .meta file corresponding to a particular file
		*/
		$tw.loadMetadataForFile = function(filepath) {
			const metafilename = `${filepath}.meta`;
			if(fs.existsSync(metafilename)) {
				return $tw.utils.parseFields(fs.readFileSync(metafilename,"utf8") || "");
			} else {
				return null;
			}
		};

		/*
		A default set of files for TiddlyWiki to ignore during load.
		This matches what NPM ignores, and adds "*.meta" to ignore tiddler
		metadata files.
		*/
		$tw.boot.excludeRegExp = /^\.DS_Store$|^.*\.meta$|^\..*\.swp$|^\._.*$|^\.git$|^\.github$|^\.vscode$|^\.hg$|^\.lock-wscript$|^\.svn$|^\.wafpickle-.*$|^CVS$|^npm-debug\.log$/;

		/*
		Load all the tiddlers recursively from a directory, including honouring `tiddlywiki.files` files for drawing in external files. Returns an array of {filepath:,type:,tiddlers: [{..fields...}],hasMetaFile:}. Note that no file information is returned for externally loaded tiddlers, just the `tiddlers` property.
		*/
		$tw.loadTiddlersFromPath = function(filepath,excludeRegExp) {
			excludeRegExp = excludeRegExp || $tw.boot.excludeRegExp;
			const tiddlers = [];
			if(fs.existsSync(filepath)) {
				const stat = fs.statSync(filepath);
				if(stat.isDirectory()) {
					const files = fs.readdirSync(filepath);
					// Look for a tiddlywiki.files file
					if(files.includes("tiddlywiki.files")) {
						Array.prototype.push.apply(tiddlers,$tw.loadTiddlersFromSpecification(filepath,excludeRegExp));
					} else {
						// If not, read all the files in the directory
						$tw.utils.each(files,(file) => {
							if(!excludeRegExp.test(file) && file !== "plugin.info") {
								tiddlers.push.apply(tiddlers,$tw.loadTiddlersFromPath(filepath + path.sep + file,excludeRegExp));
							}
						});
					}
				} else if(stat.isFile()) {
					tiddlers.push($tw.loadTiddlersFromFile(filepath,{title: filepath}));
				}
			}
			return tiddlers;
		};

		/*
		Load all the tiddlers defined by a `tiddlywiki.files` specification file
		filepath: pathname of the directory containing the specification file
		*/
		$tw.loadTiddlersFromSpecification = function(filepath,excludeRegExp) {
			const tiddlers = [];
			// Read the specification
			const filesInfo = $tw.utils.parseJSONSafe(fs.readFileSync(`${filepath + path.sep}tiddlywiki.files`,"utf8"));
			// Helper to process a file
			const processFile = function(filename,isTiddlerFile,fields,isEditableFile,rootPath) {
				const extInfo = $tw.config.fileExtensionInfo[path.extname(filename)];
				const type = (extInfo || {}).type || fields.type || "text/plain";
				const typeInfo = $tw.config.contentTypeInfo[type] || {};
				const pathname = path.resolve(filepath,filename);
				const text = fs.readFileSync(pathname,typeInfo.encoding || "utf8");
				const metadata = $tw.loadMetadataForFile(pathname) || {};
				let fileTiddlers;
				if(isTiddlerFile) {
					fileTiddlers = $tw.wiki.deserializeTiddlers(path.extname(pathname),text,metadata) || [];
				} else {
					fileTiddlers = [$tw.utils.extend({text},metadata)];
				}
				const combinedFields = $tw.utils.extend({},fields,metadata);
				$tw.utils.each(fileTiddlers,(tiddler) => {
					$tw.utils.each(combinedFields,(fieldInfo,name) => {
						if(typeof fieldInfo === "string" || $tw.utils.isArray(fieldInfo)) {
							tiddler[name] = fieldInfo;
						} else {
							let value = tiddler[name];
							switch(fieldInfo.source) {
								case "subdirectories": {
									value = $tw.utils.stringifyList(path.relative(rootPath,filename).split(path.sep).slice(0,-1));
									break;
								}
								case "filepath": {
									value = path.relative(rootPath,filename).split(path.sep).join('/');
									break;
								}
								case "filename": {
									value = path.basename(filename);
									break;
								}
								case "filename-uri-decoded": {
									value = $tw.utils.decodeURIComponentSafe(path.basename(filename));
									break;
								}
								case "basename": {
									value = path.basename(filename,path.extname(filename));
									break;
								}
								case "basename-uri-decoded": {
									value = $tw.utils.decodeURIComponentSafe(path.basename(filename,path.extname(filename)));
									break;
								}
								case "extname": {
									value = path.extname(filename);
									break;
								}
								case "created": {
									value = $tw.utils.stringifyDate(new Date(fs.statSync(pathname).birthtime));
									break;
								}
								case "modified": {
									value = $tw.utils.stringifyDate(new Date(fs.statSync(pathname).mtime));
									break;
								}
							}
							if(fieldInfo.prefix) {
								value = fieldInfo.prefix + value;
							}
							if(fieldInfo.suffix) {
								value += fieldInfo.suffix;
							}
							tiddler[name] = value;
						}
					});
				});
				if(isEditableFile) {
					tiddlers.push({filepath: pathname,hasMetaFile: !!metadata && !isTiddlerFile,isEditableFile: true,tiddlers: fileTiddlers});
				} else {
					tiddlers.push({tiddlers: fileTiddlers});
				}
			};
			// Helper to recursively search subdirectories
			const getAllFiles = function(dirPath,recurse,arrayOfFiles) {
				recurse = recurse || false;
				arrayOfFiles = arrayOfFiles || [];
				const files = fs.readdirSync(dirPath);
				files.forEach((file) => {
					if(recurse && fs.statSync(dirPath + path.sep + file).isDirectory()) {
						arrayOfFiles = getAllFiles(dirPath + path.sep + file,recurse,arrayOfFiles);
					} else if(fs.statSync(dirPath + path.sep + file).isFile()) {
						arrayOfFiles.push(path.join(dirPath,path.sep,file));
					}
				});
				return arrayOfFiles;
			};
			// Process the listed tiddlers
			$tw.utils.each(filesInfo.tiddlers,(tidInfo) => {
				if(tidInfo.prefix && tidInfo.suffix) {
					tidInfo.fields.text = {prefix: tidInfo.prefix,suffix: tidInfo.suffix};
				} else if(tidInfo.prefix) {
					tidInfo.fields.text = {prefix: tidInfo.prefix};
				} else if(tidInfo.suffix) {
					tidInfo.fields.text = {suffix: tidInfo.suffix};
				}
				processFile(tidInfo.file,tidInfo.isTiddlerFile,tidInfo.fields);
			});
			// Process any listed directories
			$tw.utils.each(filesInfo.directories,(dirSpec) => {
				// Read literal directories directly
				if(typeof dirSpec === "string") {
					const pathname = path.resolve(filepath,dirSpec);
					if(fs.existsSync(pathname) && fs.statSync(pathname).isDirectory()) {
						tiddlers.push.apply(tiddlers,$tw.loadTiddlersFromPath(pathname,excludeRegExp));
					}
				} else {
					// Process directory specifier
					const dirPath = path.resolve(filepath,dirSpec.path);
					if(fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
						const files = getAllFiles(dirPath,dirSpec.searchSubdirectories);
						const fileRegExp = new RegExp(dirSpec.filesRegExp || "^.*$");
						const metaRegExp = /^.*\.meta$/;
						for(let t = 0;t < files.length;t++) {
							const thisPath = path.relative(filepath,files[t]);
							const filename = path.basename(thisPath);
							if(filename !== "tiddlywiki.files" && !metaRegExp.test(filename) && fileRegExp.test(filename)) {
								processFile(thisPath,dirSpec.isTiddlerFile,dirSpec.fields,dirSpec.isEditableFile,dirSpec.path);
							}
						}
					} else {
						console.log("Warning: a directory in a tiddlywiki.files file does not exist.");
						console.log(`dirPath: ${dirPath}`);
						console.log(`tiddlywiki.files location: ${filepath}`);
					}
				}
			});
			return tiddlers;
		};

		/*
		Load the tiddlers from a plugin folder, and package them up into a proper JSON plugin tiddler
		*/
		$tw.loadPluginFolder = function(filepath,excludeRegExp) {
			excludeRegExp = excludeRegExp || $tw.boot.excludeRegExp;
			const infoPath = `${filepath + path.sep}plugin.info`;
			if(fs.existsSync(filepath) && fs.statSync(filepath).isDirectory()) {
				// Read the plugin information
				if(!fs.existsSync(infoPath) || !fs.statSync(infoPath).isFile()) {
					console.log(`Warning: missing plugin.info file in ${filepath}`);
					return null;
				}
				let pluginInfo = $tw.utils.parseJSONSafe(fs.readFileSync(infoPath,"utf8"),() => {return null;});
				if(!pluginInfo) {
					console.log(`warning: invalid JSON in plugin.info file at ${infoPath}`);
					pluginInfo = {};
				}
				// Read the plugin files
				const pluginFiles = $tw.loadTiddlersFromPath(filepath,excludeRegExp);
				// Save the plugin tiddlers into the plugin info
				pluginInfo.tiddlers = pluginInfo.tiddlers || Object.create(null);
				for(let f = 0;f < pluginFiles.length;f++) {
					const {tiddlers} = pluginFiles[f];
					for(let t = 0;t < tiddlers.length;t++) {
						const tiddler = tiddlers[t];
						if(tiddler.title) {
							pluginInfo.tiddlers[tiddler.title] = tiddler;
						}
					}
				}
				// Give the plugin the same version number as the core if it doesn't have one
				if(!("version" in pluginInfo)) {
					pluginInfo.version = $tw.packageInfo.version;
				}
				// Use "plugin" as the plugin-type if we don't have one
				if(!("plugin-type" in pluginInfo)) {
					pluginInfo["plugin-type"] = "plugin";
				}
				pluginInfo.dependents = pluginInfo.dependents || [];
				pluginInfo.type = "application/json";
				// Set plugin text
				pluginInfo.text = JSON.stringify({tiddlers: pluginInfo.tiddlers});
				delete pluginInfo.tiddlers;
				// Deserialise array fields (currently required for the dependents field)
				for(const field in pluginInfo) {
					if($tw.utils.isArray(pluginInfo[field])) {
						pluginInfo[field] = $tw.utils.stringifyList(pluginInfo[field]);
					}
				}
				return pluginInfo;
			} else {
				return null;
			}
		};

		/*
		name: Name of the plugin to find
		paths: array of file paths to search for it
		Returns the path of the plugin folder
		*/
		$tw.findLibraryItem = function(name,paths) {
			let pathIndex = 0;
			do {
				const pluginPath = path.resolve(paths[pathIndex],`./${name}`);
				if(fs.existsSync(pluginPath) && fs.statSync(pluginPath).isDirectory()) {
					return pluginPath;
				}
			} while(++pathIndex < paths.length);
			return null;
		};

		/*
		name: Name of the plugin to load
		paths: array of file paths to search for it
		*/
		$tw.loadPlugin = function(name,paths) {
			const pluginPath = $tw.findLibraryItem(name,paths);
			if(pluginPath) {
				const pluginFields = $tw.loadPluginFolder(pluginPath);
				if(pluginFields) {
					$tw.wiki.addTiddler(pluginFields);
					return;
				}
			}
			console.log(`Warning: Cannot find plugin '${name}'`);
		};

		/*
		libraryPath: Path of library folder for these plugins (relative to core path)
		envVar: Environment variable name for these plugins
		Returns an array of search paths
		*/
		$tw.getLibraryItemSearchPaths = function(libraryPath,envVar) {
			const pluginPaths = [path.resolve($tw.boot.corePath,libraryPath)];
			let env;
			if(envVar) {
				env = process.env[envVar];
				if(env) {
					env.split(path.delimiter).map((item) => {
						if(item) {
							pluginPaths.push(item);
						}
					});
				}
			}
			return pluginPaths;
		};

		/*
		plugins: Array of names of plugins (eg, "tiddlywiki/filesystemadaptor")
		libraryPath: Path of library folder for these plugins (relative to core path)
		envVar: Environment variable name for these plugins
		*/
		$tw.loadPlugins = function(plugins,libraryPath,envVar) {
			if(plugins) {
				const pluginPaths = $tw.getLibraryItemSearchPaths(libraryPath,envVar);
				for(let t = 0;t < plugins.length;t++) {
					$tw.loadPlugin(plugins[t],pluginPaths);
				}
			}
		};

		/*
		path: path of wiki directory
		options:
			parentPaths: array of parent paths that we mustn't recurse into
			readOnly: true if the tiddler file paths should not be retained
		*/
		$tw.loadWikiTiddlers = function(wikiPath,options) {
			options = options || {};
			let parentPaths = options.parentPaths || [];
			const wikiInfoPath = path.resolve(wikiPath,$tw.config.wikiInfo);
			let wikiInfo;
			let pluginFields;
			// Bail if we don't have a wiki info file
			if(fs.existsSync(wikiInfoPath)) {
				wikiInfo = $tw.utils.parseJSONSafe(fs.readFileSync(wikiInfoPath,"utf8"),() => {return null;});
				if(!wikiInfo) {
					console.log(`warning: invalid JSON in tiddlywiki.info file at ${wikiInfoPath}`);
					wikiInfo = {};
				}
			} else {
				return null;
			}
			// Save the path to the tiddlers folder for the filesystemadaptor
			const config = wikiInfo.config || {};
			if($tw.boot.wikiPath == wikiPath) {
				$tw.boot.wikiTiddlersPath = path.resolve($tw.boot.wikiPath,config["default-tiddler-location"] || $tw.config.wikiTiddlersSubDir);
			}
			// Load any parent wikis
			if(wikiInfo.includeWikis) {
				parentPaths = [...parentPaths];
				parentPaths.push(wikiPath);
				$tw.utils.each(wikiInfo.includeWikis,(info) => {
					if(typeof info === "string") {
						info = {path: info};
					}
					const resolvedIncludedWikiPath = path.resolve(wikiPath,info.path);
					if(!parentPaths.includes(resolvedIncludedWikiPath)) {
						const subWikiInfo = $tw.loadWikiTiddlers(resolvedIncludedWikiPath,{
							parentPaths,
							readOnly: info["read-only"]
						});
						// Merge the build targets
						wikiInfo.build = $tw.utils.extend([],subWikiInfo.build,wikiInfo.build);
					} else {
						$tw.utils.error(`Cannot recursively include wiki ${resolvedIncludedWikiPath}`);
					}
				});
			}
			// Load any plugins, themes and languages listed in the wiki info file
			$tw.loadPlugins(wikiInfo.plugins,$tw.config.pluginsPath,$tw.config.pluginsEnvVar);
			$tw.loadPlugins(wikiInfo.themes,$tw.config.themesPath,$tw.config.themesEnvVar);
			$tw.loadPlugins(wikiInfo.languages,$tw.config.languagesPath,$tw.config.languagesEnvVar);
			// Load the wiki files, registering them as writable
			const resolvedWikiPath = path.resolve(wikiPath,$tw.config.wikiTiddlersSubDir);
			$tw.utils.each($tw.loadTiddlersFromPath(resolvedWikiPath),(tiddlerFile) => {
				if(!options.readOnly && tiddlerFile.filepath) {
					$tw.utils.each(tiddlerFile.tiddlers,(tiddler) => {
						$tw.boot.files[tiddler.title] = {
							filepath: tiddlerFile.filepath,
							type: tiddlerFile.type,
							hasMetaFile: tiddlerFile.hasMetaFile,
							isEditableFile: config["retain-original-tiddler-path"] || tiddlerFile.isEditableFile || tiddlerFile.filepath.indexOf($tw.boot.wikiTiddlersPath) !== 0
						};
					});
				}
				$tw.wiki.addTiddlers(tiddlerFile.tiddlers);
			});
			if($tw.boot.wikiPath == wikiPath) {
				// Save the original tiddler file locations if requested
				const output = {}; let relativePath; let fileInfo;
				for(const title in $tw.boot.files) {
					fileInfo = $tw.boot.files[title];
					if(fileInfo.isEditableFile) {
						relativePath = path.relative($tw.boot.wikiTiddlersPath,fileInfo.filepath);
						fileInfo.originalpath = relativePath;
						output[title] =
							path.sep === "/" ?
								relativePath :
								relativePath.split(path.sep).join("/");
					}
				}
				if(Object.keys(output).length > 0) {
					$tw.wiki.addTiddler({title: "$:/config/OriginalTiddlerPaths",type: "application/json",text: JSON.stringify(output)});
				}
			}
			// Load any plugins within the wiki folder
			const wikiPluginsPath = path.resolve(wikiPath,$tw.config.wikiPluginsSubDir);
			if(fs.existsSync(wikiPluginsPath)) {
				const pluginFolders = fs.readdirSync(wikiPluginsPath);
				for(var t = 0;t < pluginFolders.length;t++) {
					pluginFields = $tw.loadPluginFolder(path.resolve(wikiPluginsPath,`./${pluginFolders[t]}`));
					if(pluginFields) {
						$tw.wiki.addTiddler(pluginFields);
					}
				}
			}
			// Load any themes within the wiki folder
			const wikiThemesPath = path.resolve(wikiPath,$tw.config.wikiThemesSubDir);
			if(fs.existsSync(wikiThemesPath)) {
				const themeFolders = fs.readdirSync(wikiThemesPath);
				for(var t = 0;t < themeFolders.length;t++) {
					pluginFields = $tw.loadPluginFolder(path.resolve(wikiThemesPath,`./${themeFolders[t]}`));
					if(pluginFields) {
						$tw.wiki.addTiddler(pluginFields);
					}
				}
			}
			// Load any languages within the wiki folder
			const wikiLanguagesPath = path.resolve(wikiPath,$tw.config.wikiLanguagesSubDir);
			if(fs.existsSync(wikiLanguagesPath)) {
				const languageFolders = fs.readdirSync(wikiLanguagesPath);
				for(var t = 0;t < languageFolders.length;t++) {
					pluginFields = $tw.loadPluginFolder(path.resolve(wikiLanguagesPath,`./${languageFolders[t]}`));
					if(pluginFields) {
						$tw.wiki.addTiddler(pluginFields);
					}
				}
			}
			return wikiInfo;
		};

		$tw.loadTiddlersNode = function() {
			// Load the boot tiddlers
			$tw.utils.each($tw.loadTiddlersFromPath($tw.boot.bootPath),(tiddlerFile) => {
				$tw.wiki.addTiddlers(tiddlerFile.tiddlers);
			});
			// Load the core tiddlers
			$tw.wiki.addTiddler($tw.loadPluginFolder($tw.boot.corePath));
			// Load any extra plugins
			$tw.utils.each($tw.boot.extraPlugins,(name) => {
				if(name.charAt(0) === "+") { // Relative path to plugin
					const pluginFields = $tw.loadPluginFolder(name.substring(1));
					if(pluginFields) {
						$tw.wiki.addTiddler(pluginFields);
					}
				} else {
					const parts = name.split("/");
					const type = parts[0];
					if(parts.length === 3 && ["plugins","themes","languages"].includes(type)) {
						$tw.loadPlugins([`${parts[1]}/${parts[2]}`],$tw.config[`${type}Path`],$tw.config[`${type}EnvVar`]);
					}
				}
			});
			// Load the tiddlers from the wiki directory
			if($tw.boot.wikiPath) {
				$tw.boot.wikiInfo = $tw.loadWikiTiddlers($tw.boot.wikiPath);
			}
		};

		// End of if($tw.node)
	}

	/////////////////////////// Main startup function called once tiddlers have been decrypted

	/*
	Startup TiddlyWiki
	*/
	$tw.boot.initStartup = function(options) {
		// Get the URL hash and check for safe mode
		$tw.locationHash = "#";
		if($tw.browser && !$tw.node) {
			if(location.hash === "#:safe") {
				$tw.safeMode = true;
			} else {
				$tw.locationHash = $tw.utils.getLocationHash();
			}
		}
		// Initialise some more $tw properties
		$tw.utils.deepDefaults($tw,{
			modules: { // Information about each module
				titles: Object.create(null), // hashmap by module title of {fn:, exports:, moduleType:}
				types: {} // hashmap by module type of hashmap of exports
			},
			config: { // Configuration overridables
				pluginsPath: "../plugins/",
				themesPath: "../themes/",
				languagesPath: "../languages/",
				editionsPath: "../editions/",
				wikiInfo: "./tiddlywiki.info",
				wikiPluginsSubDir: "./plugins",
				wikiThemesSubDir: "./themes",
				wikiLanguagesSubDir: "./languages",
				wikiTiddlersSubDir: "./tiddlers",
				wikiOutputSubDir: "./output",
				jsModuleHeaderRegExpString: String.raw`^\/\*\\(?:\r?\n)((?:^[^\r\n]*(?:\r?\n))+?)(^\\\*\/$(?:\r?\n)?)`,
				fileExtensionInfo: Object.create(null), // Map file extension to {type:}
				contentTypeInfo: Object.create(null), // Map type to {encoding:,extension:}
				pluginsEnvVar: "TIDDLYWIKI_PLUGIN_PATH",
				themesEnvVar: "TIDDLYWIKI_THEME_PATH",
				languagesEnvVar: "TIDDLYWIKI_LANGUAGE_PATH",
				editionsEnvVar: "TIDDLYWIKI_EDITION_PATH"
			},
			log: {}, // Log flags
			unloadTasks: []
		});
		if(!$tw.boot.tasks.readBrowserTiddlers) {
			// For writable tiddler files, a hashmap of title to {filepath:,type:,hasMetaFile:}
			$tw.boot.files = Object.create(null);
			// System paths and filenames
			$tw.boot.bootPath = options.bootPath || path.dirname(module.filename);
			$tw.boot.corePath = path.resolve($tw.boot.bootPath,"../core");
			// If there's no arguments then default to `--help`
			if($tw.boot.argv.length === 0) {
				$tw.boot.argv = ["--help"];
			}
			// Parse any extra plugin references
			$tw.boot.extraPlugins = $tw.boot.extraPlugins || [];
			while($tw.boot.argv[0] && $tw.boot.argv[0].indexOf("+") === 0) {
				$tw.boot.extraPlugins.push($tw.boot.argv[0].substring(1));
				$tw.boot.argv.splice(0,1);
			}
			// If the first command line argument doesn't start with `--` then we
			// interpret it as the path to the wiki folder, which will otherwise default
			// to the current folder
			if($tw.boot.argv[0] && $tw.boot.argv[0].indexOf("--") !== 0) {
				$tw.boot.wikiPath = $tw.boot.argv[0];
				$tw.boot.argv = $tw.boot.argv.slice(1);
			} else {
				$tw.boot.wikiPath = process.cwd();
			}
			// Read package info
			$tw.packageInfo = $tw.packageInfo || require("../package.json");
			// Check node version number
			if(!$tw.utils.checkVersions(process.version.substr(1),$tw.packageInfo.engines.node.substr(2))) {
				$tw.utils.error(`TiddlyWiki5 requires node.js version ${$tw.packageInfo.engines.node}`);
			}
		}
		// Add file extension information
		$tw.utils.registerFileType("text/vnd.tiddlywiki","utf8",".tid");
		$tw.utils.registerFileType("application/x-tiddler","utf8",".tid");
		$tw.utils.registerFileType("application/x-tiddlers","utf8",".multids");
		$tw.utils.registerFileType("application/x-tiddler-html-div","utf8",".tiddler");
		$tw.utils.registerFileType("text/vnd.tiddlywiki2-recipe","utf8",".recipe");
		$tw.utils.registerFileType("text/plain","utf8",".txt");
		$tw.utils.registerFileType("text/css","utf8",".css");
		$tw.utils.registerFileType("text/html","utf8",[".html",".htm"]);
		$tw.utils.registerFileType("application/hta","utf16le",".hta",{deserializerType: "text/html"});
		$tw.utils.registerFileType("application/javascript","utf8",".js");
		$tw.utils.registerFileType("application/json","utf8",".json");
		$tw.utils.registerFileType("application/pdf","base64",".pdf",{flags: ["image"]});
		$tw.utils.registerFileType("application/zip","base64",".zip");
		$tw.utils.registerFileType("application/x-zip-compressed","base64",".zip");
		$tw.utils.registerFileType("image/jpeg","base64",[".jpg",".jpeg"],{flags: ["image"]});
		$tw.utils.registerFileType("image/jpg","base64",[".jpg",".jpeg"],{flags: ["image"]});
		$tw.utils.registerFileType("image/png","base64",".png",{flags: ["image"]});
		$tw.utils.registerFileType("image/gif","base64",".gif",{flags: ["image"]});
		$tw.utils.registerFileType("image/webp","base64",".webp",{flags: ["image"]});
		$tw.utils.registerFileType("image/heic","base64",".heic",{flags: ["image"]});
		$tw.utils.registerFileType("image/heif","base64",".heif",{flags: ["image"]});
		$tw.utils.registerFileType("image/avif","base64",".avif",{flags: ["image"]});
		$tw.utils.registerFileType("image/svg+xml","utf8",".svg",{flags: ["image"]});
		$tw.utils.registerFileType("image/vnd.microsoft.icon","base64",".ico",{flags: ["image"]});
		$tw.utils.registerFileType("image/x-icon","base64",".ico",{flags: ["image"]});
		$tw.utils.registerFileType("application/wasm","base64",".wasm");
		$tw.utils.registerFileType("font/woff","base64",".woff");
		$tw.utils.registerFileType("font/woff2","base64",".woff2");
		$tw.utils.registerFileType("font/ttf","base64",".ttf");
		$tw.utils.registerFileType("font/otf","base64",".otf");
		$tw.utils.registerFileType("audio/ogg","base64",".ogg");
		$tw.utils.registerFileType("audio/mp4","base64",[".mp4",".m4a"]);
		$tw.utils.registerFileType("video/ogg","base64",[".ogm",".ogv",".ogg"]);
		$tw.utils.registerFileType("video/webm","base64",".webm");
		$tw.utils.registerFileType("video/mp4","base64",".mp4");
		$tw.utils.registerFileType("audio/mp3","base64",".mp3");
		$tw.utils.registerFileType("audio/mpeg","base64",[".mp3",".m2a",".mp2",".mpa",".mpg",".mpga"]);
		$tw.utils.registerFileType("text/markdown","utf8",[".md",".markdown"],{deserializerType: "text/x-markdown"});
		$tw.utils.registerFileType("text/x-markdown","utf8",[".md",".markdown"]);
		$tw.utils.registerFileType("application/enex+xml","utf8",".enex");
		$tw.utils.registerFileType("application/vnd.openxmlformats-officedocument.wordprocessingml.document","base64",".docx");
		$tw.utils.registerFileType("application/msword","base64",".doc");
		$tw.utils.registerFileType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","base64",".xlsx");
		$tw.utils.registerFileType("application/excel","base64",".xls");
		$tw.utils.registerFileType("application/vnd.ms-excel","base64",".xls");
		$tw.utils.registerFileType("application/vnd.openxmlformats-officedocument.presentationml.presentation","base64",".pptx");
		$tw.utils.registerFileType("application/mspowerpoint","base64",".ppt");
		$tw.utils.registerFileType("text/x-bibtex","utf8",".bib",{deserializerType: "application/x-bibtex"});
		$tw.utils.registerFileType("application/x-bibtex","utf8",".bib");
		$tw.utils.registerFileType("application/epub+zip","base64",".epub");
		$tw.utils.registerFileType("application/octet-stream","base64",".octet-stream");
		// Create the wiki store for the app
		$tw.wiki = new $tw.Wiki($tw.safeMode && {enableIndexers: []});
		// Install built in tiddler fields modules
		$tw.Tiddler.fieldModules = $tw.modules.getModulesByTypeAsHashmap("tiddlerfield");
		// Install the tiddler deserializer modules
		$tw.Wiki.tiddlerDeserializerModules = Object.create(null);
		$tw.modules.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerModules);
		// Call unload handlers in the browser
		if($tw.browser) {
			window.onbeforeunload = function(event) {
				event = event || {};
				let result;
				$tw.utils.each($tw.unloadTasks,(task) => {
					const r = task(event);
					if(r) {
						result = r;
					}
				});
				return result;
			};
		}
	};
	$tw.boot.loadStartup = function(options) {

		// Load tiddlers
		if($tw.boot.tasks.readBrowserTiddlers) {
			$tw.loadTiddlersBrowser();
		} else {
			$tw.loadTiddlersNode();
		}
		// Load any preloaded tiddlers
		if($tw.preloadTiddlers) {
			$tw.wiki.addTiddlers($tw.preloadTiddlers);
		}
		// Give hooks a chance to modify the store
		$tw.hooks.invokeHook("th-boot-tiddlers-loaded");
	};
	$tw.boot.execStartup = function(options) {
		// Unpack plugin tiddlers
		$tw.wiki.readPluginInfo();
		$tw.wiki.registerPluginTiddlers("plugin",$tw.safeMode ? ["$:/core"] : undefined);
		$tw.wiki.unpackPluginTiddlers();
		// Process "safe mode"
		if($tw.safeMode) {
			$tw.wiki.processSafeMode();
		}
		// Register typed modules from the tiddlers we've just loaded
		$tw.wiki.defineTiddlerModules();
		// And any modules within plugins
		$tw.wiki.defineShadowModules();
		// Make sure the crypto state tiddler is up to date
		if($tw.crypto) {
			$tw.crypto.updateCryptoStateTiddler();
		}
		// Gather up any startup modules
		$tw.boot.remainingStartupModules = []; // Array of startup modules
		$tw.modules.forEachModuleOfType("startup",(title,module) => {
			if(module.startup) {
				$tw.boot.remainingStartupModules.push(module);
			}
		});
		// Keep track of the startup tasks that have been executed
		$tw.boot.executedStartupModules = Object.create(null);
		$tw.boot.disabledStartupModules = $tw.boot.disabledStartupModules || [];
		// Repeatedly execute the next eligible task
		$tw.boot.executeNextStartupTask(options.callback);
	};
	/*
	Startup TiddlyWiki
	*/
	$tw.boot.startup = function(options) {
		options = options || {};
		// Get the URL hash and check for safe mode
		$tw.boot.initStartup(options);
		$tw.boot.loadStartup(options);
		$tw.boot.execStartup(options);
	};

	/*
	Add another unload task
	*/
	$tw.addUnloadTask = function(task) {
		if(!$tw.unloadTasks.includes(task)) {
			$tw.unloadTasks.push(task);
		}
	};

	/*
	Execute the remaining eligible startup tasks
	*/
	$tw.boot.executeNextStartupTask = function(callback) {
		// Find the next eligible task
		let taskIndex = 0; let task;
		const asyncTaskCallback = function() {
			if(task.name) {
				$tw.boot.executedStartupModules[task.name] = true;
			}
			return $tw.boot.executeNextStartupTask(callback);
		};
		while(taskIndex < $tw.boot.remainingStartupModules.length) {
			task = $tw.boot.remainingStartupModules[taskIndex];
			if($tw.boot.isStartupTaskEligible(task)) {
				// Remove this task from the list
				$tw.boot.remainingStartupModules.splice(taskIndex,1);
				// Assemble log message
				const s = ["Startup task:",task.name];
				if(task.platforms) {
					s.push("platforms:",task.platforms.join(","));
				}
				if(task.after) {
					s.push("after:",task.after.join(","));
				}
				if(task.before) {
					s.push("before:",task.before.join(","));
				}
				$tw.boot.log(s.join(" "));
				// Execute task
				if(!$tw.utils.hop(task,"synchronous") || task.synchronous) {
					task.startup();
					if(task.name) {
						$tw.boot.executedStartupModules[task.name] = true;
					}
					return $tw.boot.executeNextStartupTask(callback);
				} else {
					task.startup(asyncTaskCallback);
					return true;
				}
			}
			taskIndex++;
		}
		if(typeof callback === 'function') {
			callback();
		}
		return false;
	};

	/*
	Returns true if we are running on one of the platforms specified in taskModule's
	`platforms` array; or if `platforms` property is not defined.
	*/
	$tw.boot.doesTaskMatchPlatform = function(taskModule) {
		const {platforms} = taskModule;
		if(platforms) {
			for(let t = 0;t < platforms.length;t++) {
				switch(platforms[t]) {
					case "browser": {
						if($tw.browser) {
							return true;
						}
						break;
					}
					case "node": {
						if($tw.node) {
							return true;
						}
						break;
					}
					default: {
						$tw.utils.error(`Module ${taskModule.name}: '${platforms[t]}' in export.platforms invalid`);
					}
				}
			}
			return false;
		}
		return true;
	};

	$tw.boot.isStartupTaskEligible = function(taskModule) {
		let t;
		// Check that the platform is correct
		if(!$tw.boot.doesTaskMatchPlatform(taskModule)) {
			return false;
		}
		const {name} = taskModule;
		const remaining = $tw.boot.remainingStartupModules;
		if(name) {
			// Fail if this module is disabled
			if($tw.boot.disabledStartupModules.includes(name)) {
				return false;
			}
			// Check that no other outstanding tasks must be executed before this one
			for(t = 0;t < remaining.length;t++) {
				const task = remaining[t];
				if(task.before && task.before.includes(name)) {
					if($tw.boot.doesTaskMatchPlatform(task) && (!task.name || !$tw.boot.disabledStartupModules.includes(task.name))) {
						return false;
					}
				}
			}
		}
		// Check that all of the tasks that we must be performed after has been done
		const {after} = taskModule;
		if(after) {
			for(t = 0;t < after.length;t++) {
				if(!$tw.boot.executedStartupModules[after[t]]) {
					return false;
				}
			}
		}
		return true;
	};

	/*
	Global Hooks mechanism which allows plugins to modify default functionality
	*/
	$tw.hooks = $tw.hooks || {names: {}};

	/*
	Add hooks to the  hashmap
	*/
	$tw.hooks.addHook = function(hookName,definition) {
		if($tw.utils.hop($tw.hooks.names,hookName)) {
			$tw.hooks.names[hookName].push(definition);
		}
		else {
			$tw.hooks.names[hookName] = [definition];
		}
	};

	/*
	Delete hooks from the hashmap
	*/
	$tw.hooks.removeHook = function(hookName,definition) {
		if($tw.utils.hop($tw.hooks.names,hookName)) {
			const p = $tw.hooks.names[hookName].indexOf(definition);
			if(p !== -1) {
				$tw.hooks.names[hookName].splice(p,1);
			}
		}
	};

	/*
	Invoke the hook by key
	*/
	$tw.hooks.invokeHook = function(hookName /*, value,... */) {
		const args = Array.prototype.slice.call(arguments,1);
		if($tw.utils.hop($tw.hooks.names,hookName)) {
			for(let i = 0;i < $tw.hooks.names[hookName].length;i++) {
				args[0] = $tw.hooks.names[hookName][i].apply(null,args);
			}
		}
		return args[0];
	};

	/////////////////////////// Main boot function to decrypt tiddlers and then startup

	$tw.boot.boot = function(callback) {
		// Initialise crypto object
		$tw.crypto = new $tw.utils.Crypto();
		// Initialise password prompter
		if($tw.browser && !$tw.node) {
			$tw.passwordPrompt = new $tw.utils.PasswordPrompt();
		}
		// Preload any encrypted tiddlers
		$tw.boot.decryptEncryptedTiddlers(() => {
			// Startup
			$tw.boot.startup({callback});
		});
	};

	/////////////////////////// Autoboot in the browser

	if($tw.browser && !$tw.boot.suppressBoot) {
		$tw.boot.boot();
	}

	return $tw;

});

if(typeof (exports) !== "undefined") {
	exports.TiddlyWiki = _boot;
} else {
	_boot(window.$tw);
}
//# sourceURL=$:/boot/boot.js
