/*\
title: $:/plugins/tiddlywiki/dom-to-image/startup.js
type: application/javascript
module-type: startup

dom-to-image initialisation

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	// Export name and synchronous status
	exports.name = "dom-to-image";
	exports.after = ["rootwidget"];
	exports.before = ["render"];
	exports.synchronous = true;

	exports.startup = function() {
		var getPropertiesWithPrefix = function(properties,prefix) {
			var result = Object.create(null);
			$tw.utils.each(properties,function(value,name) {
				if(name.indexOf(prefix) === 0) {
					result[name.substring(prefix.length)] = properties[name];
				}
			});
			return result;
		};
		$tw.rootWidget.addEventListener("tm-save-dom-to-image",function(event) {
			var self=this,
				params = event.paramObject || {},
				domToImage = require("$:/plugins/tiddlywiki/dom-to-image/dom-to-image-more.js"),
				domNode = document.querySelector(params.selector || "body.tc-body"),
				oncompletion = params.oncompletion,
				variables = getPropertiesWithPrefix(params,"var-");
			if(domNode) {
				var method = "toPng";
				switch(params.format) {
					case "jpeg":
					// Intentional fallthrough
					case "jpg":
						method = "toJpeg";
						break;
					case "svg":
						method = "toSvg";
						break;
				}
				domToImage[method](domNode,{
					height: $tw.utils.parseInt(params.height) || domNode.offsetHeight,
					width: $tw.utils.parseInt(params.width) || domNode.offsetWidth,
					quality: $tw.utils.parseNumber(params.quality),
					scale: $tw.utils.parseNumber(params.scale) || 1
				})
					.then(function(dataUrl) {
						// Save the image
						if(params["save-file"]) {
							var link = document.createElement("a");
							link.download = params["save-file"];
							link.href = dataUrl;
							link.click();
						}
						// Save the tiddler
						if(params["save-title"]) {
							if(dataUrl.indexOf("data:image/svg+xml;") === 0) {
								var commaIndex = dataUrl.indexOf(",");
								$tw.wiki.addTiddler(new $tw.Tiddler({
									title: params["save-title"],
									type: "image/svg+xml",
									"text": decodeURIComponent(dataUrl.substring(commaIndex + 1))
								}));	
							} else {
								var parts = dataUrl.split(";base64,");
								$tw.wiki.addTiddler(new $tw.Tiddler({
									title: params["save-title"],
									type: parts[0].split(":")[1],
									"text": parts[1]
								}));	
							}
						}
						self.wiki.invokeActionString(oncompletion,self,variables,{parentWidget: $tw.rootWidget});
					})
					.catch(function(error) {
						console.error("oops, something went wrong!", error);
					});
			}
		});
	};

})();
	