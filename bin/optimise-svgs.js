#!/usr/bin/env node

/*
Optimise the SVGs in ./core/images using SVGO from https://github.com/svg/svgo

Install SVGO with the following command in the root of the repo:

npm install svgo
*/

"use strict";

var fs = require("fs"),
	path = require("path"),
	SVGO = require("svgo"),
	svgo = new SVGO({
		plugins: [
			{cleanupAttrs: true},
			{removeDoctype: true},
			{removeXMLProcInst: true},
			{removeComments: true},
			{removeMetadata: true},
			{removeTitle: true},
			{removeDesc: true},
			{removeUselessDefs: true},
			{removeEditorsNSData: true},
			{removeEmptyAttrs: true},
			{removeHiddenElems: true},
			{removeEmptyText: true},
			{removeEmptyContainers: true},
			{removeViewBox: false},
			{cleanupEnableBackground: true},
			{convertStyleToAttrs: true},
			{convertColors: true},
			{convertPathData: true},
			{convertTransform: true},
			{removeUnknownsAndDefaults: true},
			{removeNonInheritableGroupAttrs: true},
			{removeUselessStrokeAndFill: true},
			{removeUnusedNS: true},
			{cleanupIDs: true},
			{cleanupNumericValues: true},
			{moveElemsAttrsToGroup: true},
			{moveGroupAttrsToElems: true},
			{collapseGroups: true},
			{removeRasterImages: false},
			{mergePaths: true},
			{convertShapeToPath: true},
			{sortAttrs: true},
			{removeDimensions: false},
			{removeAttrs: {attrs: "(stroke|fill)"}}
		]
	});

var basepath = "./core/images/",
	files = fs.readdirSync(basepath).sort();

files.forEach(function(filename) {
	if(filename.slice(-4) === ".tid") {
		var filepath = path.resolve(basepath,filename),
			data = fs.readFileSync(filepath,"utf8"),
			lines = data.split("\n"),
			blankLine = lines.indexOf(""),
			header = lines.slice(0,blankLine),
			body = lines.slice(blankLine + 1),
			fakeSVG = body.join("\n");
		// A hack to make the new-journal-button work
		fakeSVG = fakeSVG.replace("<<now \"DD\">>","&lt;&lt;now &quot;DD&quot;&gt;&gt;");
		svgo.optimize(fakeSVG, {path: filepath}).then(function(result) {
			var newSVG = header.join("\n") + "\n\n" + result.data.replace("&lt;&lt;now &quot;DD&quot;&gt;&gt;","<<now \"DD\">>");
			fs.writeFileSync(filepath,newSVG);
		},function(err) {
			console.log("Error " + err + " with " + filename)
			process.exit();
		});
	}
});
