/*\
title: $:/plugins/tiddlywiki/browser-storage/startup.js
type: application/javascript
module-type: startup

Startup initialisation

\*/

"use strict";

// Export name and synchronous status
exports.name = "browser-storage";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

const ENABLED_TITLE = "$:/config/BrowserStorage/Enabled";
const SAVE_FILTER_TITLE = "$:/config/BrowserStorage/SaveFilter";
const PERSISTED_STATE_TITLE = "$:/info/browser/storage/persisted";

const {BrowserStorageUtil} = require("$:/plugins/tiddlywiki/browser-storage/util.js");

exports.startup = function() {
	const self = this;

	// If not exists, add ENABLED tiddler with default value "yes"
	if(!$tw.wiki.getTiddler(ENABLED_TITLE)) {
		$tw.wiki.addTiddler({title: ENABLED_TITLE,text: "yes"});
	}
	// Compute our prefix for local storage keys
	const prefix = `tw5#${window.location.pathname}#`;
	// Make a logger
	const logger = new $tw.utils.Logger("browser-storage",{
		colour: "cyan"
	});
	// Add browserStorage object to $tw
	$tw.browserStorage = new BrowserStorageUtil($tw.wiki,{
		enabledTitle: ENABLED_TITLE,
		prefix,
		logger
	});
	// Function to compile the filter
	let filterFn;
	const compileFilter = function() {
		filterFn = $tw.wiki.compileFilter($tw.wiki.getTiddlerText(SAVE_FILTER_TITLE));
	};
	compileFilter();
	// Listen for tm-clear-browser-storage messages
	$tw.rootWidget.addEventListener("tm-clear-browser-storage",(event) => {
		$tw.wiki.addTiddler({title: ENABLED_TITLE,text: "no"});
		$tw.browserStorage.clearLocalStorage();
	});
	// Seperate clear cookie and disable action
	$tw.rootWidget.addEventListener("tm-delete-browser-storage",(event) => {
		$tw.browserStorage.clearLocalStorage();
	});
	$tw.rootWidget.addEventListener("tm-disable-browser-storage",(event) => {
		$tw.wiki.addTiddler({title: ENABLED_TITLE,text: "no"});
	});
	// Helpers for protecting storage from eviction
	const setPersistedState = function(state) {
		$tw.wiki.addTiddler({title: PERSISTED_STATE_TITLE,text: state});
	};
	const requestPersistence = function() {
		setPersistedState("requested");
		navigator.storage.persist().then((persisted) => {
			console.log(`Request for persisted storage ${persisted ? "granted" : "denied"}`);
			setPersistedState(persisted ? "granted" : "denied");
		});
	};
	let persistPermissionRequested = false;
	const requestPersistenceOnFirstSave = function() {
		$tw.hooks.addHook("th-saving-tiddler",(tiddler) => {
			if(!persistPermissionRequested) {
				const filteredChanges = filterFn.call($tw.wiki,(iterator) => {
					iterator(tiddler,tiddler.getFieldString("title"));
				});
				if(filteredChanges.length > 0) {
					// The tiddler will be saved to local storage, so request persistence
					requestPersistence();
					persistPermissionRequested = true;
				}
			}
			return tiddler;
		});
	};
	// Request the browser to never evict the localstorage. Some browsers such as firefox
	// will prompt the user. To make the decision easier for the user only prompt them
	// when they click the save button on a tiddler which will be stored to localstorage.
	if(navigator.storage && navigator.storage.persist) {
		navigator.storage.persisted().then((isPersisted) => {
			if(!isPersisted) {
				setPersistedState("not requested yet");
				requestPersistenceOnFirstSave();
			} else {
				setPersistedState("granted");
			}
		});
	} else {
		setPersistedState("feature not available");
	}
	// Track tiddler changes
	$tw.wiki.addEventListener("change",(changes) => {
		// Bail if browser storage is disabled
		if($tw.wiki.getTiddlerText(ENABLED_TITLE) === "no") {
			return;
		}
		// Recompile the filter if it has changed
		if(changes[SAVE_FILTER_TITLE]) {
			compileFilter();
		}
		// Filter the changes
		const filteredChanges = filterFn.call($tw.wiki,(iterator) => {
			$tw.utils.each(changes,(change,title) => {
				const tiddler = $tw.wiki.getTiddler(title);
				iterator(tiddler,title);
			});
		});
		$tw.utils.each(filteredChanges,(title) => {
			// Don't try to save changes to our enabled status
			// (If it were enabled in the file but disabled in local storage then we might not realise that distributing a copy of the file would have local storage enabled for other users)
			if(title === ENABLED_TITLE) {
				return;
			}
			// This should always be queried from the browser, so don't store it in local storage
			if(title === PERSISTED_STATE_TITLE) {
				return;
			}
			// Save the tiddler
			$tw.browserStorage.saveTiddlerToLocalStorage(title);
		});
	});
};
