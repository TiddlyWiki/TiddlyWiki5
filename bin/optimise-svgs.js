#!/usr/bin/env node

/*
Optimise the SVGs in ./core/images using SVGO from https://github.com/svg/svgo

Install SVGO with the following command in the root of the repo:

npm install svgo@2.3.0
*/

"use strict";

var fs = require("fs"),
	path = require("path"),
	{ optimize } = require("svgo"),
	config = {
		plugins: [
			'cleanupAttrs',
			'removeDoctype',
			'removeXMLProcInst',
			'removeComments',
			'removeMetadata',
			'removeTitle',
			'removeDesc',
			'removeUselessDefs',
			'removeEditorsNSData',
			'removeEmptyAttrs',
			'removeHiddenElems',
			'removeEmptyText',
			'removeEmptyContainers',
			// 'removeViewBox',
			'cleanupEnableBackground',
			'convertStyleToAttrs',
			'convertColors',
			'convertPathData',
			'convertTransform',
			'removeUnknownsAndDefaults',
			'removeNonInheritableGroupAttrs',
			'removeUselessStrokeAndFill',
			'removeUnusedNS',
			'cleanupIDs',
			'cleanupNumericValues',
			'moveElemsAttrsToGroup',
			'moveGroupAttrsToElems',
			'collapseGroups',
			// 'removeRasterImages',
			'mergePaths',
			'convertShapeToPath',
			'sortAttrs',
			//'removeDimensions',
			{name: 'removeAttrs', params: { attrs: '(stroke|fill)' } }
		]
	};

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
		config.path = filepath;
		var result = optimize(fakeSVG,config);
		if(result) {
			var newSVG = header.join("\n") + "\n\n" + result.data.replace("&lt;&lt;now &quot;DD&quot;&gt;&gt;","<<now \"DD\">>");
			fs.writeFileSync(filepath,newSVG);
		} else {
			console.log("Error " + err + " with " + filename)
			process.exit();
		};
	}
});
