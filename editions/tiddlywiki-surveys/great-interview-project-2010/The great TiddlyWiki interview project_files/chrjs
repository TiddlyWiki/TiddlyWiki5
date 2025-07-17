/***
https://raw.github.com/tiddlyweb/chrjs/master/main.js
***/
//{{{
// TiddlyWeb adaptor
// v0.14.3

/*jslint vars: true, unparam: true, nomen: true, white: true */
/*global jQuery */

var tiddlyweb = (function($) {

"use strict";

var tw = {
	routes: {
		// host is the TiddlyWeb instance's URI (including server_prefix)
		// placeholders "_type" & "name" refer to the respective bag/recipe
		root     : "{host}/",
		bags     : "{host}/bags",
		bag      : "{host}/bags/{name}",
		recipes  : "{host}/recipes",
		recipe   : "{host}/recipes/{name}",
		tiddlers : "{host}/{_type}s/{name}/tiddlers",
		tiddler  : "{host}/{_type}s/{name}/tiddlers/{title}",
		revisions: "{host}/{_type}s/{name}/tiddlers/{title}/revisions",
		revision : "{host}/{_type}s/{name}/tiddlers/{title}/revisions/{revision}",
		search   : "{host}/search?q={query}"
	}
};

var convertTimestamp, supplant;

// host (optional) is the URI of the originating TiddlyWeb instance
tw.Resource = function(type, host) {
	if(arguments.length) { // initialization
		this._type = type;
		if(host !== false) {
			this.host = host !== undefined ? host.replace(/\/$/, "") : null;
		}
	}
};
$.extend(tw.Resource.prototype, {
	// retrieves resource from server
	// callback is passed resource, status, XHR (cf. jQuery.ajax success)
	// errback is passed XHR, error, exception, resource (cf. jQuery.ajax error)
	// filters is an optional filter string (e.g. "select=tag:foo;limit=5")
	get: function(callback, errback, filters) {
		var uri = this.route();
		if(filters) {
			var separator = uri.indexOf("?") === -1 ? "?" : ";";
			uri += separator + filters;
		}
		var self = this;
		return $.ajax({
			url: uri,
			type: "GET",
			dataType: "json",
			success: function(data, status, xhr) {
				var resource = self.parse(data);
				resource.etag = xhr.getResponseHeader("Etag");
				callback(resource, status, xhr);
			},
			error: function(xhr, error, exc) {
				errback(xhr, error, exc, self);
			}
		});
	},
	// sends resource to server
	// callback is passed data, status, XHR (cf. jQuery.ajax success)
	// errback is passed XHR, error, exception, resource (cf. jQuery.ajax error)
	put: function(callback, errback) {
		var self = this;
		var options = {
			url: this.route(),
			type: "PUT",
			contentType: "application/json",
			data: JSON.stringify(this.baseData()),
			success: function(data, status, xhr) {
				callback(self, status, xhr);
			},
			error: function(xhr, error, exc) {
				errback(xhr, error, exc, self);
			}
		};
		if(this.ajaxSetup) {
			this.ajaxSetup(options);
		}
		return $.ajax(options);
	},
	// deletes resource on server
	// callback is passed data, status, XHR (cf. jQuery.ajax success)
	// errback is passed XHR, error, exception, resource (cf. jQuery.ajax error)
	"delete": function(callback, errback) {
		var self = this;
		var options = {
			url: this.route(),
			type: "DELETE",
			success: function(data, status, xhr) {
				callback(self, status, xhr);
			},
			error: function(xhr, error, exc) {
				errback(xhr, error, exc, self);
			}
		};
		if(this.ajaxSetup) {
			this.ajaxSetup(options);
		}
		return $.ajax(options);
	},
	// returns an object carrying only the essential information of the resource
	baseData: function() {
		var data = {},
			self = this;
		$.each(this.data, function(i, item) {
			var value = self[item];
			if(value !== undefined) {
				data[item] = value;
			}
		});
		return data;
	},
	// returns corresponding instance from a raw object (if applicable)
	parse: function(data) {
		return data;
	},
	// list of accepted keys in serialization
	data: [],
	// returns resource's URI
	route: function() {
		return supplant(tw.routes[this._type], this);
	}
});

var Container = function(type, name, host) {
	if(arguments.length) { // initialization
		tw.Resource.apply(this, [type, host]);
		this.name = name;
		this.desc = "";
		this.policy = new tw.Policy({});
	}
};
Container.prototype = new tw.Resource();
$.extend(Container.prototype, {
	tiddlers: function() {
		return new tw.TiddlerCollection(this);
	},
	parse: function(data) {
		var type = tw._capitalize(this._type),
			container = new tw[type](this.name, this.host);
		data.policy = new tw.Policy(data.policy);
		return $.extend(container, data);
	},
	data: ["desc", "policy"]
});

// attribs is an object whose members are merged into the instance (e.g. query)
tw.Collection = function(type, host, attribs) {
	if(arguments.length) { // initialization
		tw.Resource.apply(this, [type, host]);
		$.extend(this, attribs);
	}
};
tw.Collection.prototype = new tw.Resource();

tw.TiddlerCollection = function(container, tiddler) {
	if(arguments.length) { // initialization
		tw.Collection.apply(this, [tiddler ? "revisions" : "tiddlers"]);
		this.container = container || null;
		this.tiddler = tiddler || null;
	}
};
tw.TiddlerCollection.prototype = new tw.Collection();
$.extend(tw.TiddlerCollection.prototype, {
	parse: function(data) {
		var container = this.container;
		return $.map(data, function(item, i) {
			var tiddler = new tw.Tiddler(item.title, container),
				bag = item.bag;
			tiddler = tw.Tiddler.prototype.parse.apply(tiddler, [item]);
			if(!tiddler.bag && bag) { // XXX: bag always present!?
				tiddler.bag = new tw.Bag(bag, container.host);
			}
			if(!tiddler.recipe && item.recipe) {
				tiddler.recipe = new tw.Recipe(item.recipe, container.host);
			}
			delete item.recipe;
			return $.extend(tiddler, item);
		});
	},
	route: function() {
		var params = this.container;
		if(this.tiddler) {
			var container = this.tiddler.bag || this.tiddler.recipe;
			params = {
				_type: container._type,
				host: container.host,
				name: container.name,
				title: this.tiddler.title
			};
		}
		return supplant(tw.routes[this._type], params);
	}
});

tw.Search = function(query, host) {
	tw.Collection.apply(this, ["search", host]);
	this.query = query;
};
tw.Search.prototype = new tw.Collection();
$.extend(tw.Search.prototype, {
	parse: function(data) {
		this.container = { // XXX: hacky
			_type: "bag",
			host: this.host
		};
		var tiddlers = tw.TiddlerCollection.prototype.parse.apply(this, arguments);
		delete this.container;
		return tiddlers;
	}
});

// title is the name of the tiddler
// container (optional) is an instance of either Bag or Recipe
// optionally accepts a single object representing tiddler attributes
tw.Tiddler = function(title, container) {
	tw.Resource.apply(this, ["tiddler", false]);
	this.title = title;
	this.bag = container && container._type === "bag" ? container : null;
	this.recipe = container && container._type === "recipe" ? container : null;
	var self = this;
	$.each(this.data, function(i, item) {
		self[item] = undefined; // exposes list of standard attributes for inspectability
	});
	if(title && title.title) { // title is an object of tiddler attributes
		$.extend(this, title);
	}
};
tw.Tiddler.prototype = new tw.Resource();
$.extend(tw.Tiddler.prototype, {
	revisions: function() {
		return new tw.TiddlerCollection(this.bag || this.recipe, this);
	},
	route: function() {
		var container = this.bag || this.recipe;
		var params = $.extend({}, this, {
			host: container ? container.host : null,
			_type: this.bag ? "bag" : (this.recipe ? "recipe" : null),
			name: container ? container.name : null
		});
		return supplant(tw.routes[this._type], params);
	},
	parse: function(data) {
		var tiddler = new tw.Tiddler(this.title),
			container = this.bag || this.recipe;
		if(data.bag) {
			tiddler.bag = new tw.Bag(data.bag, container.host);
			delete data.bag;
		}
		delete data.recipe;
		tiddler.created = data.created ? convertTimestamp(data.created) : new Date();
		delete data.created;
		tiddler.modified = data.modified ? convertTimestamp(data.modified) : new Date();
		delete data.modified;
		if(this.recipe) {
			tiddler.recipe = this.recipe;
		}
		return $.extend(tiddler, data);
	},
	data: ["created", "creator", "modifier", "modified", "tags", "type", "text",
			"fields"],
	ajaxSetup: function(options) {
		var self = this;
		if(this.etag && (options.type === "PUT" || options.type === "DELETE")) {
			options.beforeSend = function(xhr) {
				xhr.setRequestHeader("If-Match", self.etag);
			};
		}
		if(options.type === "PUT") {
			var callback = options.success;
			options.success = function(data, status, xhr) {
				var loc = xhr.getResponseHeader("Location"),
					etag = xhr.getResponseHeader("Etag");
				if(loc && etag) {
					self.etag = etag;
					if(!self.bag) {
						var bag = loc.split("/bags/").pop().split("/")[0];
						self.bag = new tw.Bag(bag, self.recipe.host);
					}
					callback(self, status, xhr);
				} else { // IE
					self.get(callback, options.error);
				}
			};
		}
	}
});

tw.Revision = function(id, tiddler) {
	var container = tiddler.bag || tiddler.recipe;
	tw.Tiddler.apply(this, [tiddler.title, container]);
	this._type = "revision";
	this.revision = id;
};
tw.Revision.prototype = new tw.Tiddler();
$.extend(tw.Revision.prototype, {
	revisions: false,
	data: false,
	put: false,
	"delete": false
});

tw.Bag = function(name, host) {
	Container.apply(this, ["bag", name, host]);
};
tw.Bag.prototype = new Container();

tw.Recipe = function(name, host) {
	Container.apply(this, ["recipe", name, host]);
	this.recipe = [];
};
tw.Recipe.prototype = new Container();
$.extend(tw.Recipe.prototype, {
	data: ["recipe"].concat(Container.prototype.data)
});

tw.Policy = function(constraints) { // TODO: validation?
	var self = this;
	$.each(this.constraints, function(i, item) {
		self[item] = constraints[item];
	});
};
tw.Policy.prototype.constraints = ["read", "write", "create", "delete",
	"manage", "accept", "owner"];

/*
 * utilities
 */

tw._capitalize = function(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

// convert YYYYMMDDhhmmss timestamp to Date instance
convertTimestamp = function(t) {
	if (t.match(/^\d{12,17}$/)) {
		return new Date(Date.UTC(
			parseInt(t.substr(0, 4), 10),
			parseInt(t.substr(4, 2), 10) - 1,
			parseInt(t.substr(6, 2), 10),
			parseInt(t.substr(8, 2), 10),
			parseInt(t.substr(10, 2), 10),
			parseInt(t.substr(12, 2) || "0", 10),
			parseInt(t.substr(14, 3) || "0", 10)
		));
	} else {
		return new Date(Date.parse(t));
	}
};

// adapted from Crockford (http://javascript.crockford.com/remedial.html)
supplant = function(str, obj) {
	return str.replace(/{([^{}]*)}/g, function (a, b) {
		var r = obj[b];
		r = typeof r === "string" || typeof r === "number" ? r : a;
		return $.inArray(b, ["host", "query"]) !== -1 ? r : encodeURIComponent(r); // XXX: special-casing
	});
};

return tw;

}(jQuery));
//}}}