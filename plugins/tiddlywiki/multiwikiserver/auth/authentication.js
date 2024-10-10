/*\
title: $:/plugins/tiddlywiki/multiwikiserver/auth/authentication.js
type: application/javascript
module-type: library

Handles authentication related operations

\*/

(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var crypto = require("crypto");

function Authenticator($tw) {
	if(!(this instanceof Authenticator)) {
		return new Authenticator($tw);
	}
	this.sqlTiddlerDatabase = $tw.mws.store.sqlTiddlerDatabase;
}

Authenticator.prototype.verifyPassword = function(inputPassword, storedHash) {
	var hashedInput = this.hashPassword(inputPassword);
	return hashedInput === storedHash;
};

Authenticator.prototype.hashPassword = function(password) {
	return crypto.createHash("sha256").update(password).digest("hex");
};

Authenticator.prototype.createSession = function(userId) {
	var sessionId = crypto.randomBytes(16).toString("hex");
	// Store the session in your database or in-memory store
	this.sqlTiddlerDatabase.createOrUpdateUserSession(userId, sessionId);
	return sessionId;
};

exports.Authenticator = Authenticator;

})();