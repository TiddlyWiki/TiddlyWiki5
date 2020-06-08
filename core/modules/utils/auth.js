/*\
title: $:/core/modules/utils/auth.js
type: application/javascript
module-type: utils-node

Utility functions related to hash based authentication.

\*/
(function(){

/*jslint node: true, browser: false */
/*global $tw: false */
"use strict";
if($tw.node) {
	var crypto = require("crypto"),
			fs = require("fs"),
			path = require("path");;
}

//	iv + '$' + cipher('aes-256-gcm', randomBytes + date , secret) + '$' + tag
exports.createSessionId = function(secret) {
	var buff = Buffer.alloc(16 + 4);
	crypto.randomBytes(16).copy(buff);
	buff.writeUInt32BE(Date.now()/1000, 16);
	var iv = crypto.randomBytes(12);
	var c = crypto.createCipheriv('aes-256-gcm', secret, iv);
	var result = Buffer.concat([c.update(buff), c.final()]);
	var tag = c.getAuthTag();
	return iv.toString('base64') + '$' + result.toString('base64') + '$' + tag.toString('base64');
};

// Verify sessionId decrypts and its valid for only validSeconds
exports.validateSessionId = function(sessionId, secret, validSeconds) {
	validSeconds = typeof(validSeconds) === 'number' ? validSeconds : 300;
	var splits = sessionId.split('$');
	if (splits.length !== 3) {
		return false;
	}
	var iv = Buffer.from(splits[0], 'base64');
	var encrypted = Buffer.from(splits[1], 'base64');
	var tag = Buffer.from(splits[2], 'base64');
	var c = crypto.createDecipheriv('aes-256-gcm', secret, iv);
	c.setAuthTag(tag);
	try {
		var buff = Buffer.concat([c.update(encrypted), c.final()]);
	} catch (err) {
		return false;
	}
	if (buff.length != 16 + 4) {
		return false;
	}
	var time = buff.readUInt32BE(16);
	if (time + validSeconds < Date.now()/1000) {
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
	validSeconds = typeof(validSeconds) === 'number' ? validSeconds : 24 * 3600;
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

exports.verifyPassword = function(userHash, sessionId, pwInfo, secret) {
	if (!exports.validateSessionId(sessionId, secret)) {
		return false;
	}
	var combined = Buffer.concat([pwInfo[0], Buffer.from(sessionId, 'utf8')]);
	var key = crypto.pbkdf2Sync(combined, pwInfo[1], 4096, 256/8, 'sha256');
	return key.toString('hex') === userHash;
};

exports.parsePasswordHash = function(param) {
	var splits = param.split(':');
	if (splits.length === 2) {
		// password is pbkdf2(password, salt, 4096, 256/8, 'sha256');
		var pwHash = Buffer.from(splits[0], 'hex');
		var salt = Buffer.from(splits[1], 'hex');
		var errMsg = "";
		if (pwHash.length != 32) {
			errMsg += "password should be 32 bytes.";
		}
		if (salt.length < 16) {
			errMsg += " salt should be atleast 16 bytes.";
		}
		return errMsg ? errMsg : [pwHash, salt];
	} else {
		return "Expected <password>:<salt>";
	}
};

exports.parseSecret = function(secretHex) {
	var secretKey = Buffer.from(secretHex, 'hex');
	if (secretKey.length != 32) {
		return "serversecret should be 32 bytes.";
	}
	return secretKey;
};

var rndSalt = crypto.randomBytes(16);
exports.generateUserHash = function(user) {
	return crypto.pbkdf2Sync(Buffer.from(user, 'utf8'), rndSalt, 64, 16, 'sha256');
};

exports.loadCredentialFile = function(file) {
	var filePath = path.resolve($tw.boot.wikiPath, file);
	var map = {};
	if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
		var creds = fs.readFileSync(filePath,"utf8").split(/\r?\n/mg);
		for (var i = 0; i < creds.length; ++i) {
			var row = creds[i].trim();
			if (i == 0 && row.startsWith("username")) {
				continue;
			}
			if (row !== "") {
				var fields = row.split(',');
				if (fields.length === 2) {
					map[fields[0]] = exports.parsePasswordHash(fields[1]);
				}
			}
		}
	}
	return map;
};

// Utility function to generate a password hash with sale from a plaintext.
exports.generatePasswordHash = function(passwordStr) {
	var salt = crypto.randomBytes(16);
	var pwBytes = Buffer.from(passwordStr, 'utf8');
	var pwHash = crypto.pbkdf2Sync(pwBytes, salt, 4096, 256/8, 'sha256');
	return pwHash.toString('hex') + ':' + salt.toString('hex');
};

// Utility function to generate a server side secret.
exports.generateSecret = function() {
	return crypto.randomBytes(32).toString('hex');
};

})();
