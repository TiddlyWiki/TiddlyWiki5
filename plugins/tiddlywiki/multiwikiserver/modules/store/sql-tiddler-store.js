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

(function () {

	// /*
	// Create a tiddler store. Options include:

	// databasePath - path to the database file (can be ":memory:" to get a temporary database)
	// adminWiki - reference to $tw.Wiki object used for configuration
	// attachmentStore - reference to associated attachment store
	// engine - wasm | better
	// */

	class SqlTiddlerStore {
		/**
		 * @class SqlTiddlerStore
		 * @param {{
		 * 	databasePath?: String,
		 * 	adminWiki?: $TW.Wiki,
		 * 	attachmentStore?: import("./attachments").AttachmentStore,
		 * 	engine?: String
		 * }} options
		 */
		constructor(options) {
			options = options || {};
			this.attachmentStore = options.attachmentStore;
			this.adminWiki = options.adminWiki || $tw.wiki;
			this.eventListeners = {}; // Hashmap by type of array of event listener functions
			this.eventOutstanding = {}; // Hashmap by type of boolean true of outstanding events

			// Create the database
			this.databasePath = options.databasePath || ":memory:";
			var SqlTiddlerDatabase = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-database.js").SqlTiddlerDatabase;
			this.sqlTiddlerDatabase = new SqlTiddlerDatabase({
				databasePath: this.databasePath,
				engine: options.engine
			});
			const error = new Error("syncCheck");
			this.syncCheck = setTimeout(() => {
				console.error(error);
			});
		}


		async initCheck() {
			clearTimeout(this.syncCheck);
			this.syncCheck = undefined;
			await this.sqlTiddlerDatabase.createTables();
		}

		addEventListener(type, listener) {
			this.eventListeners[type] = this.eventListeners[type] || [];
			this.eventListeners[type].push(listener);
		}

		removeEventListener(type, listener) {
			const listeners = this.eventListeners[type];
			if(listeners) {
				var p = listeners.indexOf(listener);
				if(p !== -1) {
					listeners.splice(p, 1);
				}
			}
		}

		dispatchEvent(type /*, args */) {
			const self = this;
			if(!this.eventOutstanding[type]) {
				$tw.utils.nextTick(function () {
					self.eventOutstanding[type] = false;
					const args = Array.prototype.slice.call(arguments, 1), listeners = self.eventListeners[type];
					if(listeners) {
						for(var p = 0; p < listeners.length; p++) {
							var listener = listeners[p];
							listener.apply(listener, args);
						}
					}
				});
				this.eventOutstanding[type] = true;
			}
		}

		/*
		Returns null if a bag/recipe name is valid, or a string error message if not
		*/
		validateItemName(name, allowPrivilegedCharacters) {
			if(typeof name !== "string") {
				return "Not a valid string";
			}
			if(name.length > 256) {
				return "Too long";
			}
			// Removed ~ from this list temporarily
			if(allowPrivilegedCharacters) {
				if(!(/^[^\s\u00A0\x00-\x1F\x7F`!@#%^&*()+={}\[\];\'\"<>,\\\?]+$/g.test(name))) {
					return "Invalid character(s)";
				}
			} else {
				if(!(/^[^\s\u00A0\x00-\x1F\x7F`!@#$%^&*()+={}\[\];:\'\"<>.,\/\\\?]+$/g.test(name))) {
					return "Invalid character(s)";
				}
			}
			return null;
		}

		/*
		Returns null if the argument is an array of valid bag/recipe names, or a string error message if not
		*/
		validateItemNames(names, allowPrivilegedCharacters) {
			if(!$tw.utils.isArray(names)) {
				return "Not a valid array";
			}
			var errors = [];
			for(const name of names) {
				const result = this.validateItemName(name, allowPrivilegedCharacters);
				if(result && errors.indexOf(result) === -1) {
					errors.push(result);
				}
			}
			if(errors.length === 0) {
				return null;
			} else {
				return errors.join("\n");
			}
		}

		async close() {
			await this.sqlTiddlerDatabase.close();
			this.sqlTiddlerDatabase = undefined;
		}

		/*
		Given tiddler fields, tiddler_id and a bag_name, return the tiddler fields after the following process:
		- Apply the tiddler_id as the revision field
		- Apply the bag_name as the bag field
		*/
		processOutgoingTiddler(tiddlerFields, tiddler_id, bag_name, attachment_blob) {
			if(attachment_blob !== null) {
				return $tw.utils.extend(
					{},
					tiddlerFields,
					{
						text: undefined,
						_canonical_uri: `/bags/${$tw.utils.encodeURIComponentExtended(bag_name)}/tiddlers/${$tw.utils.encodeURIComponentExtended(tiddlerFields.title)}/blob`
					}
				);
			} else {
				return tiddlerFields;
			}
		}

		/*
		*/
		processIncomingTiddler(tiddlerFields, existing_attachment_blob, existing_canonical_uri) {
			let attachmentSizeLimit = $tw.utils.parseNumber(this.adminWiki.getTiddlerText("$:/config/MultiWikiServer/AttachmentSizeLimit"));
			if(attachmentSizeLimit < 100 * 1024) {
				attachmentSizeLimit = 100 * 1024;
			}
			const attachmentsEnabled = this.adminWiki.getTiddlerText("$:/config/MultiWikiServer/EnableAttachments", "yes") === "yes";
			const contentTypeInfo = $tw.config.contentTypeInfo[tiddlerFields.type || "text/vnd.tiddlywiki"];
			const isBinary = !!contentTypeInfo && contentTypeInfo.encoding === "base64";

			let shouldProcessAttachment = tiddlerFields.text && tiddlerFields.text.length > attachmentSizeLimit;

			if(existing_attachment_blob) {
				const fileSize = this.attachmentStore.getAttachmentFileSize(existing_attachment_blob);
				if(fileSize <= attachmentSizeLimit) {
					const existingAttachmentMeta = this.attachmentStore.getAttachmentMetadata(existing_attachment_blob);
					const hasCanonicalField = !!tiddlerFields._canonical_uri;
					const skipAttachment = hasCanonicalField && (tiddlerFields._canonical_uri === (existingAttachmentMeta ? existingAttachmentMeta._canonical_uri : existing_canonical_uri));
					shouldProcessAttachment = !skipAttachment;
				} else {
					shouldProcessAttachment = false;
				}
			}

			if(attachmentsEnabled && isBinary && shouldProcessAttachment) {
				const attachment_blob = existing_attachment_blob || this.attachmentStore.saveAttachment({
					text: tiddlerFields.text,
					type: tiddlerFields.type,
					reference: tiddlerFields.title,
					_canonical_uri: tiddlerFields._canonical_uri
				});

				if(tiddlerFields && tiddlerFields._canonical_uri) {
					delete tiddlerFields._canonical_uri;
				}

				return {
					tiddlerFields: Object.assign({}, tiddlerFields, { text: undefined }),
					attachment_blob: attachment_blob
				};
			} else {
				return {
					tiddlerFields: tiddlerFields,
					attachment_blob: existing_attachment_blob
				};
			}
		}

		async saveTiddlersFromPath(tiddler_files_path, bag_name) {
			var self = this;
			await this.sqlTiddlerDatabase.transaction(async function () {
				// Clear out the bag
				await self.deleteAllTiddlersInBag(bag_name);
				// Get the tiddlers
				var path = require("path");
				var tiddlersFromPath = $tw.loadTiddlersFromPath(path.resolve($tw.boot.corePath, $tw.config.editionsPath, tiddler_files_path));
				// Save the tiddlers
				for(const tiddlersFromFile of tiddlersFromPath) {
					for(const tiddler of tiddlersFromFile.tiddlers) {
						await self.saveBagTiddler(tiddler, bag_name);
					}
				}
			});
			self.dispatchEvent("change");
		}

		async listBags() {
			return await this.sqlTiddlerDatabase.listBags();
		}

		/*
		Options include:
	  
		allowPrivilegedCharacters - allows "$", ":" and "/" to appear in recipe name
		*/
		async createBag(bag_name, description, options) {
			options = options || {};
			var self = this;
			return await this.sqlTiddlerDatabase.transaction(async function () {
				const validationBagName = self.validateItemName(bag_name, options.allowPrivilegedCharacters);
				if(validationBagName) {
					return { message: validationBagName };
				}
				await self.sqlTiddlerDatabase.createBag(bag_name, description);
				self.dispatchEvent("change");
				return null;
			});
		}

		async listRecipes() {
			return await this.sqlTiddlerDatabase.listRecipes();
		}

		/*
		Returns null on success, or {message:} on error
	  
		Options include:
	  
		allowPrivilegedCharacters - allows "$", ":" and "/" to appear in recipe name
		*/
		async createRecipe(recipe_name, bag_names, description, options) {
			bag_names = bag_names || [];
			description = description || "";
			options = options || {};
			const validationRecipeName = this.validateItemName(recipe_name, options.allowPrivilegedCharacters);
			if(validationRecipeName) {
				return { message: validationRecipeName };
			}
			if(bag_names.length === 0) {
				return { message: "Recipes must contain at least one bag" };
			}
			var self = this;
			return await this.sqlTiddlerDatabase.transaction(async function () {
				await self.sqlTiddlerDatabase.createRecipe(recipe_name, bag_names, description);
				self.dispatchEvent("change");
				return null;
			});
		}

		/*
		Returns {tiddler_id:}
		*/
		async saveBagTiddler(incomingTiddlerFields, bag_name) {
			let _canonical_uri;
			const existing_attachment_blob = await this.sqlTiddlerDatabase.getBagTiddlerAttachmentBlob(incomingTiddlerFields.title, bag_name);
			if(existing_attachment_blob) {
				_canonical_uri = `/bags/${$tw.utils.encodeURIComponentExtended(bag_name)}/tiddlers/${$tw.utils.encodeURIComponentExtended(incomingTiddlerFields.title)}/blob`;
			}
			const{ tiddlerFields, attachment_blob } = this.processIncomingTiddler(incomingTiddlerFields, existing_attachment_blob, _canonical_uri);
			const result = await this.sqlTiddlerDatabase.saveBagTiddler(tiddlerFields, bag_name, attachment_blob);
			this.dispatchEvent("change");
			return result;
		}

		/*
		Create a tiddler in a bag adopting the specified file as the attachment. The attachment file must be on the same disk as the attachment store
		Options include:
	  
		filepath - filepath to the attachment file
		hash - string hash of the attachment file
		type - content type of file as uploaded
	  
		Returns {tiddler_id:}
		*/
		async saveBagTiddlerWithAttachment(incomingTiddlerFields, bag_name, options) {
			const attachment_blob = this.attachmentStore.adoptAttachment(options.filepath, options.type, options.hash, options._canonical_uri);
			if(attachment_blob) {
				const result = await this.sqlTiddlerDatabase.saveBagTiddler(incomingTiddlerFields, bag_name, attachment_blob);
				this.dispatchEvent("change");
				return result;
			} else {
				return null;
			}
		}

		/*
		Returns {tiddler_id:,bag_name:}
		*/
		async saveRecipeTiddler(incomingTiddlerFields, recipe_name) {
			const existing_attachment_blob = await this.sqlTiddlerDatabase.getRecipeTiddlerAttachmentBlob(incomingTiddlerFields.title, recipe_name);
			const{ tiddlerFields, attachment_blob } = await this.processIncomingTiddler(incomingTiddlerFields, existing_attachment_blob, incomingTiddlerFields._canonical_uri);
			const result = await this.sqlTiddlerDatabase.saveRecipeTiddler(tiddlerFields, recipe_name, attachment_blob);
			this.dispatchEvent("change");
			return result;
		}

		async deleteTiddler(title, bag_name) {
			const result = await this.sqlTiddlerDatabase.deleteTiddler(title, bag_name);
			this.dispatchEvent("change");
			return result;
		}

		/*
		returns {tiddler_id:,tiddler:}
		*/
		async getBagTiddler(title, bag_name) {
			var tiddlerInfo = await this.sqlTiddlerDatabase.getBagTiddler(title, bag_name);
			if(tiddlerInfo) {
				return Object.assign(
					{},
					tiddlerInfo,
					{
						tiddler: this.processOutgoingTiddler(tiddlerInfo.tiddler, tiddlerInfo.tiddler_id, bag_name, tiddlerInfo.attachment_blob)
					});
			} else {
				return null;
			}
		}

		/*
		Get an attachment ready to stream. Returns null if there is an error or:
		tiddler_id: revision of tiddler
		stream: stream of file
		type: type of file
		Returns {tiddler_id:,bag_name:}
		*/
		async getBagTiddlerStream(title, bag_name) {
			const tiddlerInfo = await this.sqlTiddlerDatabase.getBagTiddler(title, bag_name);
			if(tiddlerInfo) {
				if(tiddlerInfo.attachment_blob) {
					return $tw.utils.extend(
						{},
						this.attachmentStore.getAttachmentStream(tiddlerInfo.attachment_blob),
						{
							tiddler_id: tiddlerInfo.tiddler_id,
							bag_name: bag_name
						}
					);
				} else {
					const{ Readable } = require("stream");
					const stream = new Readable();
					stream._read = function () {
						// Push data
						const type = tiddlerInfo.tiddler.type || "text/plain";
						stream.push(tiddlerInfo.tiddler.text || "", ($tw.config.contentTypeInfo[type] || { encoding: "utf8" }).encoding);
						// Push null to indicate the end of the stream
						stream.push(null);
					};
					return {
						tiddler_id: tiddlerInfo.tiddler_id,
						bag_name: bag_name,
						stream: stream,
						type: tiddlerInfo.tiddler.type || "text/plain"
					};
				}
			} else {
				return null;
			}
		}

		/*
		Returns {bag_name:, tiddler: {fields}, tiddler_id:}
		*/
		async getRecipeTiddler(title, recipe_name) {
			var tiddlerInfo = await this.sqlTiddlerDatabase.getRecipeTiddler(title, recipe_name);
			if(tiddlerInfo) {
				return Object.assign(
					{},
					tiddlerInfo,
					{
						tiddler: this.processOutgoingTiddler(tiddlerInfo.tiddler, tiddlerInfo.tiddler_id, tiddlerInfo.bag_name, tiddlerInfo.attachment_blob)
					});
			} else {
				return null;
			}
		}

		/*
		Get the titles of the tiddlers in a bag. Returns an empty array for bags that do not exist
		*/
		async getBagTiddlers(bag_name) {
			return await this.sqlTiddlerDatabase.getBagTiddlers(bag_name);
		}

		/*
		Get the tiddler_id of the newest tiddler in a bag. Returns null for bags that do not exist
		*/
		async getBagLastTiddlerId(bag_name) {
			return await this.sqlTiddlerDatabase.getBagLastTiddlerId(bag_name);
		}

		/*
		Get the titles of the tiddlers in a recipe as {title:,bag_name:}. Returns null for recipes that do not exist
		*/
		async getRecipeTiddlers(recipe_name, options) {
			return await this.sqlTiddlerDatabase.getRecipeTiddlers(recipe_name, options);
		}

		/*
		Get the tiddler_id of the newest tiddler in a recipe. Returns null for recipes that do not exist
		*/
		async getRecipeLastTiddlerId(recipe_name) {
			return await this.sqlTiddlerDatabase.getRecipeLastTiddlerId(recipe_name);
		}

		async deleteAllTiddlersInBag(bag_name) {
			var self = this;
			return await this.sqlTiddlerDatabase.transaction(async function () {
				const result = await self.sqlTiddlerDatabase.deleteAllTiddlersInBag(bag_name);
				self.dispatchEvent("change");
				return result;
			});
		}

		/*
		Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
		*/
		async getRecipeBags(recipe_name) {
			return await this.sqlTiddlerDatabase.getRecipeBags(recipe_name);
		}
	}

	exports.SqlTiddlerStore = SqlTiddlerStore;

})();