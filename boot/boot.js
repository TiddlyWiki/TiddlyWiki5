/*\
title: $:/boot/boot.js
type: application/javascript

The main boot kernel for TiddlyWiki. This single file creates a barebones TW environment that is just sufficient to bootstrap the modules containing the main logic of the application.

On the server this file is executed directly to boot TiddlyWiki. In the browser, this file is packed into a single HTML file along with other elements:

# bootprefix.js
# <module definitions>
# boot.js

The module definitions on the browser look like this:

	$tw.defineModule("MyModule","moduletype",function(module,exports,require) {
	// Module code inserted here
	return exports;
	});

In practice, each module is wrapped in a separate script block.

\*/

var _boot = (function($tw) {

/*jslint node: true, browser: true */
/*global modules: false, $tw: false */
"use strict";

// Include bootprefix if we're not given module data
if(!$tw) {
	$tw = require("./bootprefix.js").bootprefix();
}

$tw.utils = $tw.utils || Object.create(null);

/////////////////////////// Standard node.js libraries

var fs, path, vm;
if($tw.node) {
	fs = require("fs");
	path = require("path");
	vm = require("vm");
}

/////////////////////////// Utility functions

$tw.boot.log = function(str) {
	$tw.boot.logMessages = $tw.boot.logMessages || [];
	$tw.boot.logMessages.push(str);
}

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
Determine if a value is a date
*/
$tw.utils.isDate = function(value) {
	return Object.prototype.toString.call(value) === "[object Date]";
};

/*
Iterate through all the own properties of an object or array. Callback is invoked with (element,title,object)
*/
$tw.utils.each = function(object,callback) {
	var f;
	if(object) {
		if(Object.prototype.toString.call(object) == "[object Array]") {
			object.forEach(callback);
		} else {
			for(f in object) {
				if(Object.prototype.hasOwnProperty.call(object,f)) {
					callback(object[f],f,object);
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
attributes: hashmap of attribute values
text: text to add as a child node
children: array of further child nodes
innerHTML: optional HTML for element
class: class name(s)
document: defaults to current document
eventListeners: array of event listeners (this option won't work until $tw.utils.addEventListeners() has been loaded)
*/
$tw.utils.domMaker = function(tag,options) {
	var doc = options.document || document;
	var element = doc.createElement(tag);
	if(options["class"]) {
		element.className = options["class"];
	}
	if(options.text) {
		element.appendChild(doc.createTextNode(options.text));
	}
	$tw.utils.each(options.children,function(child) {
		element.appendChild(child);
	});
	if(options.innerHTML) {
		element.innerHTML = options.innerHTML;
	}
	$tw.utils.each(options.attributes,function(attribute,name) {
		element.setAttribute(name,attribute);
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
	var errHeading = "Internal JavaScript Error",
		promptMsg = "Well, this is embarrassing. It is recommended that you restart TiddlyWiki by refreshing your browser";
	// Log the error to the console
	console.error(err);
	if($tw.browser && !$tw.node) {
		// Display an error message to the user
		var dm = $tw.utils.domMaker,
			heading = dm("h1",{text: errHeading}),
			prompt = dm("div",{text: promptMsg, "class": "tc-error-prompt"}),
			message = dm("div",{text: err}),
			button = dm("button",{text: "close"}),
			form = dm("form",{children: [heading,prompt,message,button], "class": "tc-error-form"});
		document.body.insertBefore(form,document.body.firstChild);
		form.addEventListener("submit",function(event) {
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
	$tw.utils.each(Array.prototype.slice.call(arguments,1),function(source) {
		if(source) {
			for (var p in source) {
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
	$tw.utils.each(Array.prototype.slice.call(arguments,1),function(source) {
		if(source) {
			for (var p in source) {
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
Convert "&amp;" to &, "&nbsp;" to nbsp, "&lt;" to <, "&gt;" to > and "&quot;" to "
*/
$tw.utils.htmlDecode = function(s) {
	return s.toString().replace(/&lt;/mg,"<").replace(/&nbsp;/mg,"\xA0").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
};

/*
Get the browser location.hash. We don't use location.hash because of the way that Firefox auto-urldecodes it (see http://stackoverflow.com/questions/1703552/encoding-of-window-location-hash)
*/
$tw.utils.getLocationHash = function() {
	var parts = window.location.href.split('#');
	return "#" + (parts.length > 1 ? parts[1] : "");
};

/*
Pad a string to a given length with "0"s. Length defaults to 2
*/
$tw.utils.pad = function(value,length) {
	length = length || 2;
	var s = value.toString();
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
		return new Date(Date.UTC(parseInt(value.substr(0,4),10),
				parseInt(value.substr(4,2),10)-1,
				parseInt(value.substr(6,2),10),
				parseInt(value.substr(8,2)||"00",10),
				parseInt(value.substr(10,2)||"00",10),
				parseInt(value.substr(12,2)||"00",10),
				parseInt(value.substr(14,3)||"000",10)));
	} else if($tw.utils.isDate(value)) {
		return value;
	} else {
		return null;
	}
};

// Stringify an array of tiddler titles into a list string
$tw.utils.stringifyList = function(value) {
	var result = [];
	for(var t=0; t<value.length; t++) {
		if(value[t].indexOf(" ") !== -1) {
			result.push("[[" + value[t] + "]]");
		} else {
			result.push(value[t]);
		}
	}
	return result.join(" ");
};

// Parse a string array from a bracketted list. For example "OneTiddler [[Another Tiddler]] LastOne"
$tw.utils.parseStringArray = function(value) {
	if(typeof value === "string") {
		var memberRegExp = /(?:^|[^\S\xA0])(?:\[\[(.*?)\]\])(?=[^\S\xA0]|$)|([\S\xA0]+)/mg,
			results = [],
			match;
		do {
			match = memberRegExp.exec(value);
			if(match) {
				var item = match[1] || match[2];
				if(item !== undefined && results.indexOf(item) === -1) {
					results.push(item);
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
	text.split(/\r?\n/mg).forEach(function(line) {
		if(line.charAt(0) !== "#") {
			var p = line.indexOf(":");
			if(p !== -1) {
				var field = line.substr(0, p).trim(),
					value = line.substr(p+1).trim();
				fields[field] = value;
			}
		}
	});
	return fields;
};

/*
Resolves a source filepath delimited with `/` relative to a specified absolute root filepath.
In relative paths, the special folder name `..` refers to immediate parent directory, and the
name `.` refers to the current directory
*/
$tw.utils.resolvePath = function(sourcepath,rootpath) {
	// If the source path starts with ./ or ../ then it is relative to the root
	if(sourcepath.substr(0,2) === "./" || sourcepath.substr(0,3) === "../" ) {
		var src = sourcepath.split("/"),
			root = rootpath.split("/");
		// Remove the filename part of the root
		root.splice(root.length-1,1);
		// Process the source path bit by bit onto the end of the root path
		while(src.length > 0) {
			var c = src.shift();
			if(c === "..") { // Slice off the last root entry for a double dot
				if(root.length > 0) {
					root.splice(root.length-1,1);
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
			root.splice(root.length - 1, 1);
			return root.join("/") + "/" + sourcepath;
		} else {
			return sourcepath;
		}
	}
};

/*
Parse a semantic version string into its constituent parts
*/
$tw.utils.parseVersion = function(version) {
	var match = /^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?$/.exec(version);
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
Returns true if the version string A is greater than the version string B. Returns true if the versions are the same
*/
$tw.utils.checkVersions = function(versionStringA,versionStringB) {
	var defaultVersion = {
			major: 0,
			minor: 0,
			patch: 0
		},
		versionA = $tw.utils.parseVersion(versionStringA) || defaultVersion,
		versionB = $tw.utils.parseVersion(versionStringB) || defaultVersion,
		diff = [
			versionA.major - versionB.major,
			versionA.minor - versionB.minor,
			versionA.patch - versionB.patch
		];
	return (diff[0] > 0) ||
		(diff[0] === 0 && diff[1] > 0) ||
		(diff[0] === 0 && diff[1] === 0 && diff[2] > 0) ||
		(diff[0] === 0 && diff[1] === 0 && diff[2] === 0);
};

/*
Register file type information
options: {flags: flags,deserializerType: deserializerType}
	flags:"image" for image types
	deserializerType: defaults to type if not specified
*/
$tw.utils.registerFileType = function(type,encoding,extension,options) {
	options = options || {};
	$tw.config.fileExtensionInfo[extension] = {type: type};
	$tw.config.contentTypeInfo[type] = {encoding: encoding, extension: extension, flags: options.flags || [], deserializerType: options.deserializerType || type};
};

/*
Given an extension, get the correct encoding for that file.
defaults to utf8
*/
$tw.utils.getTypeEncoding = function(ext) {
	var extensionInfo = $tw.config.fileExtensionInfo[ext],
		type = extensionInfo ? extensionInfo.type : null,
		typeInfo = type ? $tw.config.contentTypeInfo[type] : null;
	return typeInfo ? typeInfo.encoding : "utf8";
};

/*
Run code globally with specified context variables in scope
*/
$tw.utils.evalGlobal = function(code,context,filename) {
	var contextCopy = $tw.utils.extend(Object.create(null),context);
	// Get the context variables as a pair of arrays of names and values
	var contextNames = [], contextValues = [];
	$tw.utils.each(contextCopy,function(value,name) {
		contextNames.push(name);
		contextValues.push(value);
	});
	// Add the code prologue and epilogue
	code = "(function(" + contextNames.join(",") + ") {(function(){\n" + code + ";})();\nreturn exports;\n})\n";
	// Compile the code into a function
	var fn;
	if($tw.browser) {
		fn = window["eval"](code + "\n\n//# sourceURL=" + filename);
	} else {
		fn = vm.runInThisContext(code,filename);
	}
	// Call the function and return the exports
	return fn.apply(null,contextValues);
};

/*
Run code in a sandbox with only the specified context variables in scope
*/
$tw.utils.evalSandboxed = $tw.browser ? $tw.utils.evalGlobal : function(code,context,filename) {
	var sandbox = $tw.utils.extend(Object.create(null),context);
	vm.runInNewContext(code,sandbox,filename);
	return sandbox.exports;
};

/*
Creates a PasswordPrompt object
*/
$tw.utils.PasswordPrompt = function() {
	// Store of pending password prompts
	this.passwordPrompts = [];
	// Create the wrapper
	this.promptWrapper = $tw.utils.domMaker("div",{"class":"tc-password-wrapper"});
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
callback: function to be called on submission with parameter of object {username:,password:}. Callback must return `true` to remove the password prompt
*/
$tw.utils.PasswordPrompt.prototype.createPrompt = function(options) {
	// Create and add the prompt to the DOM
	var self = this,
		submitText = options.submitText || "Login",
		dm = $tw.utils.domMaker,
		children = [dm("h1",{text: options.serviceName})];
	if(!options.noUserName) {
		children.push(dm("input",{
			attributes: {type: "text", name: "username", placeholder: "Username"}
		}));
	}
	children.push(dm("input",{
		attributes: {type: "password", name: "password", placeholder: "Password"}
	}));
	if(options.canCancel) {
		children.push(dm("button",{
			text: "Cancel",
			eventListeners: [{
					name: "click",
					handlerFunction: function(event) {
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
	var form = dm("form",{
		attributes: {autocomplete: "off"},
		children: children
	});
	this.promptWrapper.appendChild(form);
	window.setTimeout(function() {
		form.elements[0].focus();
	},10);
	// Add a submit event handler
	var self = this;
	form.addEventListener("submit",function(event) {
		// Collect the form data
		var data = {},t;
		$tw.utils.each(form.elements,function(element) {
			if(element.name && element.value) {
				data[element.name] = element.value;
			}
		});
		// Call the callback
		if(options.callback(data)) {
			// Remove the prompt if the callback returned true
			self.removePrompt(promptInfo);
		} else {
			// Clear the password if the callback returned false
			$tw.utils.each(form.elements,function(element) {
				if(element.name === "password") {
					element.value = "";
				}
			});
		}
		event.preventDefault();
		return false;
	},true);
	// Add the prompt to the list
	var promptInfo = {
		serviceName: options.serviceName,
		callback: options.callback,
		form: form
	};
	this.passwordPrompts.push(promptInfo);
	// Make sure the wrapper is displayed
	this.setWrapperDisplay();
};

$tw.utils.PasswordPrompt.prototype.removePrompt = function(promptInfo) {
	var i = this.passwordPrompts.indexOf(promptInfo);
	if(i !== -1) {
		this.passwordPrompts.splice(i,1);
		promptInfo.form.parentNode.removeChild(promptInfo.form);
		this.setWrapperDisplay();
	}
}

/*
Crypto helper object for encrypted content. It maintains the password text in a closure, and provides methods to change
the password, and to encrypt/decrypt a block of text
*/
$tw.utils.Crypto = function() {
	var sjcl = $tw.node ? require("./sjcl.js") : window.sjcl,
		currentPassword = null,
		callSjcl = function(method,inputText,password) {
			password = password || currentPassword;
			var outputText;
			try {
				if(password) {
					outputText = sjcl[method](password,inputText);
				}
			} catch(ex) {
				console.log("Crypto error:" + ex);
				outputText = null;
			}
			return outputText;
		};
	this.setPassword = function(newPassword) {
		currentPassword = newPassword;
		this.updateCryptoStateTiddler();
	};
	this.updateCryptoStateTiddler = function() {
		if($tw.wiki) {
			var state = currentPassword ? "yes" : "no",
				tiddler = $tw.wiki.getTiddler("$:/isEncrypted");
			if(!tiddler || tiddler.fields.text !== state) {
				$tw.wiki.addTiddler(new $tw.Tiddler({title: "$:/isEncrypted", text: state}));
			}
		}
	};
	this.hasPassword = function() {
		return !!currentPassword;
	}
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
	var name = moduleName[0] === "." ? $tw.utils.resolvePath(moduleName,moduleRoot) : moduleName,
		moduleInfo = $tw.modules.titles[name] || $tw.modules.titles[name + ".js"] || $tw.modules.titles[moduleName] || $tw.modules.titles[moduleName + ".js"] ,
		tiddler = $tw.wiki.getTiddler(name) || $tw.wiki.getTiddler(name + ".js") || $tw.wiki.getTiddler(moduleName) || $tw.wiki.getTiddler(moduleName + ".js") ,
		_exports = {},
		sandbox = {
			module: {exports: _exports},
			//moduleInfo: moduleInfo,
			exports: _exports,
			console: console,
			setInterval: setInterval,
			clearInterval: clearInterval,
			setTimeout: setTimeout,
			clearTimeout: clearTimeout,
			Buffer: $tw.browser ? {} : Buffer,
			$tw: $tw,
			require: function(title) {
				return $tw.modules.execute(title, name);
			}
		};

	Object.defineProperty(sandbox.module, "id", {
		value: name,
		writable: false,
		enumerable: true,
		configurable: false
	});

	if(!$tw.browser) {
		$tw.utils.extend(sandbox,{
			process: process
		});
	} else {
		/*
		CommonJS optional require.main property:
		 In a browser we offer a fake main module which points back to the boot function
		 (Theoretically, this may allow TW to eventually load itself as a module in the browser)
		*/
		Object.defineProperty(sandbox.require, "main", {
			value: (typeof(require) !== "undefined") ? require.main : {TiddlyWiki: _boot},
			writable: false,
			enumerable: true,
			configurable: false
		});
	}
	if(!moduleInfo) {
		// We could not find the module on this path
		// Try to defer to browserify etc, or node
		var deferredModule;
		if($tw.browser) {
			if(window.require) {
				try {
					return window.require(moduleName);
				} catch(e) {}
			}
			throw "Cannot find module named '" + moduleName + "' required by module '" + moduleRoot + "', resolved to " + name;
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
			$tw.utils.error("Error executing boot module " + name + ":\n" + e);
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
	var modules = $tw.modules.types[moduleType];
	$tw.utils.each(modules,function(element,title) {
		callback(title,$tw.modules.execute(title));
	});
};

/*
Get all the modules of a particular type in a hashmap by their `name` field
*/
$tw.modules.getModulesByTypeAsHashmap = function(moduleType,nameField) {
	nameField = nameField || "name";
	var results = Object.create(null);
	$tw.modules.forEachModuleOfType(moduleType,function(title,module) {
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
	$tw.modules.forEachModuleOfType(moduleType,function(title,module) {
		$tw.utils.each(module,function(element,title,object) {
			targetObject[title] = module[title];
		});
	});
	return targetObject;
};

/*
Return an array of classes created from the modules of a specified type. Each module should export the properties to be added to those of the optional base class
*/
$tw.modules.createClassesFromModules = function(moduleType,subType,baseClass) {
	var classes = Object.create(null);
	$tw.modules.forEachModuleOfType(moduleType,function(title,moduleExports) {
		if(!subType || moduleExports.types[subType]) {
			var newClass = function() {};
			if(baseClass) {
				newClass.prototype = new baseClass();
				newClass.prototype.constructor = baseClass;
			}
			$tw.utils.extend(newClass.prototype,moduleExports);
			classes[moduleExports.name] = newClass;
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
	for(var c=0; c<arguments.length; c++) {
		var arg = arguments[c],
			src = (arg instanceof $tw.Tiddler) ? arg.fields : arg;
		for(var t in src) {
			if(src[t] === undefined || src[t] === null) {
				if(t in this.fields) {
					delete this.fields[t]; // If we get a field that's undefined, delete any previous field value
				}
			} else {
				// Parse the field with the associated field module (if any)
				var fieldModule = $tw.Tiddler.fieldModules[t],
					value;
				if(fieldModule && fieldModule.parse) {
					value = fieldModule.parse.call(this,src[t]);
				} else {
					value = src[t];
				}
				// Freeze the field to keep it immutable
				if(typeof value === "object") {
					Object.freeze(value);
				}
				this.fields[t] = value;
			}
		}
	}
	// Freeze the tiddler against modification
	Object.freeze(this.fields);
};

$tw.Tiddler.prototype.hasField = function(field) {
	return $tw.utils.hop(this.fields,field);
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
shadowTiddlers: Array of shadow tiddlers to be added
*/
$tw.Wiki = function(options) {
	options = options || {};
	var self = this,
		tiddlers = Object.create(null), // Hashmap of tiddlers
		pluginTiddlers = [], // Array of tiddlers containing registered plugins, ordered by priority
		pluginInfo = Object.create(null), // Hashmap of parsed plugin content
		shadowTiddlers = options.shadowTiddlers || Object.create(null); // Hashmap by title of {source:, tiddler:}

	// Add a tiddler to the store
	this.addTiddler = function(tiddler) {
		if(!(tiddler instanceof $tw.Tiddler)) {
			tiddler = new $tw.Tiddler(tiddler);
		}
		// Save the tiddler
		if(tiddler) {
			var title = tiddler.fields.title;
			if(title) {
				tiddlers[title] = tiddler;
				this.clearCache(title);
				this.clearGlobalCache();
				this.enqueueTiddlerEvent(title);
			}
		}
	};

	// Delete a tiddler
	this.deleteTiddler = function(title) {
		delete tiddlers[title];
		this.clearCache(title);
		this.clearGlobalCache();
		this.enqueueTiddlerEvent(title,true);
	};

	// Get a tiddler from the store
	this.getTiddler = function(title) {
		var t = tiddlers[title];
		if(t instanceof $tw.Tiddler) {
			return t;
		} else if(title !== undefined && Object.prototype.hasOwnProperty.call(shadowTiddlers,title)) {
			return shadowTiddlers[title].tiddler;
		} else {
			return undefined;
		}
	};

	// Get an array of all tiddler titles
	this.allTitles = function() {
		return Object.keys(tiddlers);
	};

	// Iterate through all tiddler titles
	this.each = function(callback) {
		for(var title in tiddlers) {
			callback(tiddlers[title],title);
		}
	};

	// Get an array of all shadow tiddler titles
	this.allShadowTitles = function() {
		return Object.keys(shadowTiddlers);
	};

	// Iterate through all shadow tiddler titles
	this.eachShadow = function(callback) {
		for(var title in shadowTiddlers) {
			var shadowInfo = shadowTiddlers[title];
			callback(shadowInfo.tiddler,title);
		}
	};

	// Iterate through all tiddlers and then the shadows
	this.eachTiddlerPlusShadows = function(callback) {
		for(var title in tiddlers) {
			callback(tiddlers[title],title);
		}
		for(var title in shadowTiddlers) {
			if(!Object.prototype.hasOwnProperty.call(tiddlers,title)) {
				var shadowInfo = shadowTiddlers[title];
				callback(shadowInfo.tiddler,title);
			}
		}
	};

	// Iterate through all the shadows and then the tiddlers
	this.eachShadowPlusTiddlers = function(callback) {
		for(var title in shadowTiddlers) {
			if(Object.prototype.hasOwnProperty.call(tiddlers,title)) {
				callback(tiddlers[title],title);
			} else {
				var shadowInfo = shadowTiddlers[title];
				callback(shadowInfo.tiddler,title);
			}
		}
		for(var title in tiddlers) {
			if(!Object.prototype.hasOwnProperty.call(shadowTiddlers,title)) {
				callback(tiddlers[title],title);
			}
		}

	};

	// Test for the existence of a tiddler
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

	// Read plugin info for all plugins
	this.readPluginInfo = function() {
		for(var title in tiddlers) {
			var tiddler = tiddlers[title];
			if(tiddler.fields.type === "application/json" && tiddler.hasField("plugin-type")) {
				pluginInfo[tiddler.fields.title] = JSON.parse(tiddler.fields.text);
			}

		}
	};

	// Get plugin info for a plugin
	this.getPluginInfo = function(title) {
		return pluginInfo[title];
	};

	// Register the plugin tiddlers of a particular type, optionally restricting registration to an array of tiddler titles. Return the array of titles affected
	this.registerPluginTiddlers = function(pluginType,titles) {
		var self = this,
			registeredTitles = [],
			checkTiddler = function(tiddler,title) {
				if(tiddler && tiddler.fields.type === "application/json" && tiddler.fields["plugin-type"] === pluginType) {
					var disablingTiddler = self.getTiddler("$:/config/Plugins/Disabled/" + title);
					if(title === "$:/core" || !disablingTiddler || (disablingTiddler.fields.text || "").trim() !== "yes") {
						pluginTiddlers.push(tiddler);
						registeredTitles.push(tiddler.fields.title);
					}
				}
			};
		if(titles) {
			$tw.utils.each(titles,function(title) {
				checkTiddler(self.getTiddler(title),title);
			});
		} else {
			this.each(function(tiddler,title) {
				checkTiddler(tiddler,title);
			});
		}
		return registeredTitles;
	};

	// Unregister the plugin tiddlers of a particular type, returning an array of the titles affected
	this.unregisterPluginTiddlers = function(pluginType) {
		var self = this,
			titles = [];
		// Remove any previous registered plugins of this type
		for(var t=pluginTiddlers.length-1; t>=0; t--) {
			var tiddler = pluginTiddlers[t];
			if(tiddler.fields["plugin-type"] === pluginType) {
				titles.push(tiddler.fields.title);
				pluginTiddlers.splice(t,1);
			}
		}
		return titles;
	};

	// Unpack the currently registered plugins, creating shadow tiddlers for their constituent tiddlers
	this.unpackPluginTiddlers = function() {
		var self = this;
		// Sort the plugin titles by the `plugin-priority` field
		pluginTiddlers.sort(function(a,b) {
			if("plugin-priority" in a.fields && "plugin-priority" in b.fields) {
				return a.fields["plugin-priority"] - b.fields["plugin-priority"];
			} else if("plugin-priority" in a.fields) {
				return -1;
			} else if("plugin-priority" in b.fields) {
				return +1;
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
		$tw.utils.each(pluginTiddlers,function(tiddler) {
			// Extract the constituent tiddlers
			if($tw.utils.hop(pluginInfo,tiddler.fields.title)) {
				$tw.utils.each(pluginInfo[tiddler.fields.title].tiddlers,function(constituentTiddler,constituentTitle) {
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
	};

};

// Dummy methods that will be filled in after boot
$tw.Wiki.prototype.clearCache =
$tw.Wiki.prototype.clearGlobalCache =
$tw.Wiki.prototype.enqueueTiddlerEvent = function() {};

// Add an array of tiddlers
$tw.Wiki.prototype.addTiddlers = function(tiddlers) {
	for(var t=0; t<tiddlers.length; t++) {
		this.addTiddler(tiddlers[t]);
	}
};

/*
Define all modules stored in ordinary tiddlers
*/
$tw.Wiki.prototype.defineTiddlerModules = function() {
	this.each(function(tiddler,title) {
		if(tiddler.hasField("module-type")) {
			switch (tiddler.fields.type) {
				case "application/javascript":
					// We only define modules that haven't already been defined, because in the browser modules in system tiddlers are defined in inline script
					if(!$tw.utils.hop($tw.modules.titles,tiddler.fields.title)) {
						$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],tiddler.fields.text);
					}
					break;
				case "application/json":
					$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],JSON.parse(tiddler.fields.text));
					break;
				case "application/x-tiddler-dictionary":
					$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],$tw.utils.parseFields(tiddler.fields.text));
					break;
			}
		}
	});
};

/*
Register all the module tiddlers that have a module type
*/
$tw.Wiki.prototype.defineShadowModules = function() {
	var self = this;
	this.eachShadow(function(tiddler,title) {
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
	var self = this,
		overrides = [];
	// Find the overriding tiddlers
	this.each(function(tiddler,title) {
		if(self.isShadowTiddler(title)) {
			console.log(title);
			overrides.push(title);
		}
	});
	// Assemble a report tiddler
	var titleReportTiddler = "TiddlyWiki Safe Mode",
		report = [];
	report.push("TiddlyWiki has been started in [[safe mode|http://tiddlywiki.com/static/SafeMode.html]]. Most customisations have been disabled by renaming the following tiddlers:")
	// Delete the overrides
	overrides.forEach(function(title) {
		var tiddler = self.getTiddler(title),
			newTitle = "SAFE: " + title;
		self.deleteTiddler(title);
		self.addTiddler(new $tw.Tiddler(tiddler, {title: newTitle}));
		report.push("* [[" + title + "|" + newTitle + "]]");
	});
	report.push()
	this.addTiddler(new $tw.Tiddler({title: titleReportTiddler, text: report.join("\n\n")}));
	// Set $:/DefaultTiddlers to point to our report
	this.addTiddler(new $tw.Tiddler({title: "$:/DefaultTiddlers", text: "[[" + titleReportTiddler + "]]"}));
};

/*
Extracts tiddlers from a typed block of text, specifying default field values
*/
$tw.Wiki.prototype.deserializeTiddlers = function(type,text,srcFields) {
	srcFields = srcFields || Object.create(null);
	var deserializer = $tw.Wiki.tiddlerDeserializerModules[type],
		fields = Object.create(null);
	if(!deserializer && $tw.config.fileExtensionInfo[type]) {
		// If we didn't find the serializer, try converting it from an extension to a content type
		type = $tw.config.fileExtensionInfo[type].type;
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
	for(var f in srcFields) {
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
$tw.modules.define("$:/boot/tiddlerdeserializer/js","tiddlerdeserializer",{
	"application/javascript": function(text,fields) {
		var headerCommentRegExp = new RegExp($tw.config.jsModuleHeaderRegExpString,"mg"),
			match = headerCommentRegExp.exec(text);
		fields.text = text;
		if(match) {
			fields = $tw.utils.parseFields(match[1].split(/\r?\n\r?\n/mg)[0],fields);
		}
		return [fields];
	}
});
$tw.modules.define("$:/boot/tiddlerdeserializer/tid","tiddlerdeserializer",{
	"application/x-tiddler": function(text,fields) {
		var split = text.split(/\r?\n\r?\n/mg);
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
	"application/x-tiddlers": function(text,fields) {
		var titles = [],
			tiddlers = [],
			match = /\r?\n\r?\n/mg.exec(text);
		if(match) {
			fields = $tw.utils.parseFields(text.substr(0,match.index),fields);
			var lines = text.substr(match.index + match[0].length).split(/\r?\n/mg);
			for(var t=0; t<lines.length; t++) {
				var line = lines[t];
				if(line.charAt(0) !== "#") {
					var colonPos= line.indexOf(": ");
					if(colonPos !== -1) {
						var tiddler = $tw.utils.extend(Object.create(null),fields);
						tiddler.title = (tiddler.title || "") + line.substr(0,colonPos);
						if(titles.indexOf(tiddler.title) !== -1) {
							console.log("Warning: .multids file contains multiple definitions for " + tiddler.title);
						}
						titles.push(tiddler.title);
						tiddler.text = line.substr(colonPos + 2);
						tiddlers.push(tiddler);
					}
				}
			}
		}
		return tiddlers;
	}
});
$tw.modules.define("$:/boot/tiddlerdeserializer/txt","tiddlerdeserializer",{
	"text/plain": function(text,fields,type) {
		fields.text = text;
		fields.type = type || "text/plain";
		return [fields];
	}
});
$tw.modules.define("$:/boot/tiddlerdeserializer/html","tiddlerdeserializer",{
	"text/html": function(text,fields) {
		fields.text = text;
		fields.type = "text/html";
		return [fields];
	}
});
$tw.modules.define("$:/boot/tiddlerdeserializer/json","tiddlerdeserializer",{
	"application/json": function(text,fields) {
		var tiddlers = JSON.parse(text);
		return tiddlers;
	}
});

/////////////////////////// Browser definitions

if($tw.browser && !$tw.node) {

/*
Decrypt any tiddlers stored within the element with the ID "encryptedArea". The function is asynchronous to allow the user to be prompted for a password
	callback: function to be called the decryption is complete
*/
$tw.boot.decryptEncryptedTiddlers = function(callback) {
	var encryptedArea = document.getElementById("encryptedStoreArea");
	if(encryptedArea) {
		var encryptedText = encryptedArea.innerHTML;
		// Prompt for the password
		$tw.passwordPrompt.createPrompt({
			serviceName: "Enter a password to decrypt this TiddlyWiki",
			noUserName: true,
			submitText: "Decrypt",
			callback: function(data) {
				// Attempt to decrypt the tiddlers
				$tw.crypto.setPassword(data.password);
				var decryptedText = $tw.crypto.decrypt(encryptedText);
				if(decryptedText) {
					var json = JSON.parse(decryptedText);
					for(var title in json) {
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
	"(DOM)": function(node) {
		var extractTextTiddlers = function(node) {
				var e = node.firstChild;
				while(e && e.nodeName.toLowerCase() !== "pre") {
					e = e.nextSibling;
				}
				var title = node.getAttribute ? node.getAttribute("title") : null;
				if(e && title) {
					var attrs = node.attributes,
						tiddler = {
							text: $tw.utils.htmlDecode(e.innerHTML)
						};
					for(var i=attrs.length-1; i >= 0; i--) {
						tiddler[attrs[i].name] = attrs[i].value;
					}
					return [tiddler];
				} else {
					return null;
				}
			},
			extractModuleTiddlers = function(node) {
				if(node.hasAttribute && node.hasAttribute("data-tiddler-title")) {
					var text = node.innerHTML,
						s = text.indexOf("{"),
						e = text.lastIndexOf("}");
					if(node.hasAttribute("data-module") && s !== -1 && e !== -1) {
						text = text.substring(s+1,e);
					}
					var fields = {text: text},
						attributes = node.attributes;
					for(var a=0; a<attributes.length; a++) {
						if(attributes[a].nodeName.substr(0,13) === "data-tiddler-") {
							fields[attributes[a].nodeName.substr(13)] = attributes[a].value;
						}
					}
					return [fields];
				} else {
					return null;
				}
			},
			t,result = [];
		if(node) {
			for(t = 0; t < node.childNodes.length; t++) {
					var childNode = node.childNodes[t],
						tiddlers = extractTextTiddlers(childNode);
					tiddlers = tiddlers || extractModuleTiddlers(childNode);
					if(tiddlers) {
						result.push.apply(result,tiddlers);
					}
			}
		}
		return result;
	}
});

$tw.loadTiddlersBrowser = function() {
	// In the browser, we load tiddlers from certain elements
	var containerIds = [
		"libraryModules",
		"modules",
		"bootKernelPrefix",
		"bootKernel",
		"styleArea",
		"storeArea",
		"systemArea"
	];
	for(var t=0; t<containerIds.length; t++) {
		$tw.wiki.addTiddlers($tw.wiki.deserializeTiddlers("(DOM)",document.getElementById(containerIds[t])));
	}
	// Load any preloaded tiddlers
	if($tw.preloadTiddlers) {
		$tw.wiki.addTiddlers($tw.preloadTiddlers);
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
	var ext = path.extname(filepath),
		extensionInfo = $tw.config.fileExtensionInfo[ext],
		type = extensionInfo ? extensionInfo.type : null,
		typeInfo = type ? $tw.config.contentTypeInfo[type] : null,
		data = fs.readFileSync(filepath,typeInfo ? typeInfo.encoding : "utf8"),
		tiddlers = $tw.wiki.deserializeTiddlers(ext,data,fields),
		metafile = filepath + ".meta",
		metadata;
	if(ext !== ".json" && tiddlers.length === 1 && fs.existsSync(metafile)) {
		metadata = fs.readFileSync(metafile,"utf8");
		if(metadata) {
			tiddlers = [$tw.utils.parseFields(metadata,tiddlers[0])];
		}
	}
	return {filepath: filepath, type: type, tiddlers: tiddlers, hasMetaFile: !!metadata};
};

/*
A default set of files for TiddlyWiki to ignore during load.
This matches what NPM ignores, and adds "*.meta" to ignore tiddler
metadata files.
*/
$tw.boot.excludeRegExp = /^\.DS_Store$|^.*\.meta$|^\..*\.swp$|^\._.*$|^\.git$|^\.hg$|^\.lock-wscript$|^\.svn$|^\.wafpickle-.*$|^CVS$|^npm-debug\.log$/;

/*
Load all the tiddlers recursively from a directory, including honouring `tiddlywiki.files` files for drawing in external files. Returns an array of {filepath:,type:,tiddlers: [{..fields...}],hasMetaFile:}. Note that no file information is returned for externally loaded tiddlers, just the `tiddlers` property.
*/
$tw.loadTiddlersFromPath = function(filepath,excludeRegExp) {
	excludeRegExp = excludeRegExp || $tw.boot.excludeRegExp;
	var tiddlers = [];
	if(fs.existsSync(filepath)) {
		var stat = fs.statSync(filepath);
		if(stat.isDirectory()) {
			var files = fs.readdirSync(filepath);
			// Look for a tiddlywiki.files file
			if(files.indexOf("tiddlywiki.files") !== -1) {
				// If so, process the files it describes
				var filesInfo = JSON.parse(fs.readFileSync(filepath + path.sep + "tiddlywiki.files","utf8"));
				$tw.utils.each(filesInfo.tiddlers,function(tidInfo) {
					var typeInfo = $tw.config.contentTypeInfo[tidInfo.fields.type || "text/plain"],
						pathname = path.resolve(filepath,tidInfo.file),
						text = fs.readFileSync(pathname,typeInfo ? typeInfo.encoding : "utf8");
					if(tidInfo.prefix) {
						text = tidInfo.prefix + text;
					}
					if(tidInfo.suffix) {
						text = text + tidInfo.suffix;
					}
					tidInfo.fields.text = text;
					tiddlers.push({tiddlers: [tidInfo.fields]});
				});
			} else {
				// If not, read all the files in the directory
				$tw.utils.each(files,function(file) {
					if(!excludeRegExp.test(file) && file !== "plugin.info") {
						tiddlers.push.apply(tiddlers,$tw.loadTiddlersFromPath(filepath + path.sep + file,excludeRegExp));
					}
				});
			}
		} else if(stat.isFile()) {
			tiddlers.push($tw.loadTiddlersFromFile(filepath));
		}
	}
	return tiddlers;
};

/*
Load the tiddlers from a plugin folder, and package them up into a proper JSON plugin tiddler
*/
$tw.loadPluginFolder = function(filepath,excludeRegExp) {
	excludeRegExp = excludeRegExp || $tw.boot.excludeRegExp;
	if(fs.existsSync(filepath) && fs.statSync(filepath).isDirectory()) {
		// Read the plugin information
		var pluginInfo = JSON.parse(fs.readFileSync(filepath + path.sep + "plugin.info","utf8"));
		// Read the plugin files
		var pluginFiles = $tw.loadTiddlersFromPath(filepath,excludeRegExp);
		// Save the plugin tiddlers into the plugin info
		pluginInfo.tiddlers = pluginInfo.tiddlers || Object.create(null);
		for(var f=0; f<pluginFiles.length; f++) {
			var tiddlers = pluginFiles[f].tiddlers;
			for(var t=0; t<tiddlers.length; t++) {
				var tiddler= tiddlers[t];
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
		pluginInfo.text = JSON.stringify({tiddlers: pluginInfo.tiddlers},null,4);
		delete pluginInfo.tiddlers;
		// Deserialise array fields (currently required for the dependents field)
		for(var field in pluginInfo) {
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
	var pathIndex = 0;
	do {
		var pluginPath = path.resolve(paths[pathIndex],"./" + name)
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
	var pluginPath = $tw.findLibraryItem(name,paths);
	if(pluginPath) {
		var pluginFields = $tw.loadPluginFolder(pluginPath);
		if(pluginFields) {
			$tw.wiki.addTiddler(pluginFields);
		}
	}
};

/*
libraryPath: Path of library folder for these plugins (relative to core path)
envVar: Environment variable name for these plugins
Returns an array of search paths
*/
$tw.getLibraryItemSearchPaths = function(libraryPath,envVar) {
	var pluginPaths = [path.resolve($tw.boot.corePath,libraryPath)],
		env = process.env[envVar];
	if(env) {
		Array.prototype.push.apply(pluginPaths,env.split(":"));
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
		var pluginPaths = $tw.getLibraryItemSearchPaths(libraryPath,envVar);
		for(var t=0; t<plugins.length; t++) {
			$tw.loadPlugin(plugins[t],pluginPaths);
		}
	}
};

/*
path: path of wiki directory
parentPaths: array of parent paths that we mustn't recurse into
*/
$tw.loadWikiTiddlers = function(wikiPath,parentPaths) {
	parentPaths = parentPaths || [];
	var wikiInfoPath = path.resolve(wikiPath,$tw.config.wikiInfo),
		wikiInfo,
		pluginFields;
	// Bail if we don't have a wiki info file
	if(fs.existsSync(wikiInfoPath)) {
		wikiInfo = JSON.parse(fs.readFileSync(wikiInfoPath,"utf8"));
	} else {
		return null;
	}
	// Load any parent wikis
	if(wikiInfo.includeWikis) {
		parentPaths = parentPaths.slice(0);
		parentPaths.push(wikiPath);
		$tw.utils.each(wikiInfo.includeWikis,function(includedWikiPath) {
			var resolvedIncludedWikiPath = path.resolve(wikiPath,includedWikiPath);
			if(parentPaths.indexOf(resolvedIncludedWikiPath) === -1) {
				$tw.loadWikiTiddlers(resolvedIncludedWikiPath,parentPaths);
			} else {
				$tw.utils.error("Cannot recursively include wiki " + resolvedIncludedWikiPath);
			}
		});
	}
	// Load any plugins, themes and languages listed in the wiki info file
	$tw.loadPlugins(wikiInfo.plugins,$tw.config.pluginsPath,$tw.config.pluginsEnvVar);
	$tw.loadPlugins(wikiInfo.themes,$tw.config.themesPath,$tw.config.themesEnvVar);
	$tw.loadPlugins(wikiInfo.languages,$tw.config.languagesPath,$tw.config.languagesEnvVar);
	// Load the wiki files, registering them as writable
	var resolvedWikiPath = path.resolve(wikiPath,$tw.config.wikiTiddlersSubDir);
	$tw.utils.each($tw.loadTiddlersFromPath(resolvedWikiPath),function(tiddlerFile) {
		if(tiddlerFile.filepath) {
			$tw.utils.each(tiddlerFile.tiddlers,function(tiddler) {
				$tw.boot.files[tiddler.title] = {
					filepath: tiddlerFile.filepath,
					type: tiddlerFile.type,
					hasMetaFile: tiddlerFile.hasMetaFile
				};
			});
		}
		$tw.wiki.addTiddlers(tiddlerFile.tiddlers);
	});
	// Save the original tiddler file locations if requested
	var config = wikiInfo.config || {};
	if(config["retain-original-tiddler-path"]) {
		var output = {};
		for(var title in $tw.boot.files) {
			output[title] = path.relative(resolvedWikiPath,$tw.boot.files[title].filepath);
		}
		$tw.wiki.addTiddler({title: "$:/config/OriginalTiddlerPaths", type: "application/json", text: JSON.stringify(output)});
	}
	// Save the path to the tiddlers folder for the filesystemadaptor
	$tw.boot.wikiTiddlersPath = path.resolve($tw.boot.wikiPath,config["default-tiddler-location"] || $tw.config.wikiTiddlersSubDir);
	// Load any plugins within the wiki folder
	var wikiPluginsPath = path.resolve(wikiPath,$tw.config.wikiPluginsSubDir);
	if(fs.existsSync(wikiPluginsPath)) {
		var pluginFolders = fs.readdirSync(wikiPluginsPath);
		for(var t=0; t<pluginFolders.length; t++) {
			pluginFields = $tw.loadPluginFolder(path.resolve(wikiPluginsPath,"./" + pluginFolders[t]));
			if(pluginFields) {
				$tw.wiki.addTiddler(pluginFields);
			}
		}
	}
	// Load any themes within the wiki folder
	var wikiThemesPath = path.resolve(wikiPath,$tw.config.wikiThemesSubDir);
	if(fs.existsSync(wikiThemesPath)) {
		var themeFolders = fs.readdirSync(wikiThemesPath);
		for(var t=0; t<themeFolders.length; t++) {
			pluginFields = $tw.loadPluginFolder(path.resolve(wikiThemesPath,"./" + themeFolders[t]));
			if(pluginFields) {
				$tw.wiki.addTiddler(pluginFields);
			}
		}
	}
	// Load any languages within the wiki folder
	var wikiLanguagesPath = path.resolve(wikiPath,$tw.config.wikiLanguagesSubDir);
	if(fs.existsSync(wikiLanguagesPath)) {
		var languageFolders = fs.readdirSync(wikiLanguagesPath);
		for(var t=0; t<languageFolders.length; t++) {
			pluginFields = $tw.loadPluginFolder(path.resolve(wikiLanguagesPath,"./" + languageFolders[t]));
			if(pluginFields) {
				$tw.wiki.addTiddler(pluginFields);
			}
		}
	}
	return wikiInfo;
};

$tw.loadTiddlersNode = function() {
	// Load the boot tiddlers
	$tw.utils.each($tw.loadTiddlersFromPath($tw.boot.bootPath),function(tiddlerFile) {
		$tw.wiki.addTiddlers(tiddlerFile.tiddlers);
	});
	// Load the core tiddlers
	$tw.wiki.addTiddler($tw.loadPluginFolder($tw.boot.corePath));
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
$tw.boot.startup = function(options) {
	options = options || {};
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
			jsModuleHeaderRegExpString: "^\\/\\*\\\\(?:\\r?\\n)((?:^[^\\r\\n]*(?:\\r?\\n))+?)(^\\\\\\*\\/$(?:\\r?\\n)?)",
			fileExtensionInfo: Object.create(null), // Map file extension to {type:}
			contentTypeInfo: Object.create(null), // Map type to {encoding:,extension:}
			pluginsEnvVar: "TIDDLYWIKI_PLUGIN_PATH",
			themesEnvVar: "TIDDLYWIKI_THEME_PATH",
			languagesEnvVar: "TIDDLYWIKI_LANGUAGE_PATH",
			editionsEnvVar: "TIDDLYWIKI_EDITION_PATH"
		}
	});
	if(!$tw.boot.tasks.readBrowserTiddlers) {
		// For writable tiddler files, a hashmap of title to {filepath:,type:,hasMetaFile:}
		$tw.boot.files = Object.create(null);
		// System paths and filenames
		$tw.boot.bootPath = path.dirname(module.filename);
		$tw.boot.corePath = path.resolve($tw.boot.bootPath,"../core");
		// If there's no arguments then default to `--help`
		if($tw.boot.argv.length === 0) {
			$tw.boot.argv = ["--help"];
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
		$tw.packageInfo = require("../package.json");
		// Check node version number
		if($tw.utils.checkVersions($tw.packageInfo.engines.node.substr(2),process.version.substr(1))) {
			$tw.utils.error("TiddlyWiki5 requires node.js version " + $tw.packageInfo.engines.node);
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
	$tw.utils.registerFileType("text/html","utf8",".html");
	$tw.config.fileExtensionInfo[".htm"] = {type: "text/html"};
	$tw.config.fileExtensionInfo[".hta"] = {type: "text/html"};
	$tw.utils.registerFileType("application/hta","utf16le",".hta",{deserializerType:"text/html"});
	$tw.utils.registerFileType("application/javascript","utf8",".js");
	$tw.utils.registerFileType("application/json","utf8",".json");
	$tw.utils.registerFileType("application/pdf","base64",".pdf",{flags:["image"]});
	$tw.utils.registerFileType("image/jpeg","base64",".jpg",{flags:["image"]});
	$tw.utils.registerFileType("image/png","base64",".png",{flags:["image"]});
	$tw.utils.registerFileType("image/gif","base64",".gif",{flags:["image"]});
	$tw.utils.registerFileType("image/svg+xml","utf8",".svg",{flags:["image"]});
	$tw.utils.registerFileType("image/x-icon","base64",".ico",{flags:["image"]});
	$tw.utils.registerFileType("application/font-woff","base64",".woff");
	// Create the wiki store for the app
	$tw.wiki = new $tw.Wiki();
	// Install built in tiddler fields modules
	$tw.Tiddler.fieldModules = $tw.modules.getModulesByTypeAsHashmap("tiddlerfield");
	// Install the tiddler deserializer modules
	$tw.Wiki.tiddlerDeserializerModules = Object.create(null);
	$tw.modules.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerModules);
	// Load tiddlers
	if($tw.boot.tasks.readBrowserTiddlers) {
		$tw.loadTiddlersBrowser();
	} else {
		$tw.loadTiddlersNode();
	}
	// Unpack plugin tiddlers
	$tw.wiki.readPluginInfo();
	$tw.wiki.registerPluginTiddlers("plugin");
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
	$tw.modules.forEachModuleOfType("startup",function(title,module) {
		if(module.startup) {
			$tw.boot.remainingStartupModules.push(module);
		}
	});
	// Keep track of the startup tasks that have been executed
	$tw.boot.executedStartupModules = Object.create(null);
	$tw.boot.disabledStartupModules = $tw.boot.disabledStartupModules || [];
	// Repeatedly execute the next eligible task
	$tw.boot.executeNextStartupTask();
};

/*
Execute the remaining eligible startup tasks
*/
$tw.boot.executeNextStartupTask = function() {
	// Find the next eligible task
	var taskIndex = 0, task,
		asyncTaskCallback = function() {
			if(task.name) {
				$tw.boot.executedStartupModules[task.name] = true;
			}
			return $tw.boot.executeNextStartupTask();
		};
	while(taskIndex < $tw.boot.remainingStartupModules.length) {
		task = $tw.boot.remainingStartupModules[taskIndex];
		if($tw.boot.isStartupTaskEligible(task)) {
			// Remove this task from the list
			$tw.boot.remainingStartupModules.splice(taskIndex,1);
			// Assemble log message
			var s = ["Startup task:",task.name];
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
				return $tw.boot.executeNextStartupTask();
			} else {
				task.startup(asyncTaskCallback);
				return true;
			}
		}
		taskIndex++;
	}
	return false;
};

/*
Returns true if we are running on one platforms specified in a task modules `platforms` array
*/
$tw.boot.doesTaskMatchPlatform = function(taskModule) {
	var platforms = taskModule.platforms;
	if(platforms) {
		for(var t=0; t<platforms.length; t++) {
			if((platforms[t] === "browser" && !$tw.browser) || (platforms[t] === "node" && !$tw.node)) {
				return false;
			}
		}
	}
	return true;
};

$tw.boot.isStartupTaskEligible = function(taskModule) {
	var t;
	// Check that the platform is correct
	if(!$tw.boot.doesTaskMatchPlatform(taskModule)) {
		return false;
	}
	var name = taskModule.name,
		remaining = $tw.boot.remainingStartupModules;
	if(name) {
		// Fail if this module is disabled
		if($tw.boot.disabledStartupModules.indexOf(name) !== -1) {
			return false;
		}
		// Check that no other outstanding tasks must be executed before this one
		for(t=0; t<remaining.length; t++) {
			var task = remaining[t];
			if(task.before && task.before.indexOf(name) !== -1) {
				if($tw.boot.doesTaskMatchPlatform(task) || (task.name && $tw.boot.disabledStartupModules.indexOf(name) !== -1)) {
					return false;
				}
			}
		}
	}
	// Check that all of the tasks that we must be performed after has been done
	var after = taskModule.after;
	if(after) {
		for(t=0; t<after.length; t++) {
			if(!$tw.boot.executedStartupModules[after[t]]) {
				return false;
			}
		}
	}
	return true;
};

/////////////////////////// Main boot function to decrypt tiddlers and then startup

$tw.boot.boot = function() {
	// Initialise crypto object
	$tw.crypto = new $tw.utils.Crypto();
	// Initialise password prompter
	if($tw.browser && !$tw.node) {
		$tw.passwordPrompt = new $tw.utils.PasswordPrompt();
	}
	// Preload any encrypted tiddlers
	$tw.boot.decryptEncryptedTiddlers(function() {
		// Startup
		$tw.boot.startup();
	});
};

/////////////////////////// Autoboot in the browser

if($tw.browser && !$tw.boot.suppressBoot) {
	$tw.boot.boot();
}

return $tw;

});

if(typeof(exports) !== "undefined") {
	exports.TiddlyWiki = _boot;
} else {
	_boot(window.$tw);
}
