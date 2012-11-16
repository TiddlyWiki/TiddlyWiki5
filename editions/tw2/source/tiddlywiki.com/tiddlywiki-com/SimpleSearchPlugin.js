/***
|''Name''|SimpleSearchPlugin|
|''Description''|displays search results as a simple list of matching tiddlers|
|''Authors''|FND|
|''Version''|0.4.1|
|''Status''|stable|
|''Source''|http://devpad.tiddlyspot.com/#SimpleSearchPlugin|
|''CodeRepository''|http://svn.tiddlywiki.org/Trunk/contributors/FND/plugins/SimpleSearchPlugin.js|
|''License''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]]|
|''Keywords''|search|
!Revision History
!!v0.2.0 (2008-08-18)
* initial release
!!v0.3.0 (2008-08-19)
* added Open All button (renders Classic Search option obsolete)
* sorting by relevance (title matches before content matches)
!!v0.4.0 (2008-08-26)
* added tag matching
!To Do
* tag matching optional
* animations for container creation and removal
* when clicking on search results, do not scroll to the respective tiddler (optional)
* use template for search results
!Code
***/
//{{{
if(!version.extensions.SimpleSearchPlugin) { //# ensure that the plugin is only installed once
version.extensions.SimpleSearchPlugin = { installed: true };

if(!config.extensions) { config.extensions = {}; }

config.extensions.SimpleSearchPlugin = {
	heading: "Search Results",
	containerId: "searchResults",
	btnCloseLabel: "close",
	btnCloseTooltip: "dismiss search results",
	btnCloseId: "search_close",
	btnOpenLabel: "Open all",
	btnOpenTooltip: "open all search results",
	btnOpenId: "search_open",

	displayResults: function(matches, query) {
		story.refreshAllTiddlers(true); // update highlighting within story tiddlers
		var el = document.getElementById(this.containerId);
		query = '"""' + query + '"""'; // prevent WikiLinks
		if(el) {
			removeChildren(el);
		} else { //# fallback: use displayArea as parent
			var container = document.getElementById("displayArea");
			el = document.createElement("div");
			el.id = this.containerId;
			el = container.insertBefore(el, container.firstChild);
		}
		var msg = "!" + this.heading + "\n";
		if(matches.length > 0) {
			msg += "''" + config.macros.search.successMsg.format([matches.length.toString(), query]) + ":''\n";
			this.results = [];
			for(var i = 0 ; i < matches.length; i++) {
				this.results.push(matches[i].title);
				msg += "* [[" + matches[i].title + "]]\n";
			}
		} else {
			msg += "''" + config.macros.search.failureMsg.format([query]) + "''"; // XXX: do not use bold here!?
		}
		createTiddlyButton(el, this.btnCloseLabel, this.btnCloseTooltip, config.extensions.SimpleSearchPlugin.closeResults, "button", this.btnCloseId);
		wikify(msg, el);
		if(matches.length > 0) { // XXX: redundant!?
			createTiddlyButton(el, this.btnOpenLabel, this.btnOpenTooltip, config.extensions.SimpleSearchPlugin.openAll, "button", this.btnOpenId);
		}
	},

	closeResults: function() {
		var el = document.getElementById(config.extensions.SimpleSearchPlugin.containerId);
		removeNode(el);
		config.extensions.SimpleSearchPlugin.results = null;
		highlightHack = null;
	},

	openAll: function(ev) {
		story.displayTiddlers(null, config.extensions.SimpleSearchPlugin.results);
		return false;
	}
};

config.shadowTiddlers.StyleSheetSimpleSearch = "/*{{{*/\n" +
	"#" + config.extensions.SimpleSearchPlugin.containerId + " {\n" +
	"\toverflow: auto;\n" +
	"\tpadding: 5px 1em 10px;\n" +
	"\tbackground-color: [[ColorPalette::TertiaryPale]];\n" +
	"}\n\n" +
	"#" + config.extensions.SimpleSearchPlugin.containerId + " h1 {\n" +
	"\tmargin-top: 0;\n" +
	"\tborder: none;\n" +
	"}\n\n" +
	"#" + config.extensions.SimpleSearchPlugin.containerId + " ul {\n" +
	"\tmargin: 0.5em;\n" +
	"\tpadding-left: 1.5em;\n" +
	"}\n\n" +
	"#" + config.extensions.SimpleSearchPlugin.containerId + " .button {\n" +
	"\tdisplay: block;\n" +
	"\tborder-color: [[ColorPalette::TertiaryDark]];\n" +
	"\tpadding: 5px;\n" +
	"\tbackground-color: [[ColorPalette::TertiaryLight]];\n" +
	"}\n\n" +
	"#" + config.extensions.SimpleSearchPlugin.containerId + " .button:hover {\n" +
	"\tborder-color: [[ColorPalette::SecondaryMid]];\n" +
	"\tbackground-color: [[ColorPalette::SecondaryLight]];\n" +
	"}\n\n" +
	"#" + config.extensions.SimpleSearchPlugin.btnCloseId + " {\n" +
	"\tfloat: right;\n" +
	"\tmargin: -5px -1em 5px 5px;\n" +
	"}\n\n" +
	"#" + config.extensions.SimpleSearchPlugin.btnOpenId + " {\n" +
	"\tfloat: left;\n" +
	"\tmargin-top: 5px;\n" +
	"}\n" +
	"/*}}}*/";
store.addNotification("StyleSheetSimpleSearch", refreshStyles);

// override Story.search()
Story.prototype.search = function(text, useCaseSensitive, useRegExp) {
	highlightHack = new RegExp(useRegExp ? text : text.escapeRegExp(), useCaseSensitive ? "mg" : "img");
	var matches = store.search(highlightHack, null, "excludeSearch");
	var q = useRegExp ? "/" : "'";
	config.extensions.SimpleSearchPlugin.displayResults(matches, q + text + q);
};

// override TiddlyWiki.search() to sort by relevance
TiddlyWiki.prototype.search = function(searchRegExp, sortField, excludeTag, match) {
	var candidates = this.reverseLookup("tags", excludeTag, !!match);
	var primary = [];
	var secondary = [];
	var tertiary = [];
	for(var t = 0; t < candidates.length; t++) {
		if(candidates[t].title.search(searchRegExp) != -1) {
			primary.push(candidates[t]);
		} else if(candidates[t].tags.join(" ").search(searchRegExp) != -1) {
			secondary.push(candidates[t]);
		} else if(candidates[t].text.search(searchRegExp) != -1) {
			tertiary.push(candidates[t]);
		}
	}
	var results = primary.concat(secondary).concat(tertiary);
	if(sortField) {
		results.sort(function(a, b) {
			return a[sortField] < b[sortField] ? -1 : (a[sortField] == b[sortField] ? 0 : +1);
		});
	}
	return results;
};

} //# end of "install only once"
//}}}
