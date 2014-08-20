/*\
title: $:/core/modules/saver-handler.js
type: application/javascript
module-type: global

The saver handler tracks changes to the store and handles saving the entire wiki via saver modules.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Instantiate the saver handler with the following options:
wiki: wiki to be synced
dirtyTracking: true if dirty tracking should be performed
*/
function SaverHandler(options) {
    var self = this;
    this.wiki = options.wiki;
    this.dirtyTracking = options.dirtyTracking;
    // Make a logger
    this.logger = new $tw.utils.Logger("saver-handler");
    // Initialise our savers
    if($tw.browser) {
        this.initSavers();
    }
    // Only do dirty tracking if required
    if(this.dirtyTracking) {
        // Compile the dirty tiddler filter
        this.filterFn = this.wiki.compileFilter(this.wiki.getTiddlerText(this.titleSyncFilter));
        // Count of tiddlers that have been changed but not yet saved
        this.numTasksInQueue = 0;
        // Listen out for changes to tiddlers
        this.wiki.addEventListener("change",function(changes) {
            var filteredChanges = self.filterFn.call(self.wiki,function(callback) {
                $tw.utils.each(changes,function(change,title) {
                    var tiddler = self.wiki.getTiddler(title);
                    callback(tiddler,title);
                });
            });
            self.numTasksInQueue += filteredChanges.length;
            self.updateDirtyStatus();
        });
        // Browser event handlers
        if($tw.browser) {
            // Set up our beforeunload handler
            window.addEventListener("beforeunload",function(event) {
                var confirmationMessage = undefined;
                if(self.isDirty()) {
                    confirmationMessage = $tw.language.getString("UnsavedChangesWarning");
                    event.returnValue = confirmationMessage; // Gecko
                }
                return confirmationMessage;
            });
        }
    }
    // Install the save action handlers
    if($tw.browser) {
        $tw.rootWidget.addEventListener("tw-save-wiki",function(event) {
            self.saveWiki({
                template: event.param,
                downloadType: "text/plain"
            });
        });
        $tw.rootWidget.addEventListener("tw-auto-save-wiki",function(event) {
            self.saveWiki({
                method: "autosave",
                template: event.param,
                downloadType: "text/plain"
            });
        });
        $tw.rootWidget.addEventListener("tw-download-file",function(event) {
            self.saveWiki({
                method: "download",
                template: event.param,
                downloadType: "text/plain"
            });
        });
    }
}

SaverHandler.prototype.titleSyncFilter = "$:/config/SyncFilter";
SaverHandler.prototype.titleAutoSave = "$:/config/AutoSave";
SaverHandler.prototype.titleSavedNotification = "$:/language/Notifications/Save/Done";

/*
Select the appropriate saver modules and set them up
*/
SaverHandler.prototype.initSavers = function(moduleType) {
    moduleType = moduleType || "saver";
    // Instantiate the available savers
    this.savers = [];
    var self = this;
    $tw.modules.forEachModuleOfType(moduleType,function(title,module) {
        if(module.canSave(self)) {
            self.savers.push(module.create(self.wiki));
        }
    });
    // Sort the savers into priority order
    this.savers.sort(function(a,b) {
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
    method: "save" or "download"
    template: the tiddler containing the template to save
    downloadType: the content type for the saved file
*/
SaverHandler.prototype.saveWiki = function(options) {
    options = options || {};
    var self = this,
        method = options.method || "save",
        template = options.template || "$:/core/save/all",
        downloadType = options.downloadType || "text/plain",
        text = this.wiki.renderTiddler(downloadType,template),
        callback = function(err) {
            if(err) {
                alert("Error while saving:\n\n" + err);
            } else {
                $tw.notifier.display(self.titleSavedNotification);
                if(options.callback) {
                    options.callback();
                }
            }
        };
    // Ignore autosave if disabled
    if(method === "autosave" && this.wiki.getTiddlerText(this.titleAutoSave,"yes") !== "yes") {
        return false;
    }
    // Call the highest priority saver that supports this method
    for(var t=this.savers.length-1; t>=0; t--) {
        var saver = this.savers[t];
        if(saver.info.capabilities.indexOf(method) !== -1 && saver.save(text,method,callback)) {
            this.logger.log("Saving wiki with method",method,"through saver",saver.info.name);
            // Clear the task queue if we're saving (rather than downloading)
            if(method !== "download") {
                this.numTasksInQueue = 0;
                this.updateDirtyStatus();
            }
            return true;
        }
    }
    return false;
};

/*
Checks whether the wiki is dirty (ie the window shouldn't be closed)
*/
SaverHandler.prototype.isDirty = function() {
    return this.numTasksInQueue > 0;
};

/*
Update the document body with the class "tw-dirty" if the wiki has unsaved/unsynced changes
*/
SaverHandler.prototype.updateDirtyStatus = function() {
    if($tw.browser) {
        $tw.utils.toggleClass(document.body,"tw-dirty",this.isDirty());
    }
};

exports.SaverHandler = SaverHandler;

})();
