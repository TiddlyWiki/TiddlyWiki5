/*\
title: $:/plugins/tiddlywiki/multiwikiserver/multipart-form-manager.js
type: application/javascript
module-type: library

A class that handles an incoming multipart/form-data stream, streaming the data to temporary files
in the store/inbox folder. It invokes a callback when all the data is available. The callback can explicitly
claim some or all of the files, otherwise they are deleted on return from the callback. Claimed files should
be moved out of the store/inbox folder.

\*/

(function() {

/*
Create an instance of the upload manager. Options include:

inboxPath - path to the inbox folder
store - sqlTiddlerStore to use for saving tiddlers
*/
function MultipartFormManager(options) {
	const path = require("path");
	options = options || {};
	this.inboxPath = options.inboxPath;
	this.store = options.store;
}

/*
Process a new multipart/form-data stream. Options include:

state - provided by server.js
recipe - optional name of recipe to write to (one of recipe or bag must be specified)
bag - optional name of bag to write to (one of recipe or bag must be specified)
callback - invoked as callback(err,results). Results is an array of {title:,bag_name:}

formData is:
{
	parts: [
		{
			name: "fieldname",
			filename: "filename",
			filePath: "/users/home/mywiki/store/inbox/09cabc74-8163-4ead-a35b-4ca768f02d62/64131628-cbff-4677-b146-d85c42c232dc",
			headers: {
				name: "value",
				...
			}
		},
		...
	]
}
*/
MultipartFormManager.prototype.processNewStream = function(options) {
	let fileStream = null;
	let fieldValue = "";
	state.streamMultipartData({
		cbPartStart: function(headers,name,filename) {
			console.log(`Received file ${name} and ${filename} with ${JSON.stringify(headers)}`)
			if(filename) {
				fileStream = fs.createWriteStream(filename);
			} else {
				fieldValue = "";
			}
		},
		cbPartChunk: function(chunk) {
			if(fileStream) {
				fileStream.write(chunk);
			} else {
				fieldValue = fieldValue + chunk;
			}
		},
		cbPartEnd: function() {
			if(fileStream) {
				fileStream.end();
				fileStream = null;
			} else {
				console.log("Data was " + fieldValue);
				fieldValue = "";
			}
		},
		cbFinished: function(err) {
			if(err) {
				state.sendResponse(400,{"Content-Type": "text/plain"},"Bad Request: " + err);
			} else {
				state.sendResponse(200, {"Content-Type": "text/plain"},"Multipart data processed");
			}
		}
	});
}

MultipartFormManager.prototype.close = function() {
};

exports.MultipartFormManager = MultipartFormManager;

})();