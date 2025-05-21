/*\
title: $:/boot/bootprefix.js
type: application/javascript

This file sets up the globals that need to be available when JavaScript modules are executed in the browser. The overall sequence is:

# BootPrefix.js
# <module definitions>
# Boot.js

See Boot.js for further details of the boot process.

\*/

var _bootprefix = (function($tw) {

"use strict";

$tw = $tw || Object.create(null);
$tw.boot = $tw.boot || Object.create(null);

// Config
$tw.config = $tw.config || Object.create(null);
$tw.config.maxEditFileSize = 100 * 1024 * 1024; // 100MB

// Detect platforms
if(!("browser" in $tw)) {
	$tw.browser = typeof(window) !== "undefined" && typeof(document) !== "undefined" ? {} : null;
}
if(!("node" in $tw)) {
	$tw.node = typeof(process) === "object" ? {} : null;
}
if(!("nodeWebKit" in $tw)) {
	$tw.nodeWebKit = $tw.node && global.window && global.window.nwDispatcher ? {} : null;
}

// Set default boot tasks
$tw.boot.tasks = {
	trapErrors: !!($tw.browser && !$tw.node),
	readBrowserTiddlers: !!($tw.browser && !$tw.node)
};

/*
Information about each module is kept in an object with these members:
	moduleType: type of module
	definition: object, function or string defining the module; see below
	exports: exports of the module, filled in after execution

The `definition` can be of several types:

* An object can be used to directly specify the exports of the module
* A function with the arguments `module,require,exports` that returns `exports`
* A string function body with the same arguments

Each moduleInfo object is stored in two hashmaps: $tw.modules.titles and $tw.modules.types. The first is indexed by title and the second is indexed by type and then title
*/
$tw.modules = {
	titles: {}, // hashmap by module name of moduleInfo
	types: {} // hashmap by module type and then name of moduleInfo
};

// Copyright (c) 2012 Niklas von Hertzen 
// MIT License
// https://github.com/niklasvh/base64-arraybuffer/blob/master/src/index.ts
/** @type {typeof import("fflate")} */
var fflate = $tw.node ? (global.fflate || require("./fflate.js")) : window.fflate

$tw.fflate = Object.create(null);

$tw.fflate.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
$tw.fflate.lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for(let i = 0; i < $tw.fflate.chars.length; i++) { $tw.fflate.lookup[$tw.fflate.chars.charCodeAt(i)] = i; }

/** 
 * @typedef BufferLike
 * @property {number} BYTES_PER_ELEMENT
 * @property {ArrayBuffer} buffer
 * @property {number} byteLength
 * @property {number} byteOffset
 */
/**
 *  
 * @param {BufferLike} buf 
 * @returns {string}
 */
$tw.fflate.bufferToBase64 = (buf) => {
	let bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength),
		i,
		len = bytes.length,
		base64 = '';

	for (i = 0; i < len; i += 3) {
		base64 += $tw.fflate.chars[bytes[i] >> 2];
		base64 += $tw.fflate.chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
		base64 += $tw.fflate.chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
		base64 += $tw.fflate.chars[bytes[i + 2] & 63];
	}

	if (len % 3 === 2) {
		base64 = base64.substring(0, base64.length - 1) + '=';
	} else if (len % 3 === 1) {
		base64 = base64.substring(0, base64.length - 2) + '==';
	}

	return base64;
};



/**
 * 
 * @param {string} base64 
 * @returns {Uint8Array}
 */
$tw.fflate.bufferFromBase64 = function (base64) {
	if (!base64.charCodeAt) console.log(base64);
	let bufferLength = base64.length * 0.75,
		len = base64.length,
		i,
		p = 0,
		encoded1,
		encoded2,
		encoded3,
		encoded4;

	if (base64[base64.length - 1] === '=') {
		bufferLength--;
		if (base64[base64.length - 2] === '=') {
			bufferLength--;
		}
	}

	const arraybuffer = new ArrayBuffer(bufferLength),
		bytes = new Uint8Array(arraybuffer);

	for (i = 0; i < len; i += 4) {
		encoded1 = $tw.fflate.lookup[base64.charCodeAt(i)];
		encoded2 = $tw.fflate.lookup[base64.charCodeAt(i + 1)];
		encoded3 = $tw.fflate.lookup[base64.charCodeAt(i + 2)];
		encoded4 = $tw.fflate.lookup[base64.charCodeAt(i + 3)];

		bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
		bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
		bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
	}

	return bytes;
};


$tw.fflate.parse_json_gzip_base64 = function(text){
	try { return JSON.parse($tw.fflate.parse_gzip_base64(text)); } catch (e) { }
}

$tw.fflate.parse_gzip_base64 = function(text){
	const compressed2 = $tw.fflate.bufferFromBase64(text);
	const decom = fflate.gunzipSync(compressed2);
	return fflate.strFromU8(decom);
}

$tw.fflate.stringify_json_gzip_base64 = function(data){
	return $tw.fflate.to_gzip_base64(JSON.stringify(data));
}

$tw.fflate.to_gzip_base64 = function(text){
	const buf = fflate.strToU8(text);
	const compressed = fflate.compressSync(buf, { level: 4, mem:5 });
	return $tw.utils.bufferToBase64(compressed);
}

/*
Define a JavaScript tiddler module for later execution
	moduleName: name of module being defined
	moduleType: type of module
	definition: module definition; see discussion above
*/
$tw.modules.define = function(moduleName,moduleType,definition) {
	// Create the moduleInfo
	var moduleInfo = {
		moduleType: moduleType,
		definition: definition,
		exports: undefined
	};
	// If the definition is already an object we can use it as the exports
	if(typeof moduleInfo.definition === "object") {
		moduleInfo.exports = definition;
	}
	// Store the module in the titles hashmap
	if(Object.prototype.hasOwnProperty.call($tw.modules.titles,moduleName)) {
		console.log("Warning: Redefined module - " + moduleName);
	}
	$tw.modules.titles[moduleName] = moduleInfo;
	// Store the module in the types hashmap
	if(!Object.prototype.hasOwnProperty.call($tw.modules.types,moduleType)) {
		$tw.modules.types[moduleType] = {};
	}
	if(Object.prototype.hasOwnProperty.call($tw.modules.types[moduleType],moduleName)) {
		console.log("Warning: Redefined module - " + moduleName);
	}
	$tw.modules.types[moduleType][moduleName] = moduleInfo;
};

/*
External JavaScript can populate this array before calling boot.js in order to preload tiddlers
*/
$tw.preloadTiddlers = $tw.preloadTiddlers || [];

/*
Convenience function for pushing a tiddler onto the preloading array
*/
$tw.preloadTiddler = function(fields) {
	$tw.preloadTiddlers.push(fields);
};

/*
Convenience function for pushing an array of tiddlers onto the preloading array
*/
$tw.preloadTiddlerArray = function(fieldsArray) {
	$tw.preloadTiddlers.push.apply($tw.preloadTiddlers,fieldsArray);
};

return $tw;

});

if(typeof(exports) === "undefined") {
	// Set up $tw global for the browser
	window.$tw = _bootprefix(window.$tw);
} else {
	// Export functionality as a module
	exports.bootprefix = _bootprefix;
}
//# sourceURL=$:/boot/bootprefix.js
