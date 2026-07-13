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
		this.trackedFilters = new Map(); // Use Map for better key management
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
			title,
			trackFilter: tiddler.fields["track-filter"],
			actions: tiddler.fields.text
		});
		this.trackedFilters.set(id, tracker);
		return id;
	}

	untrackFilter(enterValue) {
		const tracker = this.trackedFilters.get(enterValue);
		if(tracker) {
			tracker.destroy();
		}
		this.trackedFilters.delete(enterValue);
	}

	process(changes) {
		for(const tracker of this.trackedFilters.values()) {
			tracker.process(changes);
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
	constructor({wiki, title, trackFilter, actions}) {
		this.wiki = wiki;
		this.title = title;
		this.trackFilter = trackFilter;
		this.actions = actions;
		this.filterTracker = new $tw.FilterTracker(this.wiki);
		this.hasChanged = false;
		this.trackerID = this.filterTracker.track({
			filterString: this.trackFilter,
			fnEnter: () => { this.hasChanged = true; },
			fnLeave: () => { this.hasChanged = true; },
			fnProcess: (changes) => {
				if(this.hasChanged) {
					this.hasChanged = false;
					console.log("Processing background action", this.title);
					const tiddler = this.wiki.getTiddler(this.title);
					let doActions = true;
					if(tiddler && tiddler.fields.platforms) {
						doActions = false;
						const platforms = $tw.utils.parseStringArray(tiddler.fields.platforms);
						if(($tw.browser && platforms.includes("browser")) || ($tw.node && platforms.includes("node"))) {
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
