/*\
title: $:/core/modules/saver-handler.js
type: application/javascript
module-type: global

The saver handler tracks changes to the store and handles saving the entire wiki via saver modules.

\*/

"use strict";

/*
Instantiate the saver handler with the following options:
wiki: wiki to be synced
dirtyTracking: true if dirty tracking should be performed
*/
function SaverHandler(options) {
	const self = this;
	this.wiki = options.wiki;
	this.dirtyTracking = options.dirtyTracking;
	this.preloadDirty = options.preloadDirty || [];
	this.pendingAutoSave = false;
	// Make a logger
	this.logger = new $tw.utils.Logger("saver-handler");
	// Initialise our savers
	if($tw.browser) {
		this.initSavers();
	}
	// Only do dirty tracking if required
	if($tw.browser && this.dirtyTracking) {
		// Compile the dirty tiddler filter
		this.filterFn = this.wiki.compileFilter(this.wiki.getTiddlerText(this.titleSyncFilter));
		// Count of changes that have not yet been saved
		const filteredChanges = self.filterFn.call(self.wiki,(iterator) => {
			$tw.utils.each(self.preloadDirty,(title) => {
				const tiddler = self.wiki.getTiddler(title);
				iterator(tiddler,title);
			});
		});
		this.numChanges = filteredChanges.length;
		// Listen out for changes to tiddlers
		this.wiki.addEventListener("change",(changes) => {
			// Filter the changes so that we only count changes to tiddlers that we care about
			const filteredChanges = self.filterFn.call(self.wiki,(iterator) => {
				$tw.utils.each(changes,(change,title) => {
					if(change.normal) {
						const tiddler = self.wiki.getTiddler(title);
						iterator(tiddler,title);
					}
				});
			});
			// Adjust the number of changes
			self.numChanges += filteredChanges.length;
			self.updateDirtyStatus();
			// Do any autosave if one is pending and there's no more change events
			if(self.pendingAutoSave && self.wiki.getSizeOfTiddlerEventQueue() === 0) {
				// Check if we're dirty
				if(self.numChanges > 0) {
					self.saveWiki({
						method: "autosave",
						downloadType: "text/plain"
					});
				}
				self.pendingAutoSave = false;
			}
		});
		// Listen for the autosave event
		$tw.rootWidget.addEventListener("tm-auto-save-wiki",(event) => {
			// Do the autosave unless there are outstanding tiddler change events
			if(self.wiki.getSizeOfTiddlerEventQueue() === 0) {
				// Check if we're dirty
				if(self.numChanges > 0) {
					self.saveWiki({
						method: "autosave",
						downloadType: "text/plain"
					});
				}
			} else {
				// Otherwise put ourselves in the "pending autosave" state and wait for the change event before we do the autosave
				self.pendingAutoSave = true;
			}
		});
		// Set up our beforeunload handler
		$tw.addUnloadTask((event) => {
			let confirmationMessage;
			if(self.isDirty()) {
				confirmationMessage = $tw.language.getString("UnsavedChangesWarning");
				event.returnValue = confirmationMessage; // Gecko
			}
			return confirmationMessage;
		});
	}
	// Install the save action handlers
	if($tw.browser) {
		$tw.rootWidget.addEventListener("tm-save-wiki",(event) => {
			self.saveWiki({
				wiki: event.widget.wiki,
				template: event.param,
				downloadType: "text/plain",
				variables: event.paramObject
			});
		});
		$tw.rootWidget.addEventListener("tm-download-file",(event) => {
			self.saveWiki({
				wiki: event.widget.wiki,
				method: "download",
				template: event.param,
				downloadType: "text/plain",
				variables: event.paramObject
			});
		});
	}
}

SaverHandler.prototype.titleSyncFilter = "$:/config/SaverFilter";
SaverHandler.prototype.titleAutoSave = "$:/config/AutoSave";
SaverHandler.prototype.titleSavedNotification = "$:/language/Notifications/Save/Done";

/*
Select the appropriate saver modules and set them up
*/
SaverHandler.prototype.initSavers = function(moduleType) {
	moduleType = moduleType || "saver";
	// Instantiate the available savers
	this.savers = [];
	const self = this;
	$tw.modules.forEachModuleOfType(moduleType,(title,module) => {
		if(module.canSave(self)) {
			self.savers.push(module.create(self.wiki));
		}
	});
	// Sort the savers into priority order
	this.savers.sort((a,b) => {
		if(a.info.priority < b.info.priority) {
			return -1;
		} else {
			if(a.info.priority > b.info.priority) {
				return +1;
			} else {
				return 0;
			}
		}
	});
};

/*
Save the wiki contents. Options are:
	method: "save", "autosave" or "download"
	template: the tiddler containing the template to save
	downloadType: the content type for the saved file
	wiki: optional wiki, overriding the default wiki specified in the constructor
*/
SaverHandler.prototype.saveWiki = function(options) {
	options = options || {};
	const self = this;
	const wiki = options.wiki || this.wiki;
	const method = options.method || "save";
	// Ignore autosave if disabled
	if(method === "autosave" && ($tw.config.disableAutoSave || wiki.getTiddlerText(this.titleAutoSave,"yes") !== "yes")) {
		return false;
	}
	const variables = options.variables || {};
	const template = (options.template ||
		wiki.getTiddlerText("$:/config/SaveWikiButton/Template","$:/core/save/all")).trim();
	const downloadType = options.downloadType || "text/plain";
	const text = wiki.renderTiddler(downloadType,template,options);
	const callback = function(err) {
		if(err) {
			alert(`${$tw.language.getString("Error/WhileSaving")}:\n\n${err}`);
		} else {
			// Clear the task queue if we're saving (rather than downloading)
			if(method !== "download") {
				self.numChanges = 0;
				self.updateDirtyStatus();
			}
			$tw.notifier.display(self.titleSavedNotification);
			if(options.callback) {
				options.callback();
			}
		}
	};
	// Call the highest priority saver that supports this method
	for(let t = this.savers.length - 1;t >= 0;t--) {
		const saver = this.savers[t];
		if(saver.info.capabilities.includes(method) && saver.save(text,method,callback,{variables: {filename: variables.filename,type: variables.type}})) {
			this.logger.log("Saving wiki with method",method,"through saver",saver.info.name);
			return true;
		}
	}
	return false;
};

/*
Checks whether the wiki is dirty (ie the window shouldn't be closed)
*/
SaverHandler.prototype.isDirty = function() {
	return this.numChanges > 0;
};

/*
Update the document body with the class "tc-dirty" if the wiki has unsaved/unsynced changes
*/
SaverHandler.prototype.updateDirtyStatus = function() {
	const self = this;
	if($tw.browser) {
		$tw.utils.toggleClass(document.body,"tc-dirty",this.isDirty());
		$tw.utils.each($tw.windows,(win) => {
			$tw.utils.toggleClass(win.document.body,"tc-dirty",self.isDirty());
		});
	}
};

exports.SaverHandler = SaverHandler;
