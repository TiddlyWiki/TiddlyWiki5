/*\
title: $:/plugins/tiddlywiki/qrcode/makeqr.js
type: application/javascript
module-type: macro

Macro to convert a string into a QR Code

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

var qrcode = require("$:/plugins/tiddlywiki/qrcode/qrcode.js");

var QRCODE_GENERATION_ERROR_PREFIX = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><text x="0" y="30" fill="red" font-family="Helvetica, sans-serif" font-size="18">',
	QRCODE_GENERATION_ERROR_SUFFIX = '</text></svg>';

exports.name = "makeqr";

exports.params = [
	{name: "text"},
	{name: "size"},
	{name: "errorCorrectLevel"},
	{name: "fallback"}
];

/*
Run the macro
*/
exports.run = function(text,size,errorCorrectLevel,fallback) {
	var result;
	try {
		result = generateQrCode(text,{size: size, errorCorrectLevel: errorCorrectLevel});
	} catch (ex) {
		console.log("makeqr error: " + ex);
		result = fallback || ("data:image/svg+xml," + encodeURI(QRCODE_GENERATION_ERROR_PREFIX + ex + QRCODE_GENERATION_ERROR_SUFFIX));
	}
	return result || "";
};

function generateQrCode(text,options) {
	options = options || {};
	var typeNumber = options.typeNumber || 4,
		errorCorrectLevel = options.errorCorrectLevel || "M",
		size = options.size || 500,
		qr;
	try {
		qr = qrcode(typeNumber,errorCorrectLevel);
		qr.addData(text);
		qr.make();
	} catch (e) {
		if(typeNumber >= 40) {
			throw new Error("Text too long to encode");
		} else {
			return generateQrCode(text, {
				size: size,
				errorCorrectLevel: errorCorrectLevel,
				typeNumber: typeNumber + 1
			});
		}
	}
	var cellsize = parseInt(size / qr.getModuleCount()),
		margin = parseInt((size - qr.getModuleCount() * cellsize) / 2);
	return qr.createImgTag(cellsize, margin, size);
}


})();
