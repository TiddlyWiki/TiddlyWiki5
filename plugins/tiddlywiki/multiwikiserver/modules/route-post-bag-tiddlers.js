/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-post-bag-tiddlers.js
type: application/javascript
module-type: route

POST /wiki/:bag_name/bags/:bag_name/tiddlers

NOTE: Urls currently include the bag name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/wiki\/([^\/]+)\/bags\/([^\/]+)\/tiddlers$/;

exports.bodyFormat = "stream";

exports.csrfDisable = true;

exports.handler = function(request,response,state) {
	const path = require("path"),
		fs = require("fs");
	// Get the  parameters
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		bag_name_2 = $tw.utils.decodeURIComponentSafe(state.params[1]);
console.log(`Got ${bag_name} and ${bag_name_2}`)
	// Require the recipe names to match
	if(bag_name !== bag_name_2) {
		return state.sendResponse(400,{"Content-Type": "text/plain"},"Bad Request: bag names do not match");
	}
	// Process the incoming data
	const inboxName = $tw.utils.stringifyDate(new Date());
	const inboxPath = path.resolve($tw.mws.store.attachmentStore.storePath,"inbox",inboxName);
	$tw.utils.createDirectory(inboxPath);
	let fileStream = null; // Current file being written
	let hash = null; // Accumulating hash of current part
	const parts = [];
	state.streamMultipartData({
		cbPartStart: function(headers,name,filename) {
			console.log(`Received file ${name} and ${filename} with ${JSON.stringify(headers)}`)
			const part = {
				name: name,
				filename: filename,
				headers: headers
			};
			if(filename) {
				const inboxFilename = (parts.length).toString();
				part.inboxFilename = path.resolve(inboxPath,inboxFilename);
				fileStream = fs.createWriteStream(part.inboxFilename);
			} else {
				part.value = "";
			}
			hash = new $tw.sjcl.hash.sha256();
			parts.push(part)
		},
		cbPartChunk: function(chunk) {
			if(fileStream) {
				fileStream.write(chunk);
			} else {
				parts[parts.length - 1].value += chunk;
			}
			hash.update(chunk);
		},
		cbPartEnd: function() {
			if(fileStream) {
				fileStream.end();
			}
			fileStream = null;
			parts[parts.length - 1].hash = $tw.sjcl.codec.hex.fromBits(hash.finalize()).slice(0,64).toString();
			hash = null;
		},
		cbFinished: function(err) {
			if(err) {
				state.sendResponse(400,{"Content-Type": "text/plain"},"Bad Request: " + err);
			} else {
				console.log(`Multipart form data processed as ${JSON.stringify(parts,null,4)}`);
				const partFile = parts.find(part => part.name === "file-to-upload" && !!part.filename);
				if(!partFile) {
					return state.sendResponse(400, {"Content-Type": "text/plain"},"Missing file to upload");
				}
				const tiddlerFields = {
					title: partFile.filename
				};
				for(const part of parts) {
					const tiddlerFieldPrefix = "tiddler-field-";
					if(part.name.startsWith(tiddlerFieldPrefix)) {
						tiddlerFields[part.name.slice(tiddlerFieldPrefix.length)] = part.value.trim();
					}
				}
				console.log(`Creating tiddler with ${JSON.stringify(tiddlerFields)} and ${partFile.filename}`)
				$tw.mws.store.saveBagTiddlerWithAttachment(tiddlerFields,bag_name,{
					filepath: partFile.inboxFilename,
					type: partFile.headers["content-type"],
					hash: partFile.hash
				});
				$tw.utils.deleteDirectory(inboxPath);
				state.sendResponse(200, {"Content-Type": "text/plain"},`Imported tiddler ${tiddlerFields.title}`);
			}
		}
	});
};

}());
