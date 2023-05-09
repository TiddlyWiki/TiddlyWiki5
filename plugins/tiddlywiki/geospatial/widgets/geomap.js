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
	// Render the children into a hidden DOM node
	var parser = {
		tree: [{
			type: "widget",
			attributes: {},
			orderedAttributes: [],
			children: this.parseTreeNode.children || []
		}]
	};
	this.contentRoot = this.wiki.makeWidget(parser,{
		document: $tw.fakeDocument,
		parentWidget: this
	});
	this.contentContainer = $tw.fakeDocument.createElement("div");
	this.contentRoot.render(this.contentContainer,null);
	// Render a wrapper for the map
	this.domNode = this.document.createElement("div");
	this.domNode.style.width = "100%";
	this.domNode.style.height = "600px";
	// Insert it into the DOM
	parent.insertBefore(this.domNode,nextSibling);
	this.domNodes.push(this.domNode);
	// Render the map
	if($tw.browser) {
		this.renderMap();
		this.refreshMap();
	}
};

GeomapWidget.prototype.renderMap = function() {
	// Create the map
	this.map = $tw.Leaflet.map(this.domNode);
	// No layers rendered
	this.renderedLayers = [];
	// Setup the tile layer
	const tiles = $tw.Leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(this.map);
	// Disable Leaflet attribution
	this.map.attributionControl.setPrefix("");
	// Add scale
	$tw.Leaflet.control.scale().addTo(this.map);
};

GeomapWidget.prototype.refreshMap = function() {
	var self = this;
	// Remove any previously rendered layers
	$tw.utils.each(this.renderedLayers,function(layer) {
		self.map.removeLayer(layer);
	});
	this.renderedLayers = [];
	// Set the position
	if(!this.setMapView()) {
		// Default to showing the whole world
		this.map.fitWorld();
	}
	// Create default icon
	const iconProportions = 365/560,
		iconHeight = 50;
	const myIcon = new $tw.Leaflet.Icon({
		iconUrl: $tw.utils.makeDataUri(this.wiki.getTiddlerText("$:/plugins/tiddlywiki/geospatial/images/markers/pin"),"image/svg+xml"),
		iconSize:     [iconHeight * iconProportions, iconHeight], // Size of the icon
		iconAnchor:   [(iconHeight * iconProportions) / 2, iconHeight], // Position of the anchor within the icon
		popupAnchor:  [0, -iconHeight] // Position of the popup anchor relative to the icon anchor
	});
	// Listen for pan and zoom events and update the state tiddler
	this.map.on("moveend zoomend",function(event) {
		if(self.geomapStateTitle) {
			var c = self.map.getCenter(),
				lat = "" + c.lat,
				long = "" + c.lng,
				zoom = "" + self.map.getZoom(),
				tiddler = self.wiki.getTiddler(self.geomapStateTitle);
			// Only write the tiddler if the values have changed
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
	// Make a marker cluster
	var markers = $tw.Leaflet.markerClusterGroup({
		maxClusterRadius: 40
	});
	this.map.addLayer(markers);
	// Process embedded geolayer widgets
	this.findChildrenDataWidgets(this.contentRoot.children,"geolayer",function(widget) {
		var jsonText = widget.getAttribute("json"),
			geoJson = [];
		if(jsonText) {
			geoJson = $tw.utils.parseJSONSafe(jsonText,[]);
		} else if(widget.hasAttribute("lat") && widget.hasAttribute("long")) {
			var lat = $tw.utils.parseNumber(widget.getAttribute("lat","0")),
				long = $tw.utils.parseNumber(widget.getAttribute("long","0")),
				alt = $tw.utils.parseNumber(widget.getAttribute("alt","0"));
			geoJson = {
				"type": "FeatureCollection",
				"features": [
					{
						"type": "Feature",
						"geometry": {
							"type": "Point",
							"coordinates": [long,lat,alt]
						}
					}
				]
			};
		}
		var layer = $tw.Leaflet.geoJSON(geoJson,{
				style: function(geoJsonFeature) {
					return {
						color: widget.getAttribute("color","yellow")
					}
				},
				pointToLayer: function(geoJsonPoint,latlng) {
					$tw.Leaflet.marker(latlng,{icon: myIcon,draggable: false}).addTo(markers);
					return markers;
				},
				onEachFeature: function(feature,layer) {
					if(feature.properties) {
						layer.bindPopup(JSON.stringify(feature.properties,null,4));
					}
				}
			}).addTo(self.map);
		self.renderedLayers.push(layer);
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
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
GeomapWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Set zoom and position if the state tiddler has changed
	if(changedAttributes.state) {
		this.geomapStateTitle = this.getAttribute("state");
	}
	if(changedAttributes.state || changedTiddlers[this.geomapStateTitle]) {
		this.setMapView();
	}
	// Refresh child nodes, and rerender map if there have been any changes
	var result = this.contentRoot.refresh(changedTiddlers);
	if(result) {
		this.refreshMap();
	}
	return result;
};

exports.geomap = GeomapWidget;

})();

