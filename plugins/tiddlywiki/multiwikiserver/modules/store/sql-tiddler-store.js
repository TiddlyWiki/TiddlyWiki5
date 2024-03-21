/*\
title: $:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-store.js
type: application/javascript
module-type: library

Higher level functions to perform basic tiddler operations with a sqlite3 database.

This class is largely a wrapper for the sql-tiddler-database.js class, adding the following functionality:

* Validating requests (eg bag and recipe name constraints)
* Synchronising bag and recipe names to the admin wiki
* Handling large tiddlers as attachments

\*/

(function() {

/*
Create a tiddler store. Options include:

databasePath - path to the database file (can be ":memory:" to get a temporary database)
adminWiki - reference to $tw.Wiki object used for configuration
attachmentStore - reference to associated attachment store
engine - wasm | better
*/
function SqlTiddlerStore(options) {
	options = options || {};
	this.attachmentStore = options.attachmentStore;
	this.adminWiki = options.adminWiki || $tw.wiki;
	// Create the database
	this.databasePath = options.databasePath || ":memory:";
	var SqlTiddlerDatabase = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-database.js").SqlTiddlerDatabase;
	this.sqlTiddlerDatabase = new SqlTiddlerDatabase({
		databasePath: this.databasePath,
		engine: options.engine
	});
	this.sqlTiddlerDatabase.createTables();
}

/*
Returns null if a bag/recipe name is valid, or a string error message if not
*/
SqlTiddlerStore.prototype.validateItemName = function(name) {
	if(typeof name !== "string") {
		return "Not a valid string";
	}
	if(name.length > 256) {
		return "Too long";
	}
	// Removed ~ from this list temporarily
	if(!(/^[^\s\u00A0\x00-\x1F\x7F`!@#$%^&*()+={}\[\];:\'\"<>.,\/\\\?]+$/g.test(name))) {
		return "Invalid character(s)";
	}
	return null;
};

/*
Returns null if the argument is an array of valid bag/recipe names, or a string error message if not
*/
SqlTiddlerStore.prototype.validateItemNames = function(names) {
	if(!$tw.utils.isArray(names)) {
		return "Not a valid array";
	}
	var errors = [];
	for(const name of names) {
		const result = this.validateItemName(name);
		if(result) {
			errors.push(result);
		}
	}
	if(errors.length === 0) {
		return null;
	} else {
		return errors.join("\n");
	}
};

SqlTiddlerStore.prototype.close = function() {
	this.sqlTiddlerDatabase.close();
	this.sqlTiddlerDatabase = undefined;
};

/*
Given tiddler fields, tiddler_id and a bag_name, return the tiddler fields after the following process:
- Apply the tiddler_id as the revision field
- Apply the bag_name as the bag field
*/
SqlTiddlerStore.prototype.processOutgoingTiddler = function(tiddlerFields,tiddler_id,bag_name,attachment_blob) {
	if(attachment_blob !== null) {
		return $tw.utils.extend(
			{},
			tiddlerFields,
			{
				text: undefined,
				_canonical_uri: `/bags/${encodeURIComponent(bag_name)}/tiddlers/${encodeURIComponent(tiddlerFields.title)}/blob`
			}
		);
	} else {
		return tiddlerFields;
	}
};

/*
*/
SqlTiddlerStore.prototype.processIncomingTiddler = function(tiddlerFields) {
	let attachmentSizeLimit = $tw.utils.parseNumber(this.adminWiki.getTiddlerText("$:/config/MultiWikiServer/AttachmentSizeLimit"));
	if(attachmentSizeLimit < 100 * 1024) {
		attachmentSizeLimit = 100 * 1024;
	}
	if(tiddlerFields.text && tiddlerFields.text.length > attachmentSizeLimit) {
		const attachment_blob = this.attachmentStore.saveAttachment({
			text: tiddlerFields.text,
			type: tiddlerFields.type,
			reference: tiddlerFields.title
		});
		return {
			tiddlerFields: Object.assign({},tiddlerFields,{text: undefined}),
			attachment_blob: attachment_blob
		};
	} else {
		return {
			tiddlerFields: tiddlerFields,
			attachment_blob: null
		};
	}
};

SqlTiddlerStore.prototype.saveTiddlersFromPath = function(tiddler_files_path,bag_name) {
	var self = this;
	this.sqlTiddlerDatabase.transaction(function() {
		// Clear out the bag
		self.deleteAllTiddlersInBag(bag_name);
		// Get the tiddlers
		var path = require("path");
		var tiddlersFromPath = $tw.loadTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,tiddler_files_path));
		// Save the tiddlers
		for(const tiddlersFromFile of tiddlersFromPath) {
			for(const tiddler of tiddlersFromFile.tiddlers) {
				self.saveBagTiddler(tiddler,bag_name,null);
			}
		}
	});
};

SqlTiddlerStore.prototype.listBags = function() {
	return this.sqlTiddlerDatabase.listBags();
};

SqlTiddlerStore.prototype.createBag = function(bag_name,description) {
	var self = this;
	return this.sqlTiddlerDatabase.transaction(function() {
		const validationBagName = self.validateItemName(bag_name);
		if(validationBagName) {
			return {message: validationBagName};
		}
		self.sqlTiddlerDatabase.createBag(bag_name,description);
		return null;
	});
};

SqlTiddlerStore.prototype.listRecipes = function() {
	return this.sqlTiddlerDatabase.listRecipes();
};

/*
Returns null on success, or {message:} on error
*/
SqlTiddlerStore.prototype.createRecipe = function(recipe_name,bag_names,description) {
	bag_names = bag_names || [];
	description = description || "";
	const validationRecipeName = this.validateItemName(recipe_name);
	if(validationRecipeName) {
		return {message: validationRecipeName};
	}
	const validationBagNames = this.validateItemNames(bag_names);
	if(validationBagNames) {
		return {message: validationBagNames};
	}
	if(bag_names.length === 0) {
		return {message: "Recipes must contain at least one bag"};
	}
	var self = this;
	return this.sqlTiddlerDatabase.transaction(function() {
		self.sqlTiddlerDatabase.createRecipe(recipe_name,bag_names,description);
		return null;
	});
};

/*
Returns {tiddler_id:}
*/
SqlTiddlerStore.prototype.saveBagTiddler = function(incomingTiddlerFields,bag_name) {
	const {tiddlerFields, attachment_blob} = this.processIncomingTiddler(incomingTiddlerFields);
	return this.sqlTiddlerDatabase.saveBagTiddler(tiddlerFields,bag_name,attachment_blob);
};

/*
Create a tiddler in a bag adopting the specified file as the attachment. The attachment file must be on the same disk as the attachment store
Options include:

filepath - filepath to the attachment file
hash - string hash of the attachment file
type - content type of file as uploaded

Returns {tiddler_id:}
*/
SqlTiddlerStore.prototype.saveBagTiddlerWithAttachment = function(incomingTiddlerFields,bag_name,options) {
	const attachment_blob = this.attachmentStore.adoptAttachment(options.filepath,options.type,options.hash);
	if(attachment_blob) {
		return this.sqlTiddlerDatabase.saveBagTiddler(incomingTiddlerFields,bag_name,attachment_blob);
	} else {
		return null;
	}
};

/*
Returns {tiddler_id:,bag_name:}
*/
SqlTiddlerStore.prototype.saveRecipeTiddler = function(incomingTiddlerFields,recipe_name) {
	const {tiddlerFields, attachment_blob} = this.processIncomingTiddler(incomingTiddlerFields);
	return this.sqlTiddlerDatabase.saveRecipeTiddler(tiddlerFields,recipe_name,attachment_blob);
};

SqlTiddlerStore.prototype.deleteTiddler = function(title,bag_name) {
	return this.sqlTiddlerDatabase.deleteTiddler(title,bag_name);
};

/*
returns {tiddler_id:,tiddler:}
*/
SqlTiddlerStore.prototype.getBagTiddler = function(title,bag_name) {
	var tiddlerInfo = this.sqlTiddlerDatabase.getBagTiddler(title,bag_name);
	if(tiddlerInfo) {
		return Object.assign(
			{},
			tiddlerInfo,
			{
				tiddler: this.processOutgoingTiddler(tiddlerInfo.tiddler,tiddlerInfo.tiddler_id,bag_name,tiddlerInfo.attachment_blob)
			});
	} else {
		return null;
	}
};

/*
Get an attachment ready to stream. Returns null if there is an error or:
tiddler_id: revision of tiddler
stream: stream of file
type: type of file
Returns {tiddler_id:,bag_name:}
*/
SqlTiddlerStore.prototype.getBagTiddlerStream = function(title,bag_name) {
	const tiddlerInfo = this.sqlTiddlerDatabase.getBagTiddler(title,bag_name);
	if(tiddlerInfo) {
		if(tiddlerInfo.attachment_blob) {
			return $tw.utils.extend(
				{},
				this.attachmentStore.getAttachmentStream(tiddlerInfo.attachment_blob),
				{
					tiddler_id: tiddlerInfo.tiddler_id
				}
			);
		} else {
			const { Readable } = require('stream');
			const stream = new Readable();
			stream._read = function() {
				// Push data
				const type = tiddlerInfo.tiddler.type || "text/plain";
				stream.push(tiddlerInfo.tiddler.text || "",($tw.config.contentTypeInfo[type] ||{encoding: "utf8"}).encoding);
				// Push null to indicate the end of the stream
				stream.push(null);
			};
			return {
				tiddler_id: tiddlerInfo.tiddler_id,
				bag_name: bag_name,
				stream: stream,
				type: tiddlerInfo.tiddler.type || "text/plain"
			}
		}
	} else {
		return null;
	}
};

/*
Returns {bag_name:, tiddler: {fields}, tiddler_id:}
*/
SqlTiddlerStore.prototype.getRecipeTiddler = function(title,recipe_name) {
	var tiddlerInfo = this.sqlTiddlerDatabase.getRecipeTiddler(title,recipe_name);
	if(tiddlerInfo) {
		return Object.assign(
			{},
			tiddlerInfo,
			{
				tiddler: this.processOutgoingTiddler(tiddlerInfo.tiddler,tiddlerInfo.tiddler_id,tiddlerInfo.bag_name,tiddlerInfo.attachment_blob)
			});
	} else {
		return null;
	}
};

/*
Get the titles of the tiddlers in a bag. Returns an empty array for bags that do not exist
*/
SqlTiddlerStore.prototype.getBagTiddlers = function(bag_name) {
	return this.sqlTiddlerDatabase.getBagTiddlers(bag_name);
};

/*
Get the titles of the tiddlers in a recipe as {title:,bag_name:}. Returns null for recipes that do not exist
*/
SqlTiddlerStore.prototype.getRecipeTiddlers = function(recipe_name) {
	return this.sqlTiddlerDatabase.getRecipeTiddlers(recipe_name);
};

SqlTiddlerStore.prototype.deleteAllTiddlersInBag = function(bag_name) {
	var self = this;
	return this.sqlTiddlerDatabase.transaction(function() {
		return self.sqlTiddlerDatabase.deleteAllTiddlersInBag(bag_name);
	});
};

/*
Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
*/
SqlTiddlerStore.prototype.getRecipeBags = function(recipe_name) {
	return this.sqlTiddlerDatabase.getRecipeBags(recipe_name);
};

/*
Get most recently Inserted/Replaced tiddlers from a bag - returns object with array of tiddlers
Given bag, tiddler_id returned from a prior call, limit number of tiddlers to return
*/
SqlTiddlerStore.prototype.getBagRecentTiddlers = function(bag_name,last_known_tiddler_id,limit) {
	return this.sqlTiddlerDatabase.getBagRecentTiddlers(bag_name,last_known_tiddler_id,limit);
};

exports.SqlTiddlerStore = SqlTiddlerStore;

})();
