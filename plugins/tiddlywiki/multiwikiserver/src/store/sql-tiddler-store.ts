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
"use strict";
import { PrismaClient } from "@prisma/client";
import { AttachmentStore } from "./attachments";
import { SqlTiddlerDatabase } from "./sql-tiddler-database";
import * as path from "path";

type EventListener<T extends any[]> = (...args: T) => void;

interface SqlTiddlerStoreEvents {
	[x: string]: any[];
	change: [];
}


class Eventer<E extends Record<string, any[]>> {
	constructor(public skipDuplicate: boolean) {

	}
	eventListeners: Record<keyof E, EventListener<any[]>[]> = {} as any;
	eventOutstanding: Record<keyof E, boolean> = {} as any;
	addEventListener<K extends keyof E>(
		type: K, listener: EventListener<E[K]>
	): void {
		this.eventListeners[type] = this.eventListeners[type] || [];
		this.eventListeners[type].push(listener);
	}
	removeEventListener<K extends keyof E>(
		type: K, listener: EventListener<E[K]>
	): void {
		const listeners = this.eventListeners[type];
		if (listeners) {
			var p = listeners.indexOf(listener);
			if (p !== -1) {
				listeners.splice(p, 1);
			}
		}
	}
	dispatchEvent<K extends keyof E>(
		type: K, ...args: E[K]
	): void {
		const self = this;
		if (!this.eventOutstanding[type] || !this.skipDuplicate) {
			$tw.utils.nextTick(function () {
				self.eventOutstanding[type] = false;
				const listeners = self.eventListeners[type];
				if (listeners) {
					for (var p = 0; p < listeners.length; p++) {
						var listener = listeners[p];
						listener.apply(listener, args);
					}
				}
			});
			this.eventOutstanding[type] = true;
		}
	}
}

interface EventSource<E extends Record<string, any[]>> {
	addEventListener<K extends keyof E>(type: K, listener: EventListener<E[K]>): void;
	removeEventListener<K extends keyof E>(type: K, listener: EventListener<E[K]>): void;
	dispatchEvent<K extends keyof E>(type: K, ...args: E[K]): void;
}
type TxnType = "DEFERRED" | "IMMEDIATE" | "EXCLUSIVE" | unknown;
type DEFERRED = "DEFERRED" | "IMMEDIATE" | "EXCLUSIVE";
type IMMEDIATE = "IMMEDIATE" | "EXCLUSIVE";
type EXCLUSIVE = "EXCLUSIVE";

/*
Create a tiddler store. Options include:
	
databasePath - path to the database file (can be ":memory:" to get a temporary database)
adminWiki - reference to $tw.Wiki object used for configuration
attachmentStore - reference to associated attachment store
engine - wasm | better
*/
export class SqlTiddlerStore<TXN extends TxnType = unknown> implements EventSource<SqlTiddlerStoreEvents> {
	attachmentStore;
	adminWiki;
	sql: SqlTiddlerDatabase;
	transactionType: TXN = "DEFERRED" as any;

	private eventer = new Eventer<SqlTiddlerStoreEvents>(true);
	addEventListener = this.eventer.addEventListener.bind(this.eventer);
	removeEventListener = this.eventer.removeEventListener.bind(this.eventer);
	dispatchEvent = this.eventer.dispatchEvent.bind(this.eventer);

	constructor(options: {
		// /** path to the database file (can be ":memory:" or missing to get a temporary database) */
		// databasePath?: string;
		/** reference to $tw.Wiki object used for configuration */
		adminWiki?: Wiki;
		/** reference to associated attachment store */
		attachmentStore: AttachmentStore;
		// /** which engine to use, default is "node" */
		// engine?: "node" | "wasm" | "better";
		prisma: PrismaTxnClient;
	} = {} as any) {
		if (!options?.attachmentStore) {
			throw new Error("SqlTiddlerStore requires an attachment store");
		}
		this.attachmentStore = options.attachmentStore;
		this.adminWiki = options.adminWiki || $tw.wiki;
		this.sql = new SqlTiddlerDatabase(options.prisma);

	}


