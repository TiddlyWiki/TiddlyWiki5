/*\
title: $:/core/modules/filter-tracker.js
type: application/javascript
module-type: global

Class to track the results of a filter string

\*/

"use strict";

class FilterTracker {
	constructor(wiki) {
		this.wiki = wiki;
		this.trackers = new Map();
		this.nextTrackerId = 1;
	}

	handleChangeEvent(changes) {
		this.processTrackers();
		this.processChanges(changes);
	}

	/*
	Add a tracker to the filter tracker. Returns null if any of the parameters are invalid, or a tracker id if the tracker was added successfully. Options include:
	filterString: the filter string to track
	fnEnter: function to call when a title enters the filter results. Called even if the tiddler does not actually exist. Called as (title), and should return a truthy value that is stored in the tracker as the "enterValue"
	fnLeave: function to call when a title leaves the filter results. Called as (title,enterValue)
	fnChange: function to call when a tiddler changes in the filter results. Only called for filter results that identify a tiddler or shadow tiddler. Called as (title,enterValue), and may optionally return a replacement enterValue
	fnProcess: function to call each time the tracker is processed, after any enter, leave or change functions are called. Called as (changes)
	*/
	track(options = {}) {
		const {
			filterString,
			fnEnter,
			fnLeave,
			fnChange,
			fnProcess
		} = options;
		const id = this.nextTrackerId++;
		const tracker = {
			id,
			filterString,
			fnEnter,
			fnLeave,
			fnChange,
			fnProcess,
			previousResults: [],
			resultValues: {}
		};
		this.trackers.set(id, tracker);
		// Process the tracker
		this.processTracker(id);
		return id;
	}

	untrack(id) {
		this.trackers.delete(id);
	}

	processTrackers() {
		for(const id of this.trackers.keys()) {
			this.processTracker(id);
		}
	}

	processTracker(id) {
		const tracker = this.trackers.get(id);
		if(!tracker) return;
		const results = [];
		// Evaluate the filter and remove duplicate results
		$tw.utils.each(this.wiki.filterTiddlers(tracker.filterString), (title) => {
			$tw.utils.pushTop(results, title);
		});
		// Process the newly entered results
		results.forEach((title) => {
			if(!tracker.previousResults.includes(title) && !tracker.resultValues[title] && tracker.fnEnter) {
				tracker.resultValues[title] = tracker.fnEnter(title) || true;
			}
		});
		// Process the results that have just left
		tracker.previousResults.forEach((title) => {
			if(!results.includes(title) && tracker.resultValues[title] && tracker.fnLeave) {
				tracker.fnLeave(title, tracker.resultValues[title]);
				delete tracker.resultValues[title];
			}
		});
		// Update the previous results
		tracker.previousResults = results;
	}

	processChanges(changes) {
		for(const tracker of this.trackers.values()) {
			Object.keys(changes).forEach((title) => {
				if(title && tracker.previousResults.includes(title) && tracker.fnChange) {
					tracker.resultValues[title] = tracker.fnChange(title, tracker.resultValues[title]) || tracker.resultValues[title];
				}
			});
			if(tracker.fnProcess) {
				tracker.fnProcess(changes);
			}
		}
	}
}

exports.FilterTracker = FilterTracker;
