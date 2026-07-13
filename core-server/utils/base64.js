/*\
title: $:/core-modules/modules/utils/base64.js
type: application/javascript
module-type: utils-node

Base64 UTF-8 utlity functions.

\*/

"use strict";

const { TextEncoder, TextDecoder } = require("node:util");

exports.btoa = (binstr) => Buffer.from(binstr, "binary").toString("base64");

exports.atob = (b64) => Buffer.from(b64, "base64").toString("binary");

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
