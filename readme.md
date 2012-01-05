# Introduction

This is an attempt to modernise TiddlyWiki's build system, which has been based on tools written in Ruby called Cook and Ginsu (see https://github.com/TiddlyWiki/cooker for details). They were first written in 2006 and have been heavily hacked since then.

This new version is written in JavaScript for node.js, so that it can share code with TiddlyWiki itself.

The original goal was to achieve byte-for-byte compatibility with the old tools. However, so many bugs have been discovered in the old tools that the new goal is to achieve byte-for-byte compatibility with TiddlyWiki itself when it saves changes.

# Usage

	node tiddlywiki.js <options>

The command line options are processed in sequential order from left to right. Processing pauses during long operations, like loading a recipe file and all the subrecipes and tiddlers that it references. The following options are available:

	--recipe <filepath>			# Loads a specfied `.recipe` file
	--load <filepath>			# Load additional tiddlers from TiddlyWiki files (`.html`), `.tiddler`, `.tid`, `.json` or other files
	--savewiki <dirpath>		# Saves all the loaded tiddlers as a single file TiddlyWiki called `index.html` and an RSS feed called `index.xml`
	--savetiddlers <outdir>		# Saves all the loaded tiddlers as `.tid` files in the specified directory
	--servewiki <port>			# Serve the cooked TiddlyWiki over HTTP at `/`
	--servetiddlers <port>		# Serve individual tiddlers over HTTP at `/tiddlertitle`
	--wikitest <dir>			# Run wikification tests against the tiddlers in the given directory
	--dumpstore					# Dump the TiddlyWiki store in JSON format
	--dumprecipe				# Dump the current recipe in JSON format
	--verbose 					# verbose output, useful for debugging

This example loads the tiddlers from a TiddlyWiki HTML file and makes them available over HTTP:

	node tiddlywiki.js --load mywiki.html --servewiki 127.0.0.1:8000

This example cooks a TiddlyWiki from a recipe:

	node tiddlywiki.js --recipe tiddlywiki.com/index.recipe --savewiki tmp/

This example ginsus a TiddlyWiki into its constituent tiddlers:

	node tiddlywiki.js --load mywiki.html --savetiddlers tmp/tiddlers

`--servewiki` and `--servertiddlers` are for different purposes and should not be used together. The former is for TiddlyWiki core developers who want to be able to edit the TiddlyWiki source files in a text editor and view the results in the browser by clicking refresh; it is slow because it reloads all the TiddlyWiki JavaScript files each time the page is loaded. The latter is for experimenting with the new wikification engine.

`--wikitest` looks for `*.tid` files in the specified folder. It then wikifies the tiddlers to both "text/plain" and "text/html" format and checks the results against the content of the `*.html` and `*.txt` files in the same directory.

You can use filepaths or URLs to reference recipe files and tiddlers. For example, this recipe cooks the latest TiddlyWiki components directly from the online repositories:

	recipe: https://raw.github.com/TiddlyWiki/tiddlywiki/master/tiddlywikinonoscript.html.recipe
	tiddler: http://tiddlywiki-com.tiddlyspace.com/bags/tiddlywiki-com-ref_public/tiddlers.json?fat=1
	tiddler: http://tiddlywiki-com.tiddlyspace.com/bags/tiddlywiki-com_public/tiddlers.json?fat=1

# Testing

`test.sh` contains a simple test script that cooks the main tiddlywiki.com recipe and compares it with the results of the old build process (ie, running cook.rb and then opening the file in a browser and performing a 'save changes' operation). It also runs a series of wikifications tests that work off the data in `test/wikitests/`.
