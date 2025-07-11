/*\
title: $:/plugins/tiddlywiki/jszip/startup.js
type: application/javascript
module-type: startup

Setup the root widget event handlers

\*/

"use strict";

const JSZip = require("$:/plugins/tiddlywiki/jszip/jszip.js");

// Export name and synchronous status
exports.name = "jszip";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Install the root widget event handlers
exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-zip-create",(event) => {
		if(event.param) {
			const zip = new JSZip();
			saveZipTiddler(event.param,zip);
		}
	});
	$tw.rootWidget.addEventListener("tm-zip-add-text-file",(event) => {
		const paramObject = event.paramObject || {};
		if(event.param && paramObject.filename && paramObject.text) {
			const zip = loadZipTiddler(event.param);
			zip.file(paramObject.filename,paramObject.text);
			saveZipTiddler(event.param,zip);
		}
	});
	$tw.rootWidget.addEventListener("tm-zip-render-file",(event) => {
		const paramObject = event.paramObject || {};
		if(event.param && paramObject.filename && paramObject.template) {
			const zip = loadZipTiddler(event.param);
			const outputType = paramObject.output || "text/plain";
			const templateTitle = paramObject.template;
			const text = $tw.wiki.renderTiddler(outputType,templateTitle,{
				parseAsInline: paramObject.mode === "inline",
				parentWidget: event.widget,
				variables: {
					currentTiddler: paramObject.tiddler
				}
			});
			zip.file(paramObject.filename,text);
			saveZipTiddler(event.param,zip);
		}
	});
	$tw.rootWidget.addEventListener("tm-zip-download",(event) => {
		const paramObject = event.paramObject || {};
		if(event.param) {
			downloadZipFile(event.param,paramObject.filename || "file.zip");
		}
	});
};

function loadZipTiddler(title) {
	return $tw.wiki.getGlobalCache("jszip",() => {
		const zip = new JSZip();
		const tiddler = $tw.wiki.getTiddler(title);
		if(tiddler && tiddler.fields.type === "application/zip") {
			try {
				zip.load(tiddler.fields.text,{
					base64: true
				});
			} catch(e) {
				console.log(`JSZip error: ${e}`);
			}
		}
		return zip;
	});
}

function saveZipTiddler(title,zip) {
	const data = zip.generate({
		type: "base64"
	});
	$tw.wiki.addTiddler({
		title,
		type: "application/zip",
		text: data
	});
}

function downloadZipFile(title,filename) {
	const tiddler = $tw.wiki.getTiddler(title);
	if(tiddler && tiddler.fields.text && tiddler.fields.type === "application/zip") {
		const link = document.createElement("a");
		link.setAttribute("href",`data:application/zip;base64,${encodeURIComponent(tiddler.fields.text)}`);
		link.setAttribute("download",filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
}
