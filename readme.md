# cook.js

This is an attempt to modernise TiddlyWiki's build system, which has been based on tools written in Ruby called Cook and Ginsu (see https://github.com/TiddlyWiki/cooker for details). They were first written in 2006 and have been heavily hacked since then.

This new version is written in JavaScript for node.js, with the intention that it can share code with TiddlyWiki itself.

The goal is to achieve byte-for-byte compatibility with the old tools, but only to support the features required by the recipe files that are currently in use by TiddlyWiki and TiddlySpace.

## Usage

	node cook.js <recipefile>

Cooks a recipe file and sends the output to STDOUT

	node server.js <recipefile>

Cooks a recipe file and serves it over HTTP port 8000

	node ginsu.js <tiddlywikifile> <outputdir>

Splits a TiddlyWiki file into separate `.tid` files and a `split.recipe` file.

## Testing

`test.sh` contains a simple test that cooks the main tiddlywiki.com recipe, first with the old Ruby-based tool, and then the new one. It uses OS X's opendiff to display the differences between the two files.

## Current status

As of 22nd November 2011, cook.js can now build a fully functional TiddlyWiki from the existing recipe files. There are still some minor differences in the layout of tiddler attributes, and some whitespace issues that prevent full byte-for-byte compatibility.
