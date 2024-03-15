/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/helpers/multipart-forms.js
type: application/javascript
module-type: library

A function that handles an incoming multipart/form-data stream, streaming the data to temporary files
in the store/inbox folder. Once the data is received, it imports any tiddlers and invokes a callback.

\*/

(function() {

/*
Process an incoming new multipart/form-data stream. Options include:

store - tiddler store
state - provided by server.js
response - provided by server.js
bagname - name of bag to write to
callback - invoked as callback(err,results). Results is an array of titles of imported tiddlers
*/
exports.processIncomingStream = function(options) {
	const self = this;
	const path = require("path"),
		fs = require("fs");
	// Process the incoming data
	const inboxName = $tw.utils.stringifyDate(new Date());
	const inboxPath = path.resolve(options.store.attachmentStore.storePath,"inbox",inboxName);
	$tw.utils.createDirectory(inboxPath);
	let fileStream = null; // Current file being written
	let hash = null; // Accumulating hash of current part
	let length = 0; // Accumulating length of current part
	const parts = []; // Array of {name:, headers:, value:, hash:} and/or {name:, filename:, headers:, inboxFilename:, hash:} 
	options.state.streamMultipartData({
		cbPartStart: function(headers,name,filename) {
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
			length = 0;
			parts.push(part)
		},
		cbPartChunk: function(chunk) {
			if(fileStream) {
				fileStream.write(chunk);
			} else {
				parts[parts.length - 1].value += chunk;
			}
			length = length + chunk.length;
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
				return options.callback(err);
			} else {
				const partFile = parts.find(part => part.name === "file-to-upload" && !!part.filename);
				if(!partFile) {
					return state.sendResponse(400, {"Content-Type": "text/plain"},"Missing file to upload");
				}
				const type = partFile.headers["content-type"];
				const tiddlerFields = {
					title: partFile.filename,
					type: type
				};
				for(const part of parts) {
					const tiddlerFieldPrefix = "tiddler-field-";
					if(part.name.startsWith(tiddlerFieldPrefix)) {
						tiddlerFields[part.name.slice(tiddlerFieldPrefix.length)] = part.value.trim();
					}
				}
				options.store.saveBagTiddlerWithAttachment(tiddlerFields,options.bagname,{
					filepath: partFile.inboxFilename,
					type: type,
					hash: partFile.hash
				});
				$tw.utils.deleteDirectory(inboxPath);
				options.callback(null,[tiddlerFields.title]);
			}
		}
	});
};

})();