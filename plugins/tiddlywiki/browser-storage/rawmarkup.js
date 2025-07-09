/*\
title: $:/plugins/tiddlywiki/browser-storage/rawmarkup.js
type: application/javascript
module-type: library

Startup code injected as raw markup

\*/

// Need to initialise these because we run before bootprefix.js and boot.js
$tw = window.$tw || Object.create(null);
$tw.hooks = $tw.hooks || {names: {}};
$tw.boot = $tw.boot || {};
$tw.boot.preloadDirty = $tw.boot.preloadDirty || [];
// Hook the point in the startup process when the tiddlers have been loaded but plugins not unpacked
const hookName = "th-boot-tiddlers-loaded";
if(Object.prototype.hasOwnProperty.call($tw.hooks.names,hookName)) {
	$tw.hooks.names[hookName].push(hookBootTiddlersLoaded);
} else {
	$tw.hooks.names[hookName] = [hookBootTiddlersLoaded];
}

// Load tiddlers from browser storage
function hookBootTiddlersLoaded() {
	const url = window.location.pathname;
	const keysToDelete = [];
	const log = [];
	// Check that browser storage is available
	try {
		window.localStorage;
	} catch(e) {
		return;
	}
	// Step through each browsder storage item
	for(let index = 0;index < window.localStorage.length;index++) {
		const key = window.localStorage.key(index);
		const parts = key.split("#");
		// If it's ours
		if(parts[0] === "tw5" && parts[1] === url) {
			// Read it as JSON
			const jsonString = window.localStorage.getItem(key);
			var jsonData;
			if(jsonString) {
				try {
					jsonData = JSON.parse(jsonString);
				} catch(e) {}
				if(jsonData) {
					// Convert it to a tiddler
					const incomingTiddler = new $tw.Tiddler(jsonData);
					if(incomingTiddler) {
						// Get any existing tiddler
						var {title} = incomingTiddler.fields;
						var existingTiddler = $tw.wiki.getTiddler(title);
						if(existingTiddler && existingTiddler.isEqual(incomingTiddler)) {
							// If the incoming tiddler is the same as the existing then we can delete the local storage version
							// Defer deletion until after this loop, since deleting will shift the index and cause the
							// index+1 item to be skipped.
							keysToDelete.push(key);
						} else {
							$tw.wiki.addTiddler(incomingTiddler);
							log.push(title);
						}
					}
				}
			} else {
				// Empty value means the tiddler is marked as deleted
				var title = parts.slice(2).join("#");
				var existingTiddler = $tw.wiki.getTiddler(title);
				if(existingTiddler) {
					// The tiddler still exists in the wiki. Delete it so it won't be visible.
					$tw.wiki.deleteTiddler(title);
				} else {
					// The tiddler is already missing from the wiki, so delete the blank local storage entry
					keysToDelete.push(key);
				}
			}
		}
	}
	$tw.utils.each(keysToDelete,(key) => {
		window.localStorage.removeItem(key);
	});
	// Make sure that all the tiddlers we've loaded are marked as dirty at startup
	Array.prototype.push.apply($tw.boot.preloadDirty,log);
	// Save the log
	$tw.wiki.addTiddler({
		title: "$:/temp/BrowserStorage/Log",
		text: $tw.utils.stringifyList(log)
	});
}
