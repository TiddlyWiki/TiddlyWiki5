/*\
title: $:/core/modules/utils/base64.js
type: application/javascript
module-type: utils-browser

Base64 utility functions

\*/

/*
Base64 utility functions that work in either browser or Node.js
*/

exports.btoa = binstr => window.btoa(binstr);
exports.atob = b64 => window.atob(b64);

function base64ToBytes(base64) {
	const binString = exports.atob(base64);
	return Uint8Array.from(binString, m => m.codePointAt(0));
};

function bytesToBase64(bytes) {
	const binString = Array.from(bytes, byte => String.fromCodePoint(byte)).join("");
	return exports.btoa(binString);
};

exports.base64EncodeUtf8 = str => bytesToBase64(new TextEncoder().encode(str));

exports.base64DecodeUtf8 = str => new TextDecoder().decode(base64ToBytes(str));

/*
Decode a base64 string
*/
exports.base64Decode = function(string64,binary,urlsafe) {
	const encoded = urlsafe ? string64.replace(/_/g,"/").replace(/-/g,"+") : string64;
	if(binary) return exports.atob(encoded);
	else return exports.base64DecodeUtf8(encoded);
};

/*
Encode a string to base64
*/
exports.base64Encode = function(string64,binary,urlsafe) {
	let encoded;
	if(binary) encoded = exports.btoa(string64);
	else encoded = exports.base64EncodeUtf8(string64);
	if(urlsafe) {
		encoded = encoded.replace(/\+/g,"-").replace(/\//g,"_");
	}
	return encoded;
};