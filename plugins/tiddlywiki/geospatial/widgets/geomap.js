/*\
title: $:/plugins/tiddlywiki/geospatial/geomap.js
type: application/javascript
module-type: widget

Leaflet map widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var GeomapWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
GeomapWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
GeomapWidget.prototype.render = function(parent,nextSibling) {
	// Housekeeping
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Render a wrapper for the map
	var domNode = this.document.createElement("div");
	domNode.style.width = "100%";
	domNode.style.height = "600px";
	// Insert it into the DOM
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	// Render the map
	if($tw.browser) {
		this.renderMap(domNode);
	}
};

GeomapWidget.prototype.renderMap = function(domNode) {
	var self = this;
	// Get Leaflet
	var L = require("$:/plugins/tiddlywiki/geospatial/leaflet.js");
	// Create and position the map
	const map = L.map(domNode).setView([51.505, -0.09], 13);
	map.fitWorld();
	// Setup the tile layer
	const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);
	// Disable Leaflet attribution
	map.attributionControl.setPrefix("");
	// Create default icon
	const iconProportions = 365/560,
		iconHeight = 50;
	const myIcon = new L.Icon({
		iconUrl: $tw.utils.makeDataUri(this.wiki.getTiddlerText("$:/plugins/tiddlywiki/geospatial/images/markers/pin"),"image/svg+xml"),
		iconSize:     [iconHeight * iconProportions, iconHeight], // Size of the icon
		iconAnchor:   [(iconHeight * iconProportions) / 2, iconHeight], // Position of the anchor within the icon
		popupAnchor:  [0, -iconHeight] // Position of the popup anchor relative to the icon anchor
	});
	// Add scale
	L.control.scale().addTo(map);
	// Track the geolayers filter
	this.trackerGeoLayersFilter = new FilterTracker({
		wiki: this.wiki,
		widget: this,
		filter: this.geomapLayerFilter,
		enter: function(title,tiddler) {
			var text = (tiddler && tiddler.fields.text) || "[]",
				layer = L.geoJSON($tw.utils.parseJSONSafe(text,[]),{
					style: function(geoJsonFeature) {
						return {
							color: (tiddler && tiddler.getFieldString("color")) || "yellow"
						}
					}
				}).addTo(map);
			return layer;
		},
		leave: function(title,tiddler,data) {
			data.remove();
		}
	});
	// Track the geomarkers filter
	this.trackerGeoMarkersFilter = new FilterTracker({
		wiki: this.wiki,
		widget: this,
		filter: this.geomapMarkerFilter,
		enter: function(title,tiddler) {
			var lat = $tw.utils.parseNumber((tiddler && tiddler.fields.lat) || "0"),
				long = $tw.utils.parseNumber((tiddler && tiddler.fields.long) || "0"),
				alt = $tw.utils.parseNumber((tiddler && tiddler.fields.alt) || "0"),
				caption = (tiddler && tiddler.fields.caption) || title,
				icon = myIcon;
			if(tiddler && tiddler.fields["icon-url"]) {
				icon = new L.Icon({
					iconUrl: tiddler && tiddler.fields["icon-url"],
					iconSize:     [32, 32], // Size of the icon
					iconAnchor:   [16, 32], // Position of the anchor within the icon
					popupAnchor:  [16, -32] // Position of the popup anchor relative to the icon anchor
				});
			}
			return L.marker([lat,long,alt],{icon: icon,draggable: false}).bindPopup(caption).addTo(map);
		},
		leave: function(title,tiddler,data) {
			data.remove();
		}
	});
};

/*
Compute the internal state of the widget
*/
GeomapWidget.prototype.execute = function() {
	this.geomapLayerFilter = this.getAttribute("layers");
	this.geomapMarkerFilter = this.getAttribute("markers");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
GeomapWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Refresh entire widget if layers or marker filter changes
	if(changedAttributes.layers || changedAttributes.markers) {
		this.refreshSelf();
		return true;
	}
	// Check whether the layers or markers need updating
	this.trackerGeoLayersFilter.refresh(changedTiddlers);
	this.trackerGeoMarkersFilter.refresh(changedTiddlers);
	// No children to refresh
	return false;	
};

exports.geomap = GeomapWidget;

function FilterTracker(options) {
	var self = this;
	// Save parameters
	this.filter = options.filter;
	this.wiki = options.wiki;
	this.widget = options.widget;
	this.enter = options.enter;
	this.leave = options.leave;
	this.update = options.update;
	// Calculate initial result set and call enter for each entry
	this.items = Object.create(null);
	$tw.utils.each(this.wiki.filterTiddlers(this.filter,this.widget),function(title) {
		self.items[title] = self.enter(title,self.wiki.getTiddler(title));
	});
}

FilterTracker.prototype.refresh = function(changedTiddlers) {
	var self = this;
	var newItems = this.wiki.filterTiddlers(this.filter,this.widget);
	// Go through the new items and call update or enter as appropriate
	$tw.utils.each(newItems,function(title) {
		// Check if this item is already known
		if(title in self.items) {
			// Issue an update if the underlying tiddler has changed
			if(changedTiddlers[title]) {
				// Use the update method if provided
				if(self.update) {
					self.update(title,self.wiki.getTiddler(title),self.items[title]);
				} else {
					// Otherwise leave and enter is equivalent to update
					self.leave(title,self.wiki.getTiddler(title),self.items[title]);
					self.items[title] = self.enter(title,self.wiki.getTiddler(title));
				}
			}
		} else {
			// It's a new item, so we need to enter it
			self.items[title] = self.enter(title,self.wiki.getTiddler(title));
		}
	});
	// Call leave for any items that are no longer in the list
	$tw.utils.each(Object.keys(this.items),function(title) {
		if(newItems.indexOf(title) === -1) {
			// Remove this item
			self.leave(title,self.wiki.getTiddler(title),self.items[title]);
			delete self.items[title];
		}
	});
};

})();

