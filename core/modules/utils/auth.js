/*\
title: $:/core/modules/utils/auth.js
type: application/javascript
module-type: utils

Utility functions related to hash based authentication.

\*/
(function(){

/*jslint node: true, browser: false */
/*global $tw: false */
"use strict";
if($tw.node) {
	var crypto = require("crypto");
}

//	iv + '$' + cipher('aes-256-gcm', randomBytes + date + salt, secret) + '$' + tag
exports.createSessionId = function(pwInfo) {
	var buff = Buffer.alloc(16 + 4 + pwInfo.salt.length);
	var rnd1 = crypto.randomBytes(16);
	rnd1.copy(buff);
	buff.writeUInt32BE(Date.now()/1000, 16);
	pwInfo.salt.copy(buff, 20);
	var iv = crypto.randomBytes(12);
	var c = crypto.createCipheriv('aes-256-gcm', pwInfo.secretKey, iv);
	var result = Buffer.concat([c.update(buff), c.final()]);
	var tag = c.getAuthTag();
	return iv.toString('base64') + '$' + result.toString('base64') + '$' + tag.toString('base64');
};

// Verify sessionId decrypts and its valid for only 60s
exports.validateSessionId = function(sessionId, pwInfo, validSeconds) {
	validSeconds = typeof(validSeconds) === 'number' ? validSeconds : 24 * 3600;
	var splits = sessionId.split('$');
	if (splits.length != 3) {
		return false;
	}
	var iv = Buffer.from(splits[0], 'base64');
	var encrypted = Buffer.from(splits[1], 'base64');
	var tag = Buffer.from(splits[2], 'base64');
	var c = crypto.createDecipheriv('aes-256-gcm', pwInfo.secretKey, iv);
	c.setAuthTag(tag);
	try {
		var buff = Buffer.concat([c.update(encrypted), c.final()]);
	} catch (err) {
		return false;
	}
	if (buff.length != 16 + 4 + pwInfo.salt.length) {
		return false;
	}
	var time = buff.readUInt32BE(16);
	if (time + validSeconds < Date.now()/1000 || !buff.slice(20).equals(pwInfo.salt)) {
		return false;
	}
	return true;
}

// cookie = encrypt('aes-256-gcm', random20Bytes + date + username, secret) + iv + tag;
exports.createCookie = function(username, secret) {
	var iv = crypto.randomBytes(12);
	var cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
	var ubytes = Buffer.from(username, 'utf8');
	var data = Buffer.alloc(20 + 4 + username.length);
	crypto.randomBytes(20).copy(data); // Add time into this.
	data.writeUInt32BE(Date.now()/1000, 20);
	ubytes.copy(data, 24);
	var buff = Buffer.concat([cipher.update(data), cipher.final(), iv, cipher.getAuthTag()]);
	return buff.toString('base64');
};

// Returns username.
exports.validateCookie = function(cookie, secret, validSeconds) {
	validSeconds = typeof(validSeconds) === 'number' ? validSeconds : 300;
	var buff = Buffer.from(cookie.trim(), "base64");
	if (buff.length < 12 + 16 + 1) {
		return false;
	}
	var s = buff.length - 12 - 16;
	var data = buff.slice(0, s);
	var iv = buff.slice(s, s + 12);
	var tag = buff.slice(s + 12);
	var decipher = crypto.createDecipheriv('aes-256-gcm', secret, iv);
	try {
		decipher.setAuthTag(tag);
		var buff = Buffer.concat([decipher.update(data), decipher.final()]);
		var time = buff.readUInt32BE(20);
		if (time + validSeconds < Date.now()/1000) {
			return false;
		}
		return buff.toString('utf8', 20 + 4);
	} catch (err) {
		return false;
	}
};

exports.verifyPassword = function(userHash, sessionId, pwInfo) {
	if (!exports.validateSessionId(sessionId, pwInfo)) {
		return false;
	}
	var combined = Buffer.concat([pwInfo.pwHash, Buffer.from(sessionId, 'utf8')]);
	var key = crypto.pbkdf2Sync(combined, pwInfo.salt, 4096, 32, 'sha256');
	return key.toString('hex') === userHash;
};

exports.extractHashInfo = function(param) {
	var info = {};
	var errMsg = "";
	var splits = param.split(':');
	if (splits.length === 3) {
		// password is pbkdf2(password, salt, 4096, 256/8, 'sha256');
		info.pwHash = Buffer.from(splits[0], 'hex');
		info.salt = Buffer.from(splits[1], 'hex');
		info.secretKey = Buffer.from(splits[2], 'hex');
		if (info.pwHash.length != 32) {
			errMsg += " password should be 32 bytes.";
		}
		if (info.salt.length < 16) {
			errMsg += " salt should be atleast 16 bytes.";
		}
		if (info.secretKey.length != 32) {
			errMsg += " serversecret should be 32 bytes.";
		}
	} else {
		errMsg = " Expected <password>:<salt>:<secret>";
	}
	return errMsg ? errMsg : info;
};

exports.generatePasswordHash = function(passwordStr, salt, secret) {
	salt = salt || crypto.randomBytes(16);
	secret = secret || crypto.randomBytes(32);
	var pwBytes = Buffer.from(passwordStr, 'utf8');
	var pwHash = crypto.pbkdf2Sync(pwBytes, salt, 4096, 256/8, 'sha256');
	return pwHash.toString('hex') + ':' + salt.toString('hex') + ':' + secret.toString('hex');
};

})();
