/*\
title: $:/core/modules/background-actions.js
type: application/javascript
module-type: global

Class to dispatch actions when filters change

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function BackgroundActionDispatcher(filterTracker,wiki) {
	var self = this;
	this.filterTracker = filterTracker;
	this.wiki = wiki;
	this.nextTrackedFilterId = 1;
	this.trackedFilters = Object.create(null); // Hashmap by id
	// Track the filter for the background actions
	this.filterTracker.track({
		filterString: "[all[tiddlers+shadows]tag[$:/tags/BackgroundAction]!is[draft]]",
		fnEnter: function fnEnter(title) {
			return self.trackFilter(title);
		},
		fnLeave: function fnLeave(title,enterValue) {
			self.untrackFilter(enterValue);
		},
		fnChange: function fnChange(title,enterValue) {
			self.untrackFilter(enterValue);
			return self.trackFilter(title);
		},
		fnProcess: function fnProcess(changes) {
			self.process(changes);
		}
	});
}

BackgroundActionDispatcher.prototype.trackFilter = function(title) {
	var tiddler = this.wiki.getTiddler(title),
		id = this.nextTrackedFilterId++,
		tracker = new BackgroundActionTracker({
			wiki: this.wiki,
			title: title,
			trackFilter: tiddler.fields["track-filter"],
			actions: tiddler.fields.text
		});
	this.trackedFilters[id] = tracker;
	return id;
};

BackgroundActionDispatcher.prototype.untrackFilter = function(enterValue) {
	var tracker = this.trackedFilters[enterValue];
	if(tracker) {
		tracker.destroy();
	}
	delete this.trackedFilters[enterValue];
};

BackgroundActionDispatcher.prototype.process = function(changes) {
	for(var id in this.trackedFilters) {
		this.trackedFilters[id].process(changes);
	}
};

/*
Represents an individual tracked filter. Options include:
wiki: wiki to use
title: title of the tiddler being tracked
trackFilter: filter string to track changes
actions: actions to be executed when the filter changes
*/
function BackgroundActionTracker(options) {
	var self = this;
	this.wiki = options.wiki;
	this.title = options.title;
	this.trackFilter = options.trackFilter;
	this.actions = options.actions
	this.filterTracker = new $tw.FilterTracker(this.wiki);
	this.hasChanged = false;
	this.trackerID = this.filterTracker.track({
		filterString: this.trackFilter,
		fnEnter: function(title) {
			self.hasChanged = true;
		},
		fnLeave: function(title,enterValue) {
			self.hasChanged = true;
		},
		fnProcess: function(changes) {
			if(self.hasChanged) {
				self.hasChanged = false;
				console.log("Processing background action",self.title);
				var tiddler = self.wiki.getTiddler(self.title),
					doActions = true;
				if(tiddler && tiddler.fields.platforms) {
					doActions = false;
					var platforms = $tw.utils.parseStringArray(tiddler.fields.platforms);
					if(($tw.browser && platforms.indexOf("browser") !== -1) || ($tw.node && platforms.indexOf("node") !== -1)) {
						doActions = true;
					}
				}
				if(doActions) {
					self.wiki.invokeActionString(
						self.actions,
						null,
						{
							title: self.title
						},{
							parentWidget: $tw.rootWidget
						}
					);
				}
			}
		}
	});
}

BackgroundActionTracker.prototype.process = function(changes) {
	this.filterTracker.handleChangeEvent(changes);
};

BackgroundActionTracker.prototype.destroy = function() {
	this.filterTracker.untrack(this.trackerID);
};

exports.BackgroundActionDispatcher = BackgroundActionDispatcher;

})();
