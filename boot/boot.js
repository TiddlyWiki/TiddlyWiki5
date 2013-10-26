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
(function() {

/*jslint node: true, browser: true */
/*global modules: false, $tw: false */
"use strict";

/////////////////////////// Setting up $tw

// Set up $tw global for the server (set up for browser is in bootprefix.js)
if(typeof(window) === "undefined") {
	global.$tw = global.$tw || {}; // No `browser` member for the server
	exports.$tw = $tw; // Export $tw for when boot.js is required directly in node.js
}

// Include bootprefix if we're on the server
if(!$tw.browser) {
	require("./bootprefix.js");
}

$tw.utils = $tw.utils || {};
$tw.boot = $tw.boot || {};

/////////////////////////// Standard node.js libraries

var fs, path, vm;
if(!$tw.browser) {
	fs = require("fs");
	path = require("path");
	vm = require("vm");
}

/////////////////////////// Utility functions

/*
Log a message
*/
$tw.utils.log = function(/* args */) {
	if(console !== undefined && console.log !== undefined) {
		return Function.apply.call(console.log, console, arguments);
	}
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
		if($tw.utils.isArray(object)) {
			for(f=0; f<object.length; f++) {
				callback(object[f],f,object);
			}
		} else {
			for(f in object) {
				if($tw.utils.hop(object,f)) {
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
		element.appendChild(document.createTextNode(options.text));
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
	if($tw.browser) {
		// Display an error message to the user
		var dm = $tw.utils.domMaker,
			heading = dm("h1",{text: errHeading}),
			prompt = dm("div",{text: promptMsg, "class": "tw-error-prompt"}),
			message = dm("div",{text: err}),
			button = dm("button",{text: "close"}),
			form = dm("form",{children: [heading,prompt,message,button], "class": "tw-error-form"});
		document.body.insertBefore(form,document.body.firstChild);
		form.addEventListener("submit",function(event) {
			document.body.removeChild(form);
			event.preventDefault();
			return false;
		},true);
		return null;
	} else {
		// Exit if we're under node.js
		process.exit(1);
	}
};

/*
Use our custom error handler if we're in the browser
*/
if($tw.browser) {
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
				if(object[p] == null) {
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
Convert "&amp;" to &, "&lt;" to <, "&gt;" to > and "&quot;" to "
*/
$tw.utils.htmlDecode = function(s) {
	return s.toString().replace(/&lt;/mg,"<").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
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

// Convert a date into UTC YYYYMMDDHHMM format
$tw.utils.stringifyDate = function(value) {
	return value.getUTCFullYear() +
			$tw.utils.pad(value.getUTCMonth() + 1) +
			$tw.utils.pad(value.getUTCDate()) + 
			$tw.utils.pad(value.getUTCHours()) + 
			$tw.utils.pad(value.getUTCMinutes());
};

// Parse a date from a UTC YYYYMMDDHHMMSSMMM format string
$tw.utils.parseDate = function(value) {
	if(typeof value === "string") {
		return new Date(Date.UTC(parseInt(value.substr(0,4),10),
				parseInt(value.substr(4,2),10)-1,
				parseInt(value.substr(6,2),10),
				parseInt(value.substr(8,2)||"00",10),
				parseInt(value.substr(10,2)||"00",10),
				parseInt(value.substr(12,2)||"00",10),
				parseInt(value.substr(14,3)||"000",10)));
	} else if ($tw.utils.isDate(value)) {
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
		var memberRegExp = /(?:\[\[([^\]]+)\]\])|([^\s]+)/mg,
			results = [],
			match;
		do {
			match = memberRegExp.exec(value);
			if(match) {
				var item = match[1] || match[2];
				if(results.indexOf(item) === -1) {
					results.push(item);
				}
			}
		} while(match);
		return results;
	} else if ($tw.utils.isArray(value)) {
		return value;
	} else {
		return null;
	}
};

// Parse a block of name:value fields. The `fields` object is used as the basis for the return value
$tw.utils.parseFields = function(text,fields) {
	fields = fields || {};
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
		return sourcepath;
	}
};

/*
Returns true if the `actual` version is greater than or equal to the `required` version. Both are in `x.y.z` format.
*/
$tw.utils.checkVersions = function(required,actual) {
	var targetVersion = required.split("."),
		currVersion = actual.split("."),
		diff = [parseInt(targetVersion[0],10) - parseInt(currVersion[0],10),
				parseInt(targetVersion[1],10) - parseInt(currVersion[1],10),
				parseInt(targetVersion[2],10) - parseInt(currVersion[2],10)];
	return (diff[0] > 0) ||
		(diff[0] === 0 && diff[1] > 0) ||
		(diff[0] === 0 && diff[1] === 0 && diff[2] > 0);
};

/*
Register file type information
*/
$tw.utils.registerFileType = function(type,encoding,extension) {
	$tw.config.fileExtensionInfo[extension] = {type: type};
	$tw.config.contentTypeInfo[type] = {encoding: encoding, extension: extension};
};

/*
Run code globally with specified context variables in scope
*/
$tw.utils.evalGlobal = function(code,context,filename) {
	var contextCopy = $tw.utils.extend({},context,{
		exports: {}
	});
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
		fn = window["eval"](code);
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
	var sandbox = $tw.utils.extend({},context);
	$tw.utils.extend(sandbox,{
		exports: {}		
	});
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
	this.promptWrapper = $tw.utils.domMaker("div",{"class":"tw-password-wrapper"});
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
callback: function to be called on submission with parameter of object {username:,password:}. Callback must return `true` to remove the password prompt
*/
$tw.utils.PasswordPrompt.prototype.createPrompt = function(options) {
	// Create and add the prompt to the DOM
	var submitText = options.submitText || "Login",
		dm = $tw.utils.domMaker,
		children = [dm("h1",{text: options.serviceName})];
	if(!options.noUserName) {
		children.push(dm("input",{
			attributes: {type: "text", name: "username", placeholder: "Username"},
			"class": "input-small"
		}));
	}
	children.push(dm("input",{
		attributes: {type: "password", name: "password", placeholder: "Password"},
		"class": "input-small"
	}));
	children.push(dm("button",{
		attributes: {type: "submit"},
		text: submitText,
		"class": "btn"
	}));
	var form = dm("form",{
		"class": "form-inline",
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
			var i = self.passwordPrompts.indexOf(promptInfo);
			if(i !== -1) {
				self.passwordPrompts.splice(i,1);
				promptInfo.form.parentNode.removeChild(promptInfo.form);
				self.setWrapperDisplay();
			}
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

/*
Crypto helper object for encrypted content. It maintains the password text in a closure, and provides methods to change
the password, and to encrypt/decrypt a block of text
*/
$tw.utils.Crypto = function() {
	var sjcl = $tw.browser ? window.sjcl : require("./sjcl.js"),
		password = null,
		callSjcl = function(method,inputText) {
			var outputText;
			try {
				outputText = sjcl[method](password,inputText);
			} catch(ex) {
				console.log("Crypto error:" + ex);
				outputText = null;	
			}
			return outputText;
		};
	this.setPassword = function(newPassword) {
		password = newPassword;
		this.updateCryptoStateTiddler();
	};
	this.updateCryptoStateTiddler = function() {
		if($tw.wiki && $tw.wiki.addTiddler) {
			$tw.wiki.addTiddler(new $tw.Tiddler({title: "$:/isEncrypted", text: password ? "yes" : "no"}));
		}
	};
	this.hasPassword = function() {
		return !!password;
	}
	this.encrypt = function(text) {
		return callSjcl("encrypt",text);
	};
	this.decrypt = function(text) {
		return callSjcl("decrypt",text);
	};
};

/////////////////////////// Module mechanism

/*
Execute the module named 'moduleName'. The name can optionally be relative to the module named 'moduleRoot'
*/
$tw.modules.execute = function(moduleName,moduleRoot) {
	var name = moduleRoot ? $tw.utils.resolvePath(moduleName,moduleRoot) : moduleName,
		moduleInfo = $tw.modules.titles[name],
		tiddler = $tw.wiki.getTiddler(name),
		sandbox = {
			module: moduleInfo,
			exports: {},
			console: console,
			setInterval: setInterval,
			clearInterval: clearInterval,
			setTimeout: setTimeout,
			clearTimeout: clearTimeout,
			$tw: $tw,
			require: function(title) {
				return $tw.modules.execute(title,name);
			}
		};
	if(!$tw.browser) {
		$tw.utils.extend(sandbox,{
			process: process
		});
	}
	if(!moduleInfo) {
		if($tw.browser) {
			return $tw.utils.error("Cannot find module named '" + moduleName + "' required by module '" + moduleRoot + "', resolved to " + name);

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
				moduleInfo.exports = {};
				moduleInfo.definition(moduleInfo,moduleInfo.exports,sandbox.require);
			} else if(typeof moduleInfo.definition === "string") { // String
				moduleInfo.exports = $tw.utils.evalSandboxed(moduleInfo.definition,sandbox,tiddler.fields.title);
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
	$tw.utils.each(modules,function(element,title,object) {
		callback(title,$tw.modules.execute(title));
	});
};

/*
Get all the modules of a particular type in a hashmap by their `name` field
*/
$tw.modules.getModulesByTypeAsHashmap = function(moduleType,nameField) {
	nameField = nameField || "name";
	var results = {};
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
		targetObject = {};
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
	var classes = {};
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
	this.fields = {};
	for(var c=0; c<arguments.length; c++) {
		var arg = arguments[c],
			src = (arg instanceof $tw.Tiddler) ? arg.fields : arg;
		for(var t in src) {
			if(src[t] === undefined) {
				if(t in this.fields) {
					delete this.fields[t]; // If we get a field that's undefined, delete any previous field value
				}
			} else {
				// Parse the field with the associated field module (if any)
				var fieldModule = $tw.Tiddler.fieldModules[t];
				if(fieldModule && fieldModule.parse) {
					this.fields[t] = fieldModule.parse.call(this,src[t]);
				} else {
					this.fields[t] = src[t];
				}
			}
		}
	}
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
Construct a wiki store object
*/
$tw.Wiki = function() {
	this.tiddlers = {};
	this.plugins = []; // Array of registered plugins, ordered by priority
	this.shadowTiddlers = {}; // Hashmap by title of {source:, tiddler:}
};

$tw.Wiki.prototype.addTiddler = function(tiddler) {
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = new $tw.Tiddler(tiddler);
	}
	this.tiddlers[tiddler.fields.title] = tiddler;
};

$tw.Wiki.prototype.addTiddlers = function(tiddlers) {
	for(var t=0; t<tiddlers.length; t++) {
		this.addTiddler(tiddlers[t]);
	}	
};

/*
Register the plugin tiddlers of a particular type, optionally restricting registration to an array of tiddler titles. Return the array of titles affected
*/
$tw.Wiki.prototype.registerPluginTiddlers = function(pluginType,titles) {
	var self = this,
		registeredTitles = [];
	// Go through the provided titles, or the entire tiddler list, looking for plugins of this type
	var checkTiddler = function(tiddler) {
		if(tiddler && tiddler.fields.type === "application/json" && tiddler.fields["plugin-type"] === pluginType) {
			self.plugins.push(tiddler);
			registeredTitles.push(tiddler.fields.title);
		}
	};
	if(titles) {
		$tw.utils.each(titles,function(title) {
			checkTiddler(self.getTiddler(title));
		});
	} else {
		$tw.utils.each(this.tiddlers,function(tiddler,title) {
			checkTiddler(tiddler);
		});
	}
	return registeredTitles;
};

/*
Unregister the plugin tiddlers of a particular type, returning an array of the titles affected
*/
$tw.Wiki.prototype.unregisterPluginTiddlers = function(pluginType) {
	var self = this,
		titles = [];
	// Remove any previous registered plugins of this type
	for(var t=this.plugins.length-1; t>=0; t--) {
		var tiddler = this.plugins[t];
		if(tiddler.fields["plugin-type"] === pluginType) {
			titles.push(tiddler.fields.title);
			this.plugins.splice(t,1);
		}
	}
	return titles;
};

/*
Unpack the currently registered plugins, creating shadow tiddlers for their constituent tiddlers
*/
$tw.Wiki.prototype.unpackPluginTiddlers = function() {
	var self = this;
	// Sort the plugin titles by the `plugin-priority` field
	this.plugins.sort(function(a,b) {
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
	this.shadowTiddlers = {};
	$tw.utils.each(this.plugins,function(tiddler) {
		// Get the plugin information
		var pluginInfo = JSON.parse(tiddler.fields.text);
		// Extract the constituent tiddlers
		$tw.utils.each(pluginInfo.tiddlers,function(constituentTiddler,constituentTitle) {
			// Save the tiddler object
			self.shadowTiddlers[constituentTitle] = {
				source: tiddler.fields.title,
				tiddler: new $tw.Tiddler(constituentTiddler,{title: constituentTitle})
			};
		});
	});
};

/*
Define all modules stored in ordinary tiddlers
*/
$tw.Wiki.prototype.defineTiddlerModules = function() {
	$tw.utils.each(this.tiddlers,function(tiddler,title,object) {
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
	$tw.utils.each(this.shadowTiddlers,function(element,title) {
		var tiddler = self.getTiddler(title);
		if(!$tw.utils.hop(self.tiddlers,title)) { // Don't define the module if it is overidden by an ordinary tiddler
			if(tiddler.hasField("module-type")) {
				// Define the module
				$tw.modules.define(tiddler.fields.title,tiddler.fields["module-type"],tiddler.fields.text);
			}
		}
	});
};

$tw.Wiki.prototype.getTiddler = function(title) {
	var t = this.tiddlers[title];
	if(t instanceof $tw.Tiddler) {
		return t;
	} else if($tw.utils.hop(this.shadowTiddlers,title)) {
		return this.shadowTiddlers[title].tiddler;
	} else {
		return undefined;
	}
};

/*
Extracts tiddlers from a typed block of text, specifying default field values
*/
$tw.Wiki.prototype.deserializeTiddlers = function(type,text,srcFields) {
	srcFields = srcFields || {};
	var deserializer = $tw.Wiki.tiddlerDeserializerModules[type],
		fields = {};
	if(!deserializer && $tw.config.fileExtensionInfo[type]) {
		// If we didn't find the serializer, try converting it from an extension to a content type
		type = $tw.config.fileExtensionInfo[type].type;
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
		} else {
			fields.text = "";
		}
		return [fields];
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

if($tw.browser) {

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

$tw.loadTiddlers = function() {
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

// End of if($tw.browser)
}

/////////////////////////// Server definitions

if(!$tw.browser) {

/*
Get any encrypted tiddlers
*/
$tw.boot.decryptEncryptedTiddlers = function(callback) {
	// Storing encrypted tiddlers on the server isn't supported yet
	callback();
};

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
Load all the tiddlers recursively from a directory, including honouring `tiddlywiki.files` files for drawing in external files. Returns an array of {filepath:,type:,tiddlers: [{..fields...}],hasMetaFile:}. Note that no file information is returned for externally loaded tiddlers, just the `tiddlers` property.
*/
$tw.loadTiddlersFromPath = function(filepath,excludeRegExp) {
	excludeRegExp = excludeRegExp || /^\.DS_Store$|.meta$/;
	var tiddlers = [];
	if(fs.existsSync(filepath)) {
		var stat = fs.statSync(filepath);
		if(stat.isDirectory()) {
			var files = fs.readdirSync(filepath);
			// Look for a tiddlywiki.files file
			if(files.indexOf("tiddlywiki.files") !== -1) {
				// If so, process the files it describes
				var filesInfo = JSON.parse(fs.readFileSync(filepath + "/tiddlywiki.files","utf8"));
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
					if(!excludeRegExp.test(file)) {
						tiddlers.push.apply(tiddlers,$tw.loadTiddlersFromPath(filepath + "/" + file,excludeRegExp));
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
	excludeRegExp = excludeRegExp || /^\.DS_Store$|.meta$/;
	var stat, files, pluginInfo, pluginTiddlers = [], f, file, titlePrefix, t;
	if(fs.existsSync(filepath)) {
		stat = fs.statSync(filepath);
		if(stat.isDirectory()) {
			// Read the plugin information
			pluginInfo = JSON.parse(fs.readFileSync(filepath + "/plugin.info","utf8"));
			// Read the plugin files
			files = fs.readdirSync(filepath);
			for(f=0; f<files.length; f++) {
				file = files[f];
				if(!excludeRegExp.test(file) && file !== "plugin.info" && file !== "tiddlywiki.files") {
					var tiddlerFiles = $tw.loadTiddlersFromPath(filepath + "/" + file,excludeRegExp);
					$tw.utils.each(tiddlerFiles,function(tiddlerFile) {
						pluginTiddlers.push.apply(pluginTiddlers,tiddlerFile.tiddlers);
					});
				}
			}
			// Save the plugin tiddlers into the plugin info
			pluginInfo.tiddlers = pluginInfo.tiddlers || {};
			for(t=0; t<pluginTiddlers.length; t++) {
				pluginInfo.tiddlers[pluginTiddlers[t].title] = pluginTiddlers[t];
			}
		}
	}
	// Give the plugin the same version number as the core if it doesn't have one
	if(!("version" in pluginInfo)) {
		pluginInfo.version = $tw.packageInfo.version;
	}
	// Save the plugin tiddler
	if(pluginInfo) {
		var fields = {
			title: pluginInfo.title,
			type: "application/json",
			text: JSON.stringify(pluginInfo,null,4),
			"plugin-priority": pluginInfo["plugin-priority"],
			"name": pluginInfo["name"],
			"version": pluginInfo["version"],
			"thumbnail": pluginInfo["thumbnail"],
			"description": pluginInfo["description"],
			"plugin-type": pluginInfo["plugin-type"] || "plugin"
		}
		return fields;
	} else {
		return null;
	}
};

/*
path: path of wiki directory
parentPaths: array of parent paths that we mustn't recurse into
*/
$tw.loadWikiTiddlers = function(wikiPath,parentPaths) {
	parentPaths = parentPaths || [];
	var wikiInfoPath = path.resolve(wikiPath,$tw.config.wikiInfo),
		wikiInfo = {},
		pluginFields;
	// Bail if we don't have a wiki info file
	if(!fs.existsSync(wikiInfoPath)) {
		$tw.utils.error("Missing tiddlywiki.info file at " + wikiPath);
	}
	wikiInfo = JSON.parse(fs.readFileSync(wikiInfoPath,"utf8"));
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
	// Load any plugins listed in the wiki info file
	if(wikiInfo.plugins) {
		var pluginBasePath = path.resolve($tw.boot.corePath,$tw.config.pluginsPath);
		for(var t=0; t<wikiInfo.plugins.length; t++) {
			pluginFields = $tw.loadPluginFolder(path.resolve(pluginBasePath,"./" + wikiInfo.plugins[t]));
			if(pluginFields) {
				$tw.wiki.addTiddler(pluginFields);
			}
		}
	}
	// Load any themes listed in the wiki info file
	if(wikiInfo.themes) {
		var themesBasePath = path.resolve($tw.boot.corePath,$tw.config.themesPath);
		for(var t=0; t<wikiInfo.themes.length; t++) {
			pluginFields = $tw.loadPluginFolder(path.resolve(themesBasePath,"./" + wikiInfo.themes[t]));
			if(pluginFields) {
				$tw.wiki.addTiddler(pluginFields);
			}
		}
	}
	// Load the wiki files, registering them as writable
	var resolvedWikiPath = path.resolve(wikiPath,$tw.config.wikiTiddlersSubDir);
	$tw.utils.each($tw.loadTiddlersFromPath(resolvedWikiPath),function(tiddlerFile) {
		$tw.wiki.addTiddlers(tiddlerFile.tiddlers);
		if(tiddlerFile.filepath) {
			$tw.utils.each(tiddlerFile.tiddlers,function(tiddler) {
				$tw.boot.files[tiddler.title] = {
					filepath: tiddlerFile.filepath,
					type: tiddlerFile.type,
					hasMetaFile: tiddlerFile.hasMetaFile
				};
			});
		}
	});
	// Save the path to the tiddlers folder for the filesystemadaptor
	$tw.boot.wikiTiddlersPath = path.resolve($tw.boot.wikiPath,$tw.config.wikiTiddlersSubDir);
	// Load any plugins within the wiki folder
	var wikiPluginsPath = path.resolve(wikiPath,$tw.config.wikiPluginsSubDir);
	if(fs.existsSync(wikiPluginsPath)) {
		var pluginFolders = fs.readdirSync(wikiPluginsPath);
		for(t=0; t<pluginFolders.length; t++) {
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
		for(t=0; t<themeFolders.length; t++) {
			pluginFields = $tw.loadPluginFolder(path.resolve(wikiThemesPath,"./" + themeFolders[t]));
			if(pluginFields) {
				$tw.wiki.addTiddler(pluginFields);
			}
		}
	}
	return wikiInfo;
};

$tw.loadTiddlers = function() {
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

// End of if(!$tw.browser)	
}

/////////////////////////// Main startup function called once tiddlers have been decrypted

$tw.boot.startup = function() {
	// Initialise some more $tw properties
	$tw.utils.deepDefaults($tw,{
		modules: { // Information about each module
			titles: {}, // hashmap by module title of {fn:, exports:, moduleType:}
			types: {} // hashmap by module type of hashmap of exports
		},
		config: { // Configuration overridables
			pluginsPath: "../plugins/",
			themesPath: "../themes/",
			wikiInfo: "./tiddlywiki.info",
			wikiPluginsSubDir: "./plugins",
			wikiThemesSubDir: "./themes",
			wikiTiddlersSubDir: "./tiddlers",
			jsModuleHeaderRegExpString: "^\\/\\*\\\\(?:\\r?\\n)((?:^[^\\r\\n]*(?:\\r?\\n))+?)(^\\\\\\*\\/$(?:\\r?\\n)?)",
			fileExtensionInfo: {}, // Map file extension to {type:}
			contentTypeInfo: {} // Map type to {encoding:,extension:}
		}
	});
	if(!$tw.browser) {
		// For writable tiddler files, a hashmap of title to {filepath:,type:,hasMetaFile:}
		$tw.boot.files = {};
		// System paths and filenames
		$tw.boot.bootPath = path.dirname(module.filename);
		$tw.boot.corePath = path.resolve($tw.boot.bootPath,"../core");
		// If the first command line argument doesn't start with `--` then we
		// interpret it as the path to the wiki folder, which will otherwise default
		// to the current folder
		if($tw.boot.argv[0] === "*") {
			$tw.boot.wikiPath = undefined;
			$tw.boot.argv = $tw.boot.argv.slice(1);
		} else if($tw.boot.argv[0] && $tw.boot.argv[0].indexOf("--") !== 0) {
			$tw.boot.wikiPath = $tw.boot.argv[0];
			$tw.boot.argv = $tw.boot.argv.slice(1);
		} else {
			$tw.boot.wikiPath = process.cwd();
		}
		// Read package info
		$tw.packageInfo = require("../package");
		// Check node version number
		if($tw.utils.checkVersions($tw.packageInfo.engines.node.substr(2),process.version.substr(1))) {
			$tw.utils.error("TiddlyWiki5 requires node.js version " + $tw.packageInfo.engines.node);
		}
	}
	// Add file extension information
	$tw.utils.registerFileType("text/vnd.tiddlywiki","utf8",".tid");
	$tw.utils.registerFileType("application/x-tiddler","utf8",".tid");
	$tw.utils.registerFileType("application/x-tiddler-html-div","utf8",".tiddler");
	$tw.utils.registerFileType("text/vnd.tiddlywiki2-recipe","utf8",".recipe");
	$tw.utils.registerFileType("text/plain","utf8",".txt");
	$tw.utils.registerFileType("text/css","utf8",".css");
	$tw.utils.registerFileType("text/html","utf8",".html");
	$tw.utils.registerFileType("application/javascript","utf8",".js");
	$tw.utils.registerFileType("application/json","utf8",".json");
	$tw.utils.registerFileType("application/pdf","base64",".pdf");
	$tw.utils.registerFileType("image/jpeg","base64",".jpg");
	$tw.utils.registerFileType("image/png","base64",".png");
	$tw.utils.registerFileType("image/gif","base64",".gif");
	$tw.utils.registerFileType("image/svg+xml","utf8",".svg");
	$tw.utils.registerFileType("application/font-woff","base64",".woff");
	// Create the wiki store for the app
	$tw.wiki = new $tw.Wiki();
	// Install built in tiddler fields modules
	$tw.Tiddler.fieldModules = $tw.modules.getModulesByTypeAsHashmap("tiddlerfield");
	// Install the tiddler deserializer modules
	$tw.Wiki.tiddlerDeserializerModules = {};
	$tw.modules.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerModules);
	// Load tiddlers
	$tw.loadTiddlers();
	// Unpack plugin tiddlers
	$tw.wiki.registerPluginTiddlers("plugin");
	$tw.wiki.unpackPluginTiddlers();
	// Register typed modules from the tiddlers we've just loaded
	$tw.wiki.defineTiddlerModules();
	// And any modules within plugins
	$tw.wiki.defineShadowModules();
	// Make sure the crypto state tiddler is up to date
	$tw.crypto.updateCryptoStateTiddler();
	// Run any startup modules
	$tw.modules.forEachModuleOfType("startup",function(title,module) {
		if(module.startup) {
			module.startup();
		}
	});
};

/////////////////////////// Main boot function to decrypt tiddlers and then startup

$tw.boot.boot = function() {
	// Initialise crypto object
	$tw.crypto = new $tw.utils.Crypto();
	// Initialise password prompter
	if($tw.browser) {
		$tw.passwordPrompt = new $tw.utils.PasswordPrompt();
	}
	// Preload any encrypted tiddlers
	$tw.boot.decryptEncryptedTiddlers(function() {
		// Startup
		$tw.boot.startup();
	});
};

/////////////////////////// Autoboot in the browser

if($tw.browser) {
	$tw.boot.boot();
}

})();
