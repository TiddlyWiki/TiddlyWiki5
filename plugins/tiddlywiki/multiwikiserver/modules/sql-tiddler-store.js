/*\
title: $:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-store.js
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
adminWiki - reference to $tw.Wiki object into which entity state tiddlers should be saved
attachmentStore - reference to associated attachment store
engine - wasm | better
*/
function SqlTiddlerStore(options) {
	options = options || {};
	this.attachmentStore = options.attachmentStore;
	this.adminWiki = options.adminWiki || $tw.wiki;
	this.entityStateTiddlerPrefix = "$:/state/MultiWikiServer/";
	// Create the database
	this.databasePath = options.databasePath || ":memory:";
	var SqlTiddlerDatabase = require("$:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-database.js").SqlTiddlerDatabase;
	this.sqlTiddlerDatabase = new SqlTiddlerDatabase({
		databasePath: this.databasePath,
		engine: options.engine
	});
	this.sqlTiddlerDatabase.createTables();
	this.updateAdminWiki();
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

SqlTiddlerStore.prototype.saveEntityStateTiddler = function(tiddler) {
	this.adminWiki.addTiddler(new $tw.Tiddler(tiddler,{title: this.entityStateTiddlerPrefix + tiddler.title}));
};

SqlTiddlerStore.prototype.updateAdminWiki = function() {
	var self = this;
	return this.sqlTiddlerDatabase.transaction(function() {
		// Update bags
		for(const bagInfo of self.listBags()) {
			self.saveEntityStateTiddler({
				title: "bags/" + bagInfo.bag_name,
				"bag-name": bagInfo.bag_name,
				text: bagInfo.description
			});
		}
		// Update recipes
		for(const recipeInfo of self.listRecipes()) {
			self.saveEntityStateTiddler({
				title: "recipes/" + recipeInfo.recipe_name,
				"recipe-name": recipeInfo.recipe_name,
				text: recipeInfo.description,
				list: $tw.utils.stringifyList(self.getRecipeBags(recipeInfo.recipe_name).map(bag_name => {
					return self.entityStateTiddlerPrefix + "bags/" + bag_name;
				}))
			});
		}
	});
};

/*
Given tiddler fields, tiddler_id and a bagname, return the tiddler fields after the following process:
- Apply the tiddler_id as the revision field
- Apply the bag_name as the bag field
*/
SqlTiddlerStore.prototype.processOutgoingTiddler = function(tiddlerFields,tiddler_id,bag_name,attachment_blob) {
	const fields = Object.assign({},tiddlerFields,{
		revision: "" + tiddler_id,
		bag: bag_name
	});
	if(attachment_blob !== null) {
		delete fields.text;
		fields._canonical_uri = `/wiki/${encodeURIComponent(bag_name)}/bags/${encodeURIComponent(bag_name)}/tiddlers/${encodeURIComponent(tiddlerFields.title)}/blob`;
	}
	return fields;
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

SqlTiddlerStore.prototype.logTables = function() {
	this.sqlTiddlerDatabase.logTables();
};

SqlTiddlerStore.prototype.listBags = function() {
	return this.sqlTiddlerDatabase.listBags();
};

SqlTiddlerStore.prototype.createBag = function(bagname,description) {
	var self = this;
	return this.sqlTiddlerDatabase.transaction(function() {
		const validationBagName = self.validateItemName(bagname);
		if(validationBagName) {
			return {message: validationBagName};
		}
		self.sqlTiddlerDatabase.createBag(bagname,description);
		self.saveEntityStateTiddler({
			title: "bags/" + bagname,
			"bag-name": bagname,
			text: description
		});
		return null;
	});
};

SqlTiddlerStore.prototype.listRecipes = function() {
	return this.sqlTiddlerDatabase.listRecipes();
};

/*
Returns null on success, or {message:} on error
*/
SqlTiddlerStore.prototype.createRecipe = function(recipename,bagnames,description) {
	bagnames = bagnames || [];
	description = description || "";
	const validationRecipeName = this.validateItemName(recipename);
	if(validationRecipeName) {
		return {message: validationRecipeName};
	}
	const validationBagNames = this.validateItemNames(bagnames);
	if(validationBagNames) {
		return {message: validationBagNames};
	}
	if(bagnames.length === 0) {
		return {message: "Recipes must contain at least one bag"};
	}
	var self = this;
	return this.sqlTiddlerDatabase.transaction(function() {
		self.sqlTiddlerDatabase.createRecipe(recipename,bagnames,description);
		self.saveEntityStateTiddler({
			title: "recipes/" + recipename,
			"recipe-name": recipename,
			text: description,
			list: $tw.utils.stringifyList(bagnames.map(bag_name => {
				return self.entityStateTiddlerPrefix + "bags/" + bag_name;
			}))
		});
		return null;
	});
};

/*
Returns {tiddler_id:}
*/
SqlTiddlerStore.prototype.saveBagTiddler = function(incomingTiddlerFields,bagname) {
	const {tiddlerFields, attachment_blob} = this.processIncomingTiddler(incomingTiddlerFields);
	return this.sqlTiddlerDatabase.saveBagTiddler(tiddlerFields,bagname,attachment_blob);
};

/*
Returns {tiddler_id:,bag_name:}
*/
SqlTiddlerStore.prototype.saveRecipeTiddler = function(incomingTiddlerFields,recipename) {
	const {tiddlerFields, attachment_blob} = this.processIncomingTiddler(incomingTiddlerFields);
	return this.sqlTiddlerDatabase.saveRecipeTiddler(tiddlerFields,recipename,attachment_blob);
};

SqlTiddlerStore.prototype.deleteTiddler = function(title,bagname) {
	this.sqlTiddlerDatabase.deleteTiddler(title,bagname);
};

/*
returns {tiddler_id:,tiddler:}
*/
SqlTiddlerStore.prototype.getBagTiddler = function(title,bagname) {
	var tiddlerInfo = this.sqlTiddlerDatabase.getBagTiddler(title,bagname);
	if(tiddlerInfo) {
		return Object.assign(
			{},
			tiddlerInfo,
			{
				tiddler: this.processOutgoingTiddler(tiddlerInfo.tiddler,tiddlerInfo.tiddler_id,bagname,tiddlerInfo.attachment_blob)
			});	
	} else {
		return null;
	}
};

/*
Get an attachment ready to stream. Returns null if there is an error or:
stream: stream of file
type: type of file
*/
SqlTiddlerStore.prototype.getBagTiddlerStream = function(title,bagname) {
	const tiddlerInfo = this.sqlTiddlerDatabase.getBagTiddler(title,bagname);
	if(tiddlerInfo) {
		if(tiddlerInfo.attachment_blob) {
			return this.attachmentStore.getAttachmentStream(tiddlerInfo.attachment_blob);
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
SqlTiddlerStore.prototype.getRecipeTiddler = function(title,recipename) {
	var tiddlerInfo = this.sqlTiddlerDatabase.getRecipeTiddler(title,recipename);
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
SqlTiddlerStore.prototype.getBagTiddlers = function(bagname) {
	return this.sqlTiddlerDatabase.getBagTiddlers(bagname);
};

/*
Get the titles of the tiddlers in a recipe as {title:,bag_name:}. Returns an empty array for recipes that do not exist
*/
SqlTiddlerStore.prototype.getRecipeTiddlers = function(recipename) {
	return this.sqlTiddlerDatabase.getRecipeTiddlers(recipename);
};

SqlTiddlerStore.prototype.deleteAllTiddlersInBag = function(bagname) {
	var self = this;
	return this.sqlTiddlerDatabase.transaction(function() {
		return self.sqlTiddlerDatabase.deleteAllTiddlersInBag(bagname);
	});
};

/*
Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
*/
SqlTiddlerStore.prototype.getRecipeBags = function(recipename) {
	return this.sqlTiddlerDatabase.getRecipeBags(recipename);
};

exports.SqlTiddlerStore = SqlTiddlerStore;

})();