//--
//-- Filter a list of tiddlers
//--

//# Extensible filter functions
config.filters = {
	tiddler: function(results,match) {
		var title = match[1]||match[4];
		var tiddler = this.fetchTiddler(title);
		if(tiddler) {
			results.pushUnique(tiddler);
		} else if(this.isShadowTiddler(title)) {
			tiddler = new Tiddler();
			tiddler.set(title,this.getTiddlerText(title));
			results.pushUnique(tiddler);
		} else {
			results.pushUnique(new Tiddler(title));
		}
		return results;
	},
	tag: function(results,match) {
		var m,matched = this.getTaggedTiddlers(match[3]);
		for(m=0; m<matched.length; m++) {
			results.pushUnique(matched[m]);
		}
		return results;
	},
	sort: function(results,match) {
		return this.sortTiddlers(results,match[3]);
	},
	limit: function(results,match) {
		return results.slice(0,parseInt(match[3],10));
	},
	field: function(results,match) {
		var m,matched = this.getValueTiddlers(match[2],match[3]);
		for (m = 0; m < matched.length; m++) {
			results.pushUnique(matched[m]);
		}
		return results;
	}
};

// Filter a list of tiddlers
//#   filter - filter expression (eg "tidlertitle [[multi word tiddler title]] [tag[systemConfig]]")
//# Returns an array of Tiddler() objects that match the filter expression
TiddlyWiki.prototype.filterTiddlers = function(filter)
{
	//# text or [[tiddler title]] or [foo[bar]]
	var re = /([^\s\[\]]+)|(?:\[([ \w\.\-]+)\[([^\]]+)\]\])|(?:\[\[([^\]]+)\]\])/mg;

	var results = [];
	if(filter) {
		var match = re.exec(filter);
		while(match) {
			var handler = (match[1]||match[4])?'tiddler':config.filters[match[2]]?match[2]:'field';
			results = config.filters[handler].call(this,results,match);
			match = re.exec(filter);
		}
	}
	return results;
};
