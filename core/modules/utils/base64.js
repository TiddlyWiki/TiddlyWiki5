/*\
title: $:/core/modules/utils/base64.js
type: application/javascript
module-type: utils-browser

Base64 utility functions

\*/

"use strict";

/*
Base64 utility functions that work in either browser or Node.js
*/

exports.btoa = (binstr) => window.btoa(binstr);
exports.atob = (b64) => window.atob(b64);

function base64ToBytes(base64) {
	const binString = exports.atob(base64);
	return Uint8Array.from(binString, (m) => m.codePointAt(0));
};

function bytesToBase64(bytes) {
	const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
	return exports.btoa(binString);
};

exports.base64EncodeUtf8 = (str) => bytesToBase64(new TextEncoder().encode(str));

exports.base64DecodeUtf8 = (str) => new TextDecoder().decode(base64ToBytes(str));