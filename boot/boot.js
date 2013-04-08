/*\
title: $:/core/boot.js
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

// Set up $tw global for the server
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
Display an error and exit
*/
$tw.utils.error = function(err) {
	console.error(err);
	process.exit(1);
};

/*
Check if an object has a property
*/
$tw.utils.hop = function(object,property) {
	return Object.prototype.hasOwnProperty.call(object,property);
};

/*
Determine if a value is an array
*/
$tw.utils.isArray = function(value) {
	return Object.prototype.toString.call(value) == "[object Array]";
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

// Convert a date into YYYYMMDDHHMM format
$tw.utils.stringifyDate = function(value) {
	return value.getUTCFullYear() +
			$tw.utils.pad(value.getUTCMonth() + 1) +
			$tw.utils.pad(value.getUTCDate()) + 
			$tw.utils.pad(value.getUTCHours()) + 
			$tw.utils.pad(value.getUTCMinutes());
};

// Parse a date from a YYYYMMDDHHMMSSMMM format string
$tw.utils.parseDate = function(value) {
	if(typeof value === "string") {
		return new Date(Date.UTC(parseInt(value.substr(0,4),10),
				parseInt(value.substr(4,2),10)-1,
				parseInt(value.substr(6,2),10),
				parseInt(value.substr(8,2)||"00",10),
				parseInt(value.substr(10,2)||"00",10),
				parseInt(value.substr(12,2)||"00",10),
				parseInt(value.substr(14,3)||"000",10)));
	} else if (value instanceof Date) {
		return value;
	} else {
		return null;
	}
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
				results.push(match[1] || match[2]);
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
}

/*
Creates a PasswordPrompt object
*/
$tw.utils.PasswordPrompt = function() {
	// Store of pending password prompts
	this.passwordPrompts = [];
	// Create the wrapper
	this.promptWrapper = document.createElement("div");
	this.promptWrapper.className = "tw-password-wrapper";
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
		form = document.createElement("form"),
		html = ["<h1>" + options.serviceName + "</h1>"];
	if(!options.noUserName) {
		html.push("<input type='text' name='username' class='input-small' placeholder='Username'>");
	}
	html.push("<input type='password' name='password' class='input-small' placeholder='Password'>",
			"<button type='submit' class='btn'>" + submitText + "</button>");
	form.className = "form-inline";
	form.setAttribute("autocomplete","off");
	form.innerHTML = html.join("\n");
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
					form.elements[t].value = "";
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
				if(fieldModule) {
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
$tw.modules.define("$:/boot/tiddlerfields/tags","tiddlerfield",{
	name: "tags",
	parse: $tw.utils.parseStringArray,
	stringify: function(value) {
		var result = [];
		for(var t=0; t<value.length; t++) {
			if(value[t].indexOf(" ") !== -1) {
				result.push("[[" + value[t] + "]]");
			} else {
				result.push(value[t]);
			}
		}
		return result.join(" ");
	}
});

/////////////////////////// Barebones wiki store

/*
Construct a wiki store object
*/
$tw.Wiki = function() {
	this.tiddlers = {};
	this.plugins = {}; // Hashmap of plugin information by title
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
Extract constituent tiddlers from plugin tiddlers so that we can easily access them in getTiddler()
*/
$tw.Wiki.prototype.unpackPluginTiddlers = function() {
	// Collect up the titles of all the plugin tiddlers
	var self = this,
		pluginInfoList = [];
	$tw.utils.each(this.tiddlers,function(tiddler,title,object) {
		if(tiddler.fields.type === "application/json" && tiddler.hasField("plugin")) {
			pluginInfoList.push(tiddler);
		}
	});
	// Sort the titles by the `pluginPriority` field
	pluginInfoList.sort(function(a,b) {
		if("pluginPriority" in a.fields && "pluginPriority" in b.fields) {
			return a.fields.pluginPriority - b.fields.pluginPriority;
		} else if("pluginPriority" in a.fields) {
			return -1;
		} else if("pluginPriority" in b.fields) {
			return +1;
		} else if(a.fields.title < b.fields.title) {
			return -1;
		} else if(a.fields.title === b.fields.title) {
			return 0;
		} else {
			return +1;
		}
	});
	// Now go through the plugins in ascending order
	$tw.utils.each(pluginInfoList,function(tiddler) {
		// Save the plugin information
		var pluginInfo = self.plugins[tiddler.fields.title] = JSON.parse(tiddler.fields.text);
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
					// We don't need to register JavaScript tiddlers in the browser
					if(!$tw.browser) {
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
$tw.Wiki.prototype.definePluginModules = function() {
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
Execute the module named 'moduleName'. The name can optionally be relative to the module named 'moduleRoot'
*/
$tw.modules.execute = function(moduleName,moduleRoot) {
	/*jslint evil: true */
	var name = moduleRoot ? $tw.utils.resolvePath(moduleName,moduleRoot) : moduleName,
		require = function(modRequire) {
			return $tw.modules.execute(modRequire,name);
		},
		exports = {},
		moduleInfo = $tw.modules.titles[name];
	if(!moduleInfo) {
		$tw.utils.error("Cannot find module named '" + moduleName + "' required by module '" + moduleRoot + "', resolved to " + name);
	}
	if(!moduleInfo.exports) {
		if(typeof moduleInfo.definition === "string") { // String
			moduleInfo.definition = window["eval"]("(function(module,exports,require) {" + moduleInfo.definition + "})");
			moduleInfo.exports = {};
			moduleInfo.definition(moduleInfo,moduleInfo.exports,require);
		} else if(typeof moduleInfo.definition === "function") { // Function
			moduleInfo.exports = {};
			moduleInfo.definition(moduleInfo,moduleInfo.exports,require);
		} else { // Object
			moduleInfo.exports = moduleInfo.definition;
		}
	}
	return moduleInfo.exports;
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
					var tiddlers = extractTextTiddlers(node.childNodes[t]),
						childNode = node.childNodes[t];
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
			process: process,
			setInterval: setInterval,
			clearInterval: clearInterval,
			setTimeout: setTimeout,
			clearTimeout: clearTimeout,
			$tw: $tw,
			require: function(title) {
				return $tw.modules.execute(title,name);
			}
		};
	if(!moduleInfo) {
		// If we don't have a module with that name, let node.js try to find it
		return require(moduleName);
	}
	// Execute the module if we haven't already done so
	if(!moduleInfo.exports) {
		try {
			// Check the type of the definition
			if(typeof moduleInfo.definition === "string") { // String
				vm.runInNewContext(moduleInfo.definition,sandbox,tiddler.fields.title);
				moduleInfo.exports = sandbox.exports;
			} else if(typeof moduleInfo.definition === "function") { // Function
				moduleInfo.exports = moduleInfo.definition(moduleInfo,sandbox.require,moduleInfo.exports);
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
	// Save the plugin tiddler
	if(pluginInfo) {
		var fields = {
			title: pluginInfo.title,
			type: "application/json",
			plugin: "yes",
			text: JSON.stringify(pluginInfo,null,4)
		}
		if("pluginPriority" in pluginInfo) {
			fields.pluginPriority = pluginInfo.pluginPriority;
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
	$tw.boot.wikiInfo = $tw.loadWikiTiddlers($tw.boot.wikiPath);
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
			wikiInfo: "./tiddlywiki.info",
			wikiPluginsSubDir: "./plugins",
			wikiTiddlersSubDir: "./tiddlers",
			jsModuleHeaderRegExpString: "^\\/\\*\\\\\\n((?:^[^\\n]*\\n)+?)(^\\\\\\*\\/$\\n?)",
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
		$tw.boot.argv = Array.prototype.slice.call(process.argv,2);
		if($tw.boot.argv[0] && $tw.boot.argv[0].indexOf("--") !== 0) {
			$tw.boot.wikiPath = $tw.boot.argv[0];
			$tw.boot.argv = $tw.boot.argv.slice(1);
		} else {
			$tw.boot.wikiPath = process.cwd();
		}
		$tw.boot.wikiTiddlersPath = path.resolve($tw.boot.wikiPath,$tw.config.wikiTiddlersSubDir);
		// Read package info
		$tw.packageInfo = JSON.parse(fs.readFileSync($tw.boot.corePath + "/../package.json"));
		// Check node version number
		if($tw.utils.checkVersions($tw.packageInfo.engines.node.substr(2),process.version.substr(1))) {
			$tw.utils.error("TiddlyWiki5 requires node.js version " + $tw.packageInfo.engine.node);
		}
	}
	// Add file extension information
	$tw.utils.registerFileType("text/vnd.tiddlywiki","utf8",".tid");
	$tw.utils.registerFileType("application/x-tiddler","utf8",".tid");
	$tw.utils.registerFileType("application/x-tiddler-html-div","utf8",".tiddler");
	$tw.utils.registerFileType("application/vnd.tiddlywiki2-recipe","utf8",".recipe");
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
	$tw.wiki.unpackPluginTiddlers();
	// Register typed modules from the tiddlers we've just loaded
	$tw.wiki.defineTiddlerModules();
	// And any modules within plugins
	$tw.wiki.definePluginModules();
	// Make sure the crypto state tiddler is up to date
	$tw.crypto.updateCryptoStateTiddler();
	// Run any startup modules
	$tw.modules.forEachModuleOfType("startup",function(title,module) {
		if(module.startup) {
			module.startup();
		}
	});
};

/////////////////////////// Decrypt tiddlers and then startup

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

})();
