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
	// Create the map
	this.map = $tw.Leaflet.map(domNode);
	// Set the position
	if(!this.setMapView()) {
		// Default to showing the whole world
		this.map.fitWorld();
	}
	// Setup the tile layer
	const tiles = $tw.Leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(this.map);
	// Disable Leaflet attribution
	this.map.attributionControl.setPrefix("");
	// Create default icon
	const iconProportions = 365/560,
		iconHeight = 50;
	const myIcon = new $tw.Leaflet.Icon({
		iconUrl: $tw.utils.makeDataUri(this.wiki.getTiddlerText("$:/plugins/tiddlywiki/geospatial/images/markers/pin"),"image/svg+xml"),
		iconSize:     [iconHeight * iconProportions, iconHeight], // Size of the icon
		iconAnchor:   [(iconHeight * iconProportions) / 2, iconHeight], // Position of the anchor within the icon
		popupAnchor:  [0, -iconHeight] // Position of the popup anchor relative to the icon anchor
	});
	// Add scale
	$tw.Leaflet.control.scale().addTo(this.map);
	// Listen for pan and zoom events
	this.map.on("moveend zoomend",function(event) {
		if(self.geomapStateTitle) {
			var c = self.map.getCenter(),
				lat = "" + c.lat,
				long = "" + c.lng,
				zoom = "" + self.map.getZoom(),
				tiddler = self.wiki.getTiddler(self.geomapStateTitle);
			if(!tiddler || tiddler.fields.lat !== lat || tiddler.fields.long !== long || tiddler.fields.zoom !== zoom) {
				self.wiki.addTiddler(new $tw.Tiddler({
					title: self.geomapStateTitle,
					lat: lat,
					long: long,
					zoom: zoom
				}));
			}
		}
	});
	// Track the geolayers filter
	this.trackerGeoLayersFilter = new FilterTracker({
		wiki: this.wiki,
		widget: this,
		filter: this.geomapLayerFilter,
		enter: function(title,tiddler) {
			var text = (tiddler && tiddler.fields.text) || "[]",
				layer = $tw.Leaflet.geoJSON($tw.utils.parseJSONSafe(text,[]),{
					style: function(geoJsonFeature) {
						return {
							color: (tiddler && tiddler.getFieldString("color")) || "yellow"
						}
					},
					onEachFeature: function(feature,layer) {
						if(feature.properties) {
							layer.bindPopup(JSON.stringify(feature.properties,null,4));
						}
					}
				}).addTo(self.map);
			return layer;
		},
		leave: function(title,tiddler,data) {
			data.remove();
		}
	});
	// Track the geomarkers filter
	var markers = $tw.Leaflet.markerClusterGroup({
		maxClusterRadius: 40
	});
	this.map.addLayer(markers);
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
				icon = new $tw.Leaflet.Icon({
					iconUrl: tiddler && tiddler.fields["icon-url"],
					iconSize:     [32, 32], // Size of the icon
					iconAnchor:   [16, 32], // Position of the anchor within the icon
					popupAnchor:  [16, -32] // Position of the popup anchor relative to the icon anchor
				});
			}
			return $tw.Leaflet.marker([lat,long,alt],{icon: icon,draggable: false}).bindPopup(caption).addTo(markers);
		},
		leave: function(title,tiddler,data) {
			data.remove();
		}
	});
};

/*
Set the map center and zoom level from the values in the state tiddler. Returns true if the map view was successfully set
*/
GeomapWidget.prototype.setMapView = function() {
	var stateTiddler = this.geomapStateTitle && this.wiki.getTiddler(this.geomapStateTitle);
	if(stateTiddler) {
		this.map.setView([$tw.utils.parseNumber(stateTiddler.fields.lat,0),$tw.utils.parseNumber(stateTiddler.fields.long,0)], $tw.utils.parseNumber(stateTiddler.fields.zoom,0));
		return true;
	}
	return false;
};

/*
Compute the internal state of the widget
*/
GeomapWidget.prototype.execute = function() {
	this.geomapStateTitle = this.getAttribute("state");
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
	// Set zoom and position if the state tiddler has changed
	if(changedAttributes.state) {
		this.geomapStateTitle = this.getAttribute("state");
	}
	if(changedAttributes.state || changedTiddlers[this.geomapStateTitle]) {
		this.setMapView();
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

