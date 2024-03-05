/*\
title: $:/plugins/tiddlywiki/multiwikiserver/attachment-store.js
type: application/javascript
module-type: library

Class to handle the attachments in the filing system

The store folder looks like this:

store/
	inbox/ - files that are in the process of being uploaded via a multipart form upload
		202402282125432742-0/
			part000
			part001
			...
		...
	files/ - files that are the text content of large tiddlers
		b7def178-79c4-4d88-b7a4-39763014a58b/
			data.jpg - the extension is provided for convenience when directly inspecting the file system
			meta.json - contains:
				{
					"filename": "data.jpg",
					"type": "video/mp4",
					"uploaded": "2024021821224823"
				}
	database.sql - The database file (managed by sql-tiddler-database.js)

\*/

(function() {

/*
Class to handle an attachment store. Options include:

storePath - path to the store
*/
function AttachmentStore(options) {
	options = options || {};
	this.storePath = options.storePath;
}

/*
Check if an attachment name is valid
*/
AttachmentStore.prototype.isValidAttachmentName = function(attachmentname) {
    const re = new RegExp('^[a-f0-9]{64}$');
	return re.test(attachmentname);
};

/*
Saves an attachment to a file. Options include:

text: text content (may be binary)
type: MIME type of content
reference: reference to use for debugging
*/
AttachmentStore.prototype.saveAttachment = function(options) {
	const path = require("path"),
		fs = require("fs");
	// Compute the content hash for naming the attachment
	const contentHash = $tw.sjcl.codec.hex.fromBits($tw.sjcl.hash.sha256.hash(options.text)).slice(0,64).toString();
	// Choose the best file extension for the attachment given its type
	const contentTypeInfo = $tw.config.contentTypeInfo[options.type] || $tw.config.contentTypeInfo["application/octet-stream"];
	// Creat the attachment directory
	const attachmentPath = path.resolve(this.storePath,"files",contentHash);
	$tw.utils.createDirectory(attachmentPath);
	// Save the data file
	const dataFilename = "data" + contentTypeInfo.extension;
	fs.writeFileSync(path.resolve(attachmentPath,dataFilename),options.text,contentTypeInfo.encoding);
	// Save the meta.json file
	fs.writeFileSync(path.resolve(attachmentPath,"meta.json"),JSON.stringify({
		modified: $tw.utils.stringifyDate(new Date()),
		contentHash: contentHash,
		filename: dataFilename,
		type: options.type
	},null,4));
	return contentHash;
};

/*
Adopts an attachment file into the store
*/
AttachmentStore.prototype.adoptAttachment = function(incomingFilepath,type,hash) {
	const path = require("path"),
		fs = require("fs");
	// Choose the best file extension for the attachment given its type
	const contentTypeInfo = $tw.config.contentTypeInfo[type] || $tw.config.contentTypeInfo["application/octet-stream"];
	// Creat the attachment directory
	const attachmentPath = path.resolve(this.storePath,"files",hash);
	$tw.utils.createDirectory(attachmentPath);
	// Rename the data file
	const dataFilename = "data" + contentTypeInfo.extension,
		dataFilepath = path.resolve(attachmentPath,dataFilename);
	fs.renameSync(incomingFilepath,dataFilepath);
	// Save the meta.json file
	fs.writeFileSync(path.resolve(attachmentPath,"meta.json"),JSON.stringify({
		modified: $tw.utils.stringifyDate(new Date()),
		contentHash: hash,
		filename: dataFilename,
		type: type
	},null,4));
	return hash;
};

/*
Get an attachment ready to stream. Returns null if there is an error or:
stream: filestream of file
type: type of file
*/
AttachmentStore.prototype.getAttachmentStream = function(attachmentname) {
	const path = require("path"),
		fs = require("fs");
	// Check the attachment name
	if(this.isValidAttachmentName(attachmentname)) {
		// Construct the path to the attachment directory
		const attachmentPath = path.resolve(this.storePath,"files",attachmentname);
		// Read the meta.json file
		const metaJsonPath = path.resolve(attachmentPath,"meta.json");
		if(fs.existsSync(metaJsonPath) && fs.statSync(metaJsonPath).isFile()) {
			const meta = $tw.utils.parseJSONSafe(fs.readFileSync(metaJsonPath,"utf8"),function() {return null;});
			if(meta) {
				const dataFilepath = path.resolve(attachmentPath,meta.filename);
				// Check if the data file exists
				if(fs.existsSync(dataFilepath) && fs.statSync(dataFilepath).isFile()) {
					// Stream the file
					return {
						stream: fs.createReadStream(dataFilepath),
						type: meta.type
					};
				}
			}
		}
	}
	// An error occured
	return null;
};

exports.AttachmentStore = AttachmentStore;

})();