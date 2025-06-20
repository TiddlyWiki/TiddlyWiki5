/*\
title: $:/core/modules/background-actions.js
type: application/javascript
module-type: global

Class to dispatch actions when filters change

\*/

"use strict";

class BackgroundActionDispatcher {
	constructor(filterTracker, wiki) {
		this.filterTracker = filterTracker;
		this.wiki = wiki;
		this.nextTrackedFilterId = 1;
		this.trackedFilters = Object.create(null); // Hashmap by id
		// Track the filter for the background actions
		this.filterTracker.track({
			filterString: "[all[tiddlers+shadows]tag[$:/tags/BackgroundAction]!is[draft]]",
			fnEnter: (title) => this.trackFilter(title),
			fnLeave: (title, enterValue) => this.untrackFilter(enterValue),
			fnChange: (title, enterValue) => {
				this.untrackFilter(enterValue);
				return this.trackFilter(title);
			},
			fnProcess: (changes) => this.process(changes)
		});
	}

	trackFilter(title) {
		const tiddler = this.wiki.getTiddler(title);
		const id = this.nextTrackedFilterId++;
		const tracker = new BackgroundActionTracker({
			wiki: this.wiki,
			title: title,
			trackFilter: tiddler.fields["track-filter"],
			actions: tiddler.fields.text
		});
		this.trackedFilters[id] = tracker;
		return id;
	}

	untrackFilter(enterValue) {
		const tracker = this.trackedFilters[enterValue];
		if(tracker) {
			tracker.destroy();
		}
		delete this.trackedFilters[enterValue];
	}

	process(changes) {
		for(const id in this.trackedFilters) {
			this.trackedFilters[id].process(changes);
		}
	}
}

/*
Represents an individual tracked filter. Options include:
wiki: wiki to use
title: title of the tiddler being tracked
trackFilter: filter string to track changes
actions: actions to be executed when the filter changes
*/
class BackgroundActionTracker {
	constructor(options) {
		this.wiki = options.wiki;
		this.title = options.title;
		this.trackFilter = options.trackFilter;
		this.actions = options.actions;
		this.filterTracker = new $tw.FilterTracker(this.wiki);
		this.hasChanged = false;
		this.trackerID = this.filterTracker.track({
			filterString: this.trackFilter,
			fnEnter: (title) => { this.hasChanged = true; },
			fnLeave: (title, enterValue) => { this.hasChanged = true; },
			fnProcess: (changes) => {
				if(this.hasChanged) {
					this.hasChanged = false;
					console.log("Processing background action", this.title);
					const tiddler = this.wiki.getTiddler(this.title);
					let doActions = true;
					if(tiddler && tiddler.fields.platforms) {
						doActions = false;
						const platforms = $tw.utils.parseStringArray(tiddler.fields.platforms);
						if(($tw.browser && platforms.indexOf("browser") !== -1) || ($tw.node && platforms.indexOf("node") !== -1)) {
							doActions = true;
						}
					}
					if(doActions) {
						this.wiki.invokeActionString(
							this.actions,
							null,
							{
								currentTiddler: this.title
							},{
								parentWidget: $tw.rootWidget
							}
						);
					}
				}
			}
		});
	}

	process(changes) {
		this.filterTracker.handleChangeEvent(changes);
	}

	destroy() {
		this.filterTracker.untrack(this.trackerID);
	}
}

exports.BackgroundActionDispatcher = BackgroundActionDispatcher;
