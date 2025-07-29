/*\
title: $:/core/modules/utils/secrets.js
type: application/javascript
module-type: utils

Utility functions for managing encrypted secrets

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Get the current state of the secrets store
Returns: "unencrypted", "locked", or "unlocked"
*/
exports.getSecretsStoreState = function() {
	var vault = $tw.wiki.getTiddler("$:/secrets/vault");
	var hasPassword = $tw.crypto && $tw.crypto.hasPassword();
	
	if (!vault) {
		return "unencrypted"; // No secrets vault exists yet
	} else if (vault && !hasPassword) {
		return "locked"; // Vault exists but no password in memory
	} else {
		return "unlocked"; // Vault exists and password available
	}
};

/*
Check if a secrets vault exists
*/
exports.hasSecretsVault = function() {
	var vault = $tw.wiki.getTiddler("$:/secrets/vault");
	return !!(vault && Object.keys(vault.fields).some(function(field) {
		return field !== "title" && field !== "text" && field !== "tags" && 
			   field !== "modified" && field !== "created" && field !== "modifier" && 
			   field !== "creator" && field !== "type";
	}));
};

/*
Verify if the current password can decrypt secrets
*/
exports.verifySecretsPassword = function(password) {
	var vault = $tw.wiki.getTiddler("$:/secrets/vault");
	if(!vault) return true; // No vault yet, any password is valid
	
	// Check if there's a password verification field
	if(vault.fields["secrets-verification"]) {
		var decrypted = $tw.crypto.decrypt(vault.fields["secrets-verification"], password);
		return decrypted === "VALID_PASSWORD";
	}
	
	// Find a field to test decryption
	var testField = Object.keys(vault.fields).find(function(field) {
		return field !== "title" && field !== "text" && field !== "tags" && 
			   field !== "modified" && field !== "created" && field !== "modifier" && 
			   field !== "creator" && field !== "type" && field !== "bag" && 
			   field !== "revision" && field !== "secrets-verification";
	});
	
	if(testField && vault.fields[testField]) {
		// Try to decrypt with the provided password
		var decrypted = $tw.crypto.decrypt(vault.fields[testField], password);
		return !!decrypted;
	}
	
	return false; // No secrets to test and no verification field - password cannot be verified
};

/*
Encrypt a value using the current password
*/
exports.encryptSecret = function(value, password) {
	if(!value) return null;
	
	// Use provided password or current password
	var pwd = password || ($tw.crypto && $tw.crypto.hasPassword() ? undefined : null);
	if(pwd === null && !$tw.crypto.hasPassword()) {
		return null; // No password available
	}
	
	return $tw.crypto.encrypt(value, pwd);
};

/*
Decrypt a value using the current password
*/
exports.decryptSecret = function(encryptedValue, password) {
	if(!encryptedValue) return null;
	
	// Use provided password or current password
	var pwd = password || ($tw.crypto && $tw.crypto.hasPassword() ? undefined : null);
	if(pwd === null && !$tw.crypto.hasPassword()) {
		return null; // No password available
	}
	
	return $tw.crypto.decrypt(encryptedValue, pwd);
};

/*
Store an encrypted secret
*/
exports.storeSecret = function(name, value) {
	if(!name || !value) return false;
	
	var encrypted = exports.encryptSecret(value);
	if(!encrypted) return false;
	
	// Get or create vault
	var vault = $tw.wiki.getTiddler("$:/secrets/vault") || new $tw.Tiddler({title: "$:/secrets/vault"});
	var fields = {};
	fields[name] = encrypted;
	
	// If this is the first secret (no verification field), add one
	if(!vault.fields["secrets-verification"]) {
		var verificationEncrypted = exports.encryptSecret("VALID_PASSWORD");
		if(verificationEncrypted) {
			fields["secrets-verification"] = verificationEncrypted;
		}
	}
	
	// Add the encrypted field
	$tw.wiki.addTiddler(new $tw.Tiddler(vault, fields));
	
	return true;
};

/*
Retrieve and decrypt a secret
*/
exports.getSecret = function(name) {
	var vault = $tw.wiki.getTiddler("$:/secrets/vault");
	if(!vault || !vault.fields[name]) return null;
	
	return exports.decryptSecret(vault.fields[name]);
};

/*
Delete a secret
*/
exports.deleteSecret = function(name) {
	var vault = $tw.wiki.getTiddler("$:/secrets/vault");
	if(!vault || !vault.fields[name]) return false;
	
	// Create a new tiddler with all fields except the one to delete
	var newFields = {};
	$tw.utils.each(vault.fields, function(value, field) {
		if(field !== name) {
			newFields[field] = value;
		}
	});
	
	// Ensure title is set
	newFields.title = "$:/secrets/vault";
	
	$tw.wiki.addTiddler(new $tw.Tiddler(newFields));
	return true;
};

/*
List all secret names (not values)
*/
exports.listSecrets = function() {
	var vault = $tw.wiki.getTiddler("$:/secrets/vault");
	if(!vault) return [];
	
	return Object.keys(vault.fields).filter(function(field) {
		return field !== "title" && field !== "text" && field !== "tags" && 
			   field !== "modified" && field !== "created" && field !== "modifier" && 
			   field !== "creator" && field !== "type" && field !== "bag" && 
			   field !== "revision" && field !== "secrets-verification";
	}).sort();
};

/*
Change the password for the secrets vault
This re-encrypts all secrets with the new password
*/
exports.changeSecretsPassword = function(oldPassword, newPassword) {
	var vault = $tw.wiki.getTiddler("$:/secrets/vault");
	if(!vault) return {success: false, error: $tw.language.getString("Secrets/NoVaultExists")};
	
	// Verify old password
	if(!exports.verifySecretsPassword(oldPassword)) {
		return {success: false, error: $tw.language.getString("Secrets/VerificationFailed")};
	}
	
	// Get all secret fields
	var secretFields = Object.keys(vault.fields).filter(function(field) {
		return field !== "title" && field !== "text" && field !== "tags" && 
			   field !== "modified" && field !== "created" && field !== "modifier" && 
			   field !== "creator" && field !== "type" && field !== "bag" && 
			   field !== "revision";
	});
	
	// Decrypt all secrets with old password
	var decryptedSecrets = {};
	var failed = false;
	
	secretFields.forEach(function(field) {
		var decrypted = exports.decryptSecret(vault.fields[field], oldPassword);
		if(decrypted === null) {
			failed = true;
		} else {
			decryptedSecrets[field] = decrypted;
		}
	});
	
	if(failed) {
		return {success: false, error: $tw.language.getString("Secrets/DecryptFailed")};
	}
	
	// Set the new password
	$tw.crypto.setPassword(newPassword);
	
	// Re-encrypt all secrets with new password
	var newFields = {
		title: "$:/secrets/vault"
	};
	
	// Add verification field first
	var verificationEncrypted = exports.encryptSecret("VALID_PASSWORD", newPassword);
	if(verificationEncrypted) {
		newFields["secrets-verification"] = verificationEncrypted;
	}
	
	// Re-encrypt each secret
	Object.keys(decryptedSecrets).forEach(function(field) {
		if(field !== "secrets-verification") {
			var encrypted = exports.encryptSecret(decryptedSecrets[field], newPassword);
			if(encrypted) {
				newFields[field] = encrypted;
			}
		}
	});
	
	// Save the re-encrypted vault
	$tw.wiki.addTiddler(new $tw.Tiddler(newFields));
	
	return {success: true};
};