	/*
	Returns null if a bag/recipe name is valid, or a string error message if not
	*/
	validateItemName(name: string, allowPrivilegedCharacters: boolean = false) {
		if (typeof name !== "string") {
			return "Not a valid string";
		}
		if (name.length > 256) {
			return "Too long";
		}
		// Removed ~ from this list temporarily
		if (allowPrivilegedCharacters) {
			if (!(/^[^\s\u00A0\x00-\x1F\x7F`!@#%^&*()+={}\[\];\'\"<>,\\\?]+$/g.test(name))) {
				return "Invalid character(s)";
			}
		} else {
			if (!(/^[^\s\u00A0\x00-\x1F\x7F`!@#$%^&*()+={}\[\];:\'\"<>.,\/\\\?]+$/g.test(name))) {
				return "Invalid character(s)";
			}
		}
		return null;
	}
	/*
	Returns null if the argument is an array of valid bag/recipe names, or a string error message if not
	*/
	validateItemNames(names: string[], allowPrivilegedCharacters?: boolean) {
		if (!$tw.utils.isArray(names)) {
			return "Not a valid array";
		}
		var errors = [];
		for (const name of names) {
			const result = this.validateItemName(name, allowPrivilegedCharacters);
			if (result && errors.indexOf(result) === -1) {
				errors.push(result);
			}
		}
		if (errors.length === 0) {
			return null;
		} else {
			return errors.join("\n");
		}
	}

	/*
	Given tiddler fields, tiddler_id and a bag_name, return the tiddler fields after the following process:
	- Apply the tiddler_id as the revision field
	- Apply the bag_name as the bag field
	*/
	processOutgoingTiddler(tiddlerFields: Record<string, any>, tiddler_id: any, bag_name: any, attachment_blob: any) {
		if (attachment_blob !== null) {
			const bagStr = $tw.utils.encodeURIComponentExtended(bag_name);
			const titleStr = $tw.utils.encodeURIComponentExtended(tiddlerFields.title);
			return $tw.utils.extend(
				{},
				tiddlerFields,
				{
					text: undefined,
					_canonical_uri: `/bags/${bagStr}/tiddlers/${titleStr}/blob`
				}
			);
		} else {
			return tiddlerFields;
		}
	}
	/*
	*/
	processIncomingTiddler(tiddlerFields: Record<string, string>, existing_attachment_blob: string | null, existing_canonical_uri: string | undefined) {
		let attachmentSizeLimit = $tw.utils.parseNumber(this.adminWiki.getTiddlerText("$:/config/MultiWikiServer/AttachmentSizeLimit"));
		if (attachmentSizeLimit < 100 * 1024) {
			attachmentSizeLimit = 100 * 1024;
		}
		const attachmentsEnabled = this.adminWiki.getTiddlerText("$:/config/MultiWikiServer/EnableAttachments", "yes") === "yes";
		const contentTypeInfo = $tw.config.contentTypeInfo[tiddlerFields.type || "text/vnd.tiddlywiki"];
		const isBinary = !!contentTypeInfo && contentTypeInfo.encoding === "base64";

		let shouldProcessAttachment = tiddlerFields.text && tiddlerFields.text.length > attachmentSizeLimit;

		if (existing_attachment_blob) {
			const fileSize = this.attachmentStore.getAttachmentFileSize(existing_attachment_blob);
			if (fileSize && (fileSize <= attachmentSizeLimit)) {
				const existingAttachmentMeta = this.attachmentStore.getAttachmentMetadata(existing_attachment_blob);
				const hasCanonicalField = !!tiddlerFields._canonical_uri;
				const skipAttachment = hasCanonicalField && (tiddlerFields._canonical_uri === (existingAttachmentMeta ? existingAttachmentMeta._canonical_uri : existing_canonical_uri));
				shouldProcessAttachment = !skipAttachment;
			} else {
				shouldProcessAttachment = false;
			}
		}

		if (attachmentsEnabled && isBinary && shouldProcessAttachment) {
			const attachment_blob = existing_attachment_blob || this.attachmentStore.saveAttachment({
				text: tiddlerFields.text,
				type: tiddlerFields.type,
				reference: tiddlerFields.title,
				_canonical_uri: tiddlerFields._canonical_uri
			});

			if (tiddlerFields && tiddlerFields._canonical_uri) {
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
	/**
	 * 
	 * @param this Requires a transaction with at least IMMEDIATE isolation
	 * @param tiddler_files_path `resolve($tw.boot.corePath, $tw.config.editionsPath, tiddler_files_path)`
	 * @param bag_name 
	 */
	async saveTiddlersFromPath(this: SqlTiddlerStore<IMMEDIATE>, tiddler_files_path: string, bag_name: any) {
		// Clear out the bag
		await this.deleteAllTiddlersInBag(bag_name);
		// Get the tiddlers
		var tiddlersFromPath = $tw.loadTiddlersFromPath(path.resolve($tw.boot.corePath, $tw.config.editionsPath, tiddler_files_path));
		// Save the tiddlers
		for (const tiddlersFromFile of tiddlersFromPath) {
			for (const tiddler of tiddlersFromFile.tiddlers) {
				await this.saveBagTiddler(tiddler, bag_name);
			}
		}
		this.dispatchEvent("change");
	}
	async listBags() {
		return await this.sql.listBags();
	}
	/*
	Options include:
  
	allowPrivilegedCharacters - allows "$", ":" and "/" to appear in recipe name
	*/
	async createBag(bag_name: string, description: string, options?: { allowPrivilegedCharacters?: boolean; }) {
		options = options || {};
		var self = this;
		const validationBagName = self.validateItemName(bag_name, options.allowPrivilegedCharacters);
		if (validationBagName) {
			return { message: validationBagName };
		}
		await self.sql.createBag(bag_name, description);
		self.dispatchEvent("change");
		return null;
	}
	async listRecipes() {
		return await this.sql.listRecipes();
	}
	/*
	Returns null on success, or {message:} on error
  
	Options include:
  
	allowPrivilegedCharacters - allows "$", ":" and "/" to appear in recipe name
	*/
	async createRecipe(recipe_name: string, bag_names: string[], description: string, options?: { allowPrivilegedCharacters?: boolean; }) {
		bag_names = bag_names || [];
		description = description || "";
		options = options || {};
		const validationRecipeName = this.validateItemName(recipe_name, options.allowPrivilegedCharacters);
		if (validationRecipeName) {
			return { message: validationRecipeName };
		}
		if (bag_names.length === 0) {
			return { message: "Recipes must contain at least one bag" };
		}

		// return await this.sql.transaction(async function () {
		await this.sql.createRecipe(recipe_name, bag_names, description);
		this.dispatchEvent("change");
		return null;
		// });
	}
	/*
	Returns {tiddler_id:}
	*/
	async saveBagTiddler(incomingTiddlerFields: Record<string, string>, bag_name: string) {
		let _canonical_uri;
		const existing_attachment_blob = await this.sql.getBagTiddlerAttachmentBlob(incomingTiddlerFields.title, bag_name);
		if (existing_attachment_blob) {
			_canonical_uri = `/bags/${$tw.utils.encodeURIComponentExtended(bag_name)}/tiddlers/${$tw.utils.encodeURIComponentExtended(incomingTiddlerFields.title)}/blob`;
		}
		const { tiddlerFields, attachment_blob } = this.processIncomingTiddler(incomingTiddlerFields, existing_attachment_blob, _canonical_uri);
		const result = await this.sql.saveBagTiddler(tiddlerFields, bag_name, attachment_blob);
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
	async saveBagTiddlerWithAttachment(
		this: SqlTiddlerStore<IMMEDIATE>,
		incomingTiddlerFields: Record<string, string>,
		bag_name: string,
		options: {
			filepath: any; type: any; hash: any; _canonical_uri: any;
		}
	) {
		const attachment_blob = this.attachmentStore.adoptAttachment(options.filepath, options.type, options.hash, options._canonical_uri);
		if (attachment_blob) {
			const result = await this.sql.saveBagTiddler(incomingTiddlerFields, bag_name, attachment_blob);
			this.dispatchEvent("change");
			return result;
		} else {
			return null;
		}
	}
	/*
	Returns {tiddler_id:,bag_name:}
	*/
	async saveRecipeTiddler(incomingTiddlerFields: Record<string, string>, recipe_name: string) {
		const existing_attachment_blob = await this.sql.getRecipeTiddlerAttachmentBlob(
			incomingTiddlerFields.title, recipe_name);

		const { tiddlerFields, attachment_blob } = this.processIncomingTiddler(
			incomingTiddlerFields, existing_attachment_blob, incomingTiddlerFields._canonical_uri);

		const result = await this.sql.saveRecipeTiddler(tiddlerFields, recipe_name, attachment_blob);
		this.dispatchEvent("change");
		return result;
	}
	async deleteTiddler(title: string, bag_name: string) {
		const result = await this.sql.deleteTiddler(title, bag_name);
		this.dispatchEvent("change");
		return result;
	}
	/*
	returns {tiddler_id:,tiddler:}
	*/
	async getBagTiddler(title: string, bag_name: string) {
		var tiddlerInfo = await this.sql.getBagTiddler(title, bag_name);
		if (tiddlerInfo) {
			return await Object.assign(
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
	async getBagTiddlerStream(title: string, bag_name: string) {
		const tiddlerInfo = await this.sql.getBagTiddler(title, bag_name);
		if (tiddlerInfo) {
			if (tiddlerInfo.attachment_blob) {
				return $tw.utils.extend(
					{},
					this.attachmentStore.getAttachmentStream(tiddlerInfo.attachment_blob),
					{
						tiddler_id: tiddlerInfo.tiddler_id,
						bag_name: bag_name
					}
				);
			} else {
				const { Readable } = require('stream');
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
	async getRecipeTiddler(title: string, recipe_name: string) {
		var tiddlerInfo = await this.sql.getRecipeTiddler(title, recipe_name);
		if (tiddlerInfo) {
			return Object.assign({}, tiddlerInfo, {
				tiddler: this.processOutgoingTiddler(tiddlerInfo.tiddler, tiddlerInfo.tiddler_id, tiddlerInfo.bag_name, tiddlerInfo.attachment_blob)
			});
		} else {
			return null;
		}
	}
	/*
	Get the titles of the tiddlers in a bag. Returns an empty array for bags that do not exist
	*/
	async getBagTiddlers(bag_name: string) {
		return await this.sql.getBagTiddlers(bag_name);
	}
	/*
	Get the tiddler_id of the newest tiddler in a bag. Returns null for bags that do not exist
	*/
	async getBagLastTiddlerId(bag_name: string) {
		return await this.sql.getBagLastTiddlerId(bag_name);
	}
	/*
	Get the titles of the tiddlers in a recipe as {title:,bag_name:}. Returns null for recipes that do not exist
	*/
	async getRecipeTiddlers(recipe_name: string, options: { limit?: number; last_known_tiddler_id?: number; include_deleted?: boolean; } = {}) {
		return await this.sql.getRecipeTiddlers(recipe_name, options);
	}
	/*
	Get the tiddler_id of the newest tiddler in a recipe. Returns null for recipes that do not exist
	*/
	async getRecipeLastTiddlerId(recipe_name: string) {
		return await this.sql.getRecipeLastTiddlerId(recipe_name);
	}
	async deleteAllTiddlersInBag(bag_name: string) {
		var self = this;
		// return await this.sql.transaction(async function () {
		const result = await self.sql.deleteAllTiddlersInBag(bag_name);
		self.dispatchEvent("change");
		return result;
		// });
	}
	/*
	Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
	*/
	async getRecipeBags(recipe_name: any) {
		return await this.sql.getRecipeBags(recipe_name);
	}
}



