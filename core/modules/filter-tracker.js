/*\
title: $:/core/modules/filter-tracker.js
type: application/javascript
module-type: global

Class to track the results of a filter string

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function FilterTracker(wiki) {
	this.wiki = wiki;
	this.trackers = [];
	this.nextTrackerId = 1;
}

FilterTracker.prototype.handleChangeEvent = function(changes) {
	this.processTrackers();
	this.processChanges(changes);
};

/*
Add a tracker to the filter tracker. Returns null if any of the parameters are invalid, or a tracker id if the tracker was added successfully. Options include:
filterString: the filter string to track
fnEnter: function to call when a title enters the filter results. Called even if the tiddler does not actually exist. Called as (title), and should return a truthy value that is stored in the tracker as the "enterValue"
fnLeave: function to call when a title leaves the filter results. Called as (title,enterValue)
fnChange: function to call when a tiddler changes in the filter results. Only called for filter results that identify a tiddler or shadow tiddler. Called as (title,enterValue), and may optionally return a replacement enterValue
fnProcess: function to call each time the tracker is processed, after any enter, leave or change functions are called. Called as (changes)
*/
FilterTracker.prototype.track = function(options) {
	// Add the tracker details
	var tracker = {
		id: this.nextTrackerId++,
		filterString: options.filterString,
		fnEnter: options.fnEnter,
		fnLeave: options.fnLeave,
		fnChange: options.fnChange,
		fnProcess: options.fnProcess,
		previousResults: [], // Results from the previous time the tracker was processed
		resultValues: {} // Map by title to the value returned by fnEnter
	};
	this.trackers.push(tracker);
	// Process the tracker
	this.processTracker(this.trackers.length - 1);
	return tracker.id;
};

FilterTracker.prototype.untrack = function(id) {
	for(var t=0; t<this.trackers.length; t++) {
		if(this.trackers[t].id === id) {
			this.trackers.splice(t,1);
			break;
		}
	}
};

FilterTracker.prototype.processTrackers = function() {
	for(var t=0; t<this.trackers.length; t++) {
		this.processTracker(t);
	}
};

FilterTracker.prototype.processTracker = function(index) {
	var tracker = this.trackers[index];
	var results = [];
	// Evaluate the filter and remove duplicate results
	$tw.utils.each(this.wiki.filterTiddlers(tracker.filterString),function(title) {
		$tw.utils.pushTop(results,title);
	});
	// Process the newly entered results
	$tw.utils.each(results,function(title) {
		if(tracker.previousResults.indexOf(title) === -1 && !tracker.resultValues[title] && tracker.fnEnter) {
			tracker.resultValues[title] = tracker.fnEnter(title) || true;
		}
	});
	// Process the results that have just left
	$tw.utils.each(tracker.previousResults,function(title) {
		if(results.indexOf(title) === -1 && tracker.resultValues[title] && tracker.fnLeave) {
			tracker.fnLeave(title,tracker.resultValues[title]);
			delete tracker.resultValues[title];
		}
	});
	// Update the previous results
	tracker.previousResults = results;
};

FilterTracker.prototype.processChanges = function(changes) {
	for(var t=0; t<this.trackers.length; t++) {
		var tracker = this.trackers[t];
		$tw.utils.each(changes,function(change,title) {
			if(title && tracker.previousResults.indexOf(title) !== -1 && tracker.fnChange) {
				// Call the change function and if it doesn't return a value then keep the old value
				tracker.resultValues[title] = tracker.fnChange(title,tracker.resultValues[title]) || tracker.resultValues[title];
			}
		});
		if(tracker.fnProcess) {
			tracker.fnProcess(changes);
		}
	}
};

exports.FilterTracker = FilterTracker;

})();
