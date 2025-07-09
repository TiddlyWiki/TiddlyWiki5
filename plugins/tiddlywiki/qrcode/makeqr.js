/*\
title: $:/plugins/tiddlywiki/qrcode/makeqr.js
type: application/javascript
module-type: macro

Macro to convert a string into a QR Code

\*/

"use strict";

/*
Information about this macro
*/

const qrcode = require("$:/plugins/tiddlywiki/qrcode/qrcode/qrcode.js");

const QRCODE_GENERATION_ERROR_PREFIX = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><text x="0" y="30" fill="red" font-family="Helvetica, sans-serif" font-size="18">';
const QRCODE_GENERATION_ERROR_SUFFIX = '</text></svg>';

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
	let result;
	try {
		result = generateQrCode(text,{size,errorCorrectLevel});
	} catch(ex) {
		console.log(`makeqr error: ${ex}`);
		result = fallback || (`data:image/svg+xml,${encodeURI(QRCODE_GENERATION_ERROR_PREFIX + ex + QRCODE_GENERATION_ERROR_SUFFIX)}`);
	}
	return result || "";
};

function generateQrCode(text,options) {
	options = options || {};
	const typeNumber = options.typeNumber || 4;
	const errorCorrectLevel = options.errorCorrectLevel || "M";
	const size = options.size || 500;
	let qr;
	try {
		qr = qrcode(typeNumber,errorCorrectLevel);
		qr.addData(text);
		qr.make();
	} catch(e) {
		if(typeNumber >= 40) {
			throw new Error("Text too long to encode");
		} else {
			return generateQrCode(text,{
				size,
				errorCorrectLevel,
				typeNumber: typeNumber + 1
			});
		}
	}
	const cellsize = parseInt(size / qr.getModuleCount());
	const margin = parseInt((size - qr.getModuleCount() * cellsize) / 2);
	return qr.createImgTag(cellsize,margin,size);
}
