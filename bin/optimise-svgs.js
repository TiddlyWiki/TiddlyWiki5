#!/usr/bin/env node

/*
Optimise the SVGs in ./core/images using SVGO from https://github.com/svg/svgo

Install SVGO with the following command in the root of the repo:

npm install svgo@2.3.0
*/

"use strict";

const fs = require("fs");
const path = require("path");
const {optimize} = require("svgo");
const config = {
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
		{name: 'removeAttrs',params: {attrs: '(stroke|fill)'}}
	]
};

const basepath = "./core/images/";
const files = fs.readdirSync(basepath).sort();

files.forEach((filename) => {
	if(filename.slice(-4) === ".tid") {
		const filepath = path.resolve(basepath,filename);
		const data = fs.readFileSync(filepath,"utf8");
		const lines = data.split("\n");
		const blankLine = lines.indexOf("");
		const header = lines.slice(0,blankLine);
		const body = lines.slice(blankLine + 1);
		let fakeSVG = body.join("\n");
		// A hack to make the new-journal-button work
		fakeSVG = fakeSVG.replace("<<now \"DD\">>","&lt;&lt;now &quot;DD&quot;&gt;&gt;");
		config.path = filepath;
		const result = optimize(fakeSVG,config);
		if(result) {
			const newSVG = `${header.join("\n")}\n\n${result.data.replace("&lt;&lt;now &quot;DD&quot;&gt;&gt;","<<now \"DD\">>")}`;
			fs.writeFileSync(filepath,newSVG);
		} else {
			console.log(`Error ${err} with ${filename}`);
			process.exit();
		};
	}
});
