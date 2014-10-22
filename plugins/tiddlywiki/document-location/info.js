/*\
title: $:/plugins/tiddlywiki/document-location/info.js
type: application/javascript
module-type: info

Initialise $:/info/doc/location tiddlers

# Additional info for the path detection regexp:
#
# It's important, that the match[3] matches the filename without leading or trailing slashes.
# trailing slashes for domain and path are ok.
# match[1] .. filedomain
# match[2] .. filepath
# match[3] .. filename

Tests:

/D:/git/tiddly/tiddlywiki/jermolene.github.com/index.html
/D:/index.html
///b2d.lan/data/index.html
///b2d.lan/index.html
///10.0.0.6/data/index.html
///10.0.0.6/index.html
/
/index.html
/test/index.html
/languages/de-DE/index.html

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.getInfoTiddlerFields = function() {
	var match, 
		filepath = "",
		filedomain = "",
		filename = "",
		pathname, infoTiddlerFields = [], tags = [];
	// Basics
	if($tw.browser) {
		infoTiddlerFields.push({title: "$:/info/doc/location/hash", text: document.location.hash});
		infoTiddlerFields.push({title: "$:/info/doc/location/host", text: document.location.host});
		infoTiddlerFields.push({title: "$:/info/doc/location/hostname", text: document.location.hostname});
		infoTiddlerFields.push({title: "$:/info/doc/location/origin", text: document.location.origin});
		infoTiddlerFields.push({title: "$:/info/doc/location/port", text: document.location.port});
		infoTiddlerFields.push({title: "$:/info/doc/location/protocol", text: document.location.protocol});
		infoTiddlerFields.push({title: "$:/info/doc/location/search", text: document.location.search});
		infoTiddlerFields.push({title: "$:/info/doc/location/href", text: document.location.href});

		pathname = document.location.pathname;
		infoTiddlerFields.push({title: "$:/info/doc/location/pathname", text: pathname, tags: tags});

		match = pathname.match(/^\/?\/?\/?([\-A-Z0-9.]+:?\/)?([\-A-Z0-9\/%._]*\/)?([\-A-Z0-9\/%._]*$)/i);
		if (match !== null) {
			filename = match[3] || "";
			filepath = match[2] || "";
			filedomain = match [1] || "";
			
			// fill the tags with elements. Exclude empty elements with map()
			filepath.split("/").map( function(el){
						if (el) {
							// create a tag for tiddler: $:/info/doc/location/filepath
							tags.push("$:/tags/filepath/" + el);
							// create some tiddlers, that can be used with reveal
							infoTiddlerFields.push({title: "$:/info/doc/location/filepath/is/" + el, text: "yes", tags: ["$:/tags/filepath/"]});
						}
					});
		} else {
			// Match attempt failed
		}
		infoTiddlerFields.push({title: "$:/info/doc/location/filedomain", text: filedomain});
		infoTiddlerFields.push({title: "$:/info/doc/location/filepath", text: filepath, tags: tags});
		infoTiddlerFields.push({title: "$:/info/doc/location/filename", text: filename});
	}
	console.log("fields: ", infoTiddlerFields);
	return infoTiddlerFields;
};

})();
