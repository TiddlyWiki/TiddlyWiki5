# cook.js

This is an attempt to modernise TiddlyWiki's build system, which has been based on tools written in Ruby called Cook and Ginsu (see https://github.com/TiddlyWiki/cooker for details). They were first written in 2006 and have been heavily hacked since then.

This new version is written in JavaScript for node.js, with the intention that it can share code with TiddlyWiki itself.

The original goal was to achieve byte-for-byte compatibility with the old tools. However, so many bugs have been discovered in the old tools that the new goal is to achieve byte-for-byte compatibility with TiddlyWiki itself when it saves changes.

## Usage

	node tiddlywiki.js <options>

The command line options are processed in sequential order from left to right. Processing pauses during long operations, like loading a recipe file and all the subrecipes and tiddlers that it references. The following options are available:

	--recipe <filepath>			# Loads a specfied `.recipe` file
	--load <filepath>			# Load additional tiddlers from TiddlyWiki files (`.html`), `.tiddler`, `.tid`, `.json` or other files
	--savewiki <dirpath>		# Saves all the loaded tiddlers as a single file TiddlyWiki called `index.html` and an RSS feed called `index.xml`
	--savetiddlers <outdir>		# Saves all the loaded tiddlers as `.tid` files in the specified directory
	--servewiki <port>			# Serve the cooked TiddlyWiki over HTTP at `/`
	--servetiddlers <port>		# Serve individual tiddlers over HTTP at `/tiddlertitle`
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

You can use filepaths or URLs to reference recipe files and tiddlers. For example, this recipe cooks the latest TiddlyWiki components directly from the online repositories:

	recipe: https://raw.github.com/TiddlyWiki/tiddlywiki/master/tiddlywikinonoscript.html.recipe
	tiddler: http://tiddlywiki-com.tiddlyspace.com/bags/tiddlywiki-com-ref_public/tiddlers.json?fat=1
	tiddler: http://tiddlywiki-com.tiddlyspace.com/bags/tiddlywiki-com_public/tiddlers.json?fat=1

## Recipe files

`.recipe` files are text files that list the components to be assembled into a TiddlyWiki. They link to a simple template file that contains the basic structure of the TiddlyWiki document with additional markers to identify parts of the file where ingredients are inserted. Recipes determine which tiddlers should be included in the file, and put together the individual JavaScript files making up the TiddlyWiki core code.

Each line of the recipe file lists an ingredient, prefixed with a tag that describes what to do with the ingredient. Tags either identify a marker within the template file or are special tags that initiate an action.

Recipe files contain lines consisting of a marker, a colon and the pathname of an ingredient:

	marker: filepath

The filepath is interpreted relative to the directory containing the recipe file.

The special marker `recipe` is used to load a sub-recipe file.

The special marker `template` is used to identify the HTML template. The HTML template contains markers in two different forms:

	<!--@@marker@@-->
	&lt;!--@@marker@@--&gt;

The special marker `title` is automatically filled in with a plain text rendering of the WindowTitle tiddler.

The special marker `tiddler` is used for the main content tiddlers that will be encoded in TiddlyWiki `<DIV>` format.

The special marker `copy` is used to indicate files that should be copied alongside the finished TiddlyWiki file.

## Tiddler files

Tiddlers can be stored in text files in several different formats. Files containing single tiddlers can also have an auxiliary `.meta` file formatted as a sequence of name:value pairs:

	title: TheTitle
	modifier: someone

### TiddlyWeb-style .tid files

These files consist of a sequence of lines containing name:value pairs, a blank line and then the text of the tiddler. For example:

	title: MyTiddler
	modifier: Jeremy

	This is the text of my tiddler.

### TiddlyWiki `<DIV>` .tiddler files

Modern `*.tiddler` files look like this:

	<div title="AnotherExampleStyleSheet" modifier="blaine" created="201102111106" modified="201102111310" tags="examples" creator="psd">
	<pre>Note that there is an embedded <pre> tag, and line feeds are not escaped.
	
	And, weirdly, there is no HTML encoding of the body.</pre>
	</div>

These `*.tiddler` files are therefore not quite the same as the tiddlers found inside a TiddlyWiki HTML file, where the body is HTML encoded in the expected way.

Older `*.tiddler` files more closely matched the store format used by TiddlyWiki at the time:

	<div tiddler="AnotherExampleStyleSheet" modifier="JeremyRuston" modified="200508181432" created="200508181432" tags="examples">This is an old-school .tiddler file, without an embedded &lt;pre&gt; tag.\nNote how the body is &quot;HTML encoded&quot; and new lines are escaped to \\n</div>

### TiddlyWeb-style JSON files

These files are a straightforward array of hashmaps of name:value fields. Currently only these known fields are processed: `title`, `text`, `created`, `creator`, `modified`, `modifier`, `type` and `tags`.

### TiddlyWiki HTML files

TiddlyWiki HTML files contain a collection of tiddlers encoded in `<DIV>` format.

## Testing

`test.sh` contains a simple test that cooks the main tiddlywiki.com recipe and compares it with the results of the old build process (ie, running cook.rb and then opening the file in a browser and performing a 'save changes' operation). It also invokes `wikitest.js`, a wikification test rig that works off the data in `test/wikitests/`.

## API

Here is a guide to the key modules making up tiddlywiki.js and their public APIs. The modules are listed in order of dependency; modules generally don't know about other modules later in the list unless specifically noted.

Some non-standard MIME types are used by the code:

* **text/x-tiddlywiki:** TiddlyWiki-format wiki text
* **application/x-tiddlywiki:** A TiddlyWiki HTML file containing tiddlers
* **application/x-tiddler:** A tiddler in TiddlyWeb-style tiddler file format
* **application/x-tiddler-html-div:** A tiddler in TiddlyWiki `<div>` format

### Tiddler.js

Tiddlers are an immutable dictionary of name:value pairs called fields. Values can be a string, an array of strings, or a JavaScript date object.

The only field that is required is the `title` field, but useful tiddlers also have a `text` field, and some or all of the standard fields `modified`, `modifier`, `created`, `creator`, `tags` and `type`.

Hardcoded in the system is the knowledge that the 'tags' field is a string array, and that the 'modified' and 'created' fields are dates. All other fields are strings.

#### var tiddler = new Tiddler([srcFields{,srcFields}])

Create a Tiddler given a series of sources of fields which can either be a plain hashmap of name:value pairs or an existing tiddler to clone. Fields in later sources overwrite the same field specified in earlier sources.

The hashmaps can specify the  "modified" and "created" fields as strings in YYYYMMDDHHMMSSMMM format or as JavaScript date objects. The "tags" field can be given as a JavaScript array of strings or as a TiddlyWiki quoted string (eg, "one [[two three]]").

#### tiddler.fields

Returns a hashmap of tiddler fields, which can be used for read-only access

#### tiddler.hasTag(tag)

Returns a Boolean indicating whether the tiddler has a particular tag.

#### tiddler.cache(name[,value])

Returns or sets the value of a named cache object associated with the tiddler.

### TiddlerConverters.js

This class acts as a factory for tiddler serializers and deserializers.

#### var tiddlerConverters = new TiddlerConverters()

Creates a tiddler converter factory

#### tiddlerConverters.registerSerializer(extension,mimeType,serializer)

Registers a function that knows how to serialise a tiddler into a representation identified by a file extension and a MIME type. The serializer is called with a tiddler to convert and returns the string representation:

	Tiddler.registerSerializer(".tiddler","application/x-tiddler-html-div",function (tiddler) {
		return "<div" + "...>" + "</div>"; 
	});

#### tiddlerConverters.registerDeserializer(extension,mimeType,deserializer)

Registers a function that knows how to deserialize one or more tiddlers from a block of text identified by a particular file extension and a MIME type. The deserializer is called with the text to convert and should return an array of tiddler field hashmaps:

	Tiddler.registerDeserializer(".tid","application/x-tiddler",function (text,srcFields) {
		var fields = copy(SrcFields);
		// Assemble the fields from the text
		return [fields];
	});

#### tiddlerConverters.deserialize(type,text,srcFields)

Given a block of text and a MIME type or file extension, returns an array of hashmaps of tiddler fields. One or more source fields can be provided to pre-populate the tiddler before the text is parsed.

If the type is not recognised then the raw text is assigned to the `text` field.

#### tiddlerConverters.serialize(tiddler,type)

Serializes a tiddler into a text representation identified by a MIME type or file extension.

For example:

	console.log(tiddlerConverters.serialize(tiddler,".tid"));

### TiddlerInput.js and TiddlerOutput.js

Contain classes that can be registered with a TiddlerConverters object to common formats.

#### TiddlerInput.register(tiddlerConverters)

Registers deserializers for these input types:

	Extension	MIME types						Description
	---------	---------						-----------
	.tiddler	application/x-tiddler-html-div	TiddlyWiki storeArea-style <div>
	.tid		application/x-tiddler			TiddlyWeb-style tiddler text file
	.txt		text/plain						plain text file interpreted as the tiddler text
	.html		text/html						plain HTML file interpreted as the tiddler text
	.js			application/javascript			JavaScript file interpreted as the tiddler text
	.json		application/json				JSON object containing an array of tiddler field hashmaps
	.tiddlywiki	application/x-tiddlywiki		TiddlyWiki HTML document containing one or more tiddler <div>s

#### TiddlerOutput.register(tiddlerConverters)

Registers serializers for these output types:

	Extension	MIME types						Description
	---------	---------						-----------
	.tiddler	application/x-tiddler-html-div	TiddlyWiki storeArea-style <div>
	.tid		application/x-tiddler			TiddlyWeb-style tiddler text file

### TextProcessors.js

Text processors are components that know how to parse and render tiddlers of particular types. The core of TiddlyWiki is the WikiText processor, which can parse TiddlyWiki wikitext into a JavaScript object tree representation, and then render the tree into HTML or plain text. Other text processors planned include:

* `JSONText` to allow JSON objects to display nicely, and make their content available with TiddlyWiki section/slice notation
* `CSSText` to parse CSS, and process extensions such as transclusion, theming and variables
* `JavaScriptText` to parse JavaScript tiddlers for clearer display, and allow sandboxed execution through compilation

Note that text processors encapsulate two operations: parsing into a tree, and rendering that tree into text representations. Parsing doesn't need a context, but rendering needs to have access to a context consisting of a WikiStore to use to retrieve any referenced tiddlers, and the title of the tiddler that is being rendered.

#### textProcessors = new TextProcessors()

Applications should create a TextProcessors object to keep track of the available text processors.

#### textProcessors.registerTextProcessor(mimeType,textProcessor)

Registers an instance of a text processor class to handle text with a particular MIME type. For example:

	var options = {
		...
	};
	textProcessors.registerTextProcessor("text/x-tiddlywiki",new WikiTextProcessor(options));

The text processor object must support the following methods:

	// Parses some text and returns a parse tree object
	var parseTree = textProcessor.parse(text)

Parser objects support the following methods:

	// Renders a subnode of the parse tree to a representation identified by MIME type,
	// as if rendered within the context of the specified WikiStore and tiddler title
	var renderedText = parseTree.render(type,treenode,store,title)

#### textProcessors.parse(type,text)

Chooses a text processor based on the MIME type of the content and calls the `parse` method to parse the text into a parse tree. Returns null if the type was not recognised by a registered parser.

If the MIME type is unrecognised or unknown, it defaults to "text/x-tiddlywiki".

### WikiTextProcessor.js

A text processor that parses and renders TiddlyWiki style wiki text.

This module privately includes the following modules:

* WikiTextParser.js containing the wiki text parsing engine
* WikiTextRules.js containing the rules driving the wiki text parsing engine
* WikiTextRenderer.js containing the wiki text rendering engine

#### var wikiTextProcessor = new WikiTextProcessor(options)

Creates a new instance of the wiki text processor with the specified options. The options are a hashmap of optional members and are planned as follows:

* **enableRules:** An array of names of wiki text rules to enable. If not specified, all rules are available
* **extraRules:** A hashmap of additional rule handlers to add
* **enableMacros:** An array of names of macros to enable. If not specified, all macros are available
* **extraMacros:** A hashmap of additional macro handlers to add

### WikiStore.js

A collection of uniquely titled tiddlers. Although the tiddlers themselves are immutable, new tiddlers can be stored under an existing title, replacing the previous tiddler.

Each wiki store is connected to a shadow store that is also a WikiStore() object. Under usual circumstances, when an attempt is made to retrieve a tiddler that doesn't exist in the store, the search continues into its shadow store (and so on, if the shadow store itself has a shadow store).

#### var store = new WikiStore(options)

Creates a new wiki store. The options are a hashmap of optional members as follows:

* **textProcessors:** A reference to the TextProcessors() instance to be used to resolve parsing and rendering requests
* **shadowStore:** An optional reference to an existing WikiStore to use as the source of shadow tiddlers. Pass null to disable shadow tiddlers for the new store

#### store.shadows

Exposes a reference to the shadow store for this store.

#### store.clear()

Clears the store of all tiddlers.

#### store.getTiddler(title)

Attempts to retrieve the tiddler with a given title. Returns `null` if the tiddler doesn't exist.

#### store.getTiddlerText(title,defaultText)

Retrieves the text of a particular tiddler. If the tiddler doesn't exist, then the defaultText is returned, or `null` if not specified.

#### store.deleteTiddler(title)

Deletes the specified tiddler from the store.

#### store.tiddlerExists(title)

Returns a boolean indicating whether a particular tiddler exists.

#### store.addTiddler(tiddler)

Adds the specified tiddler object to the store. The tiddler can be specified as a Tiddler() object or a hashmap of tiddler fields.

#### store.forEachTiddler([sortField,[excludeTag,]]callback)

Invokes a callback for each tiddler in the store, optionally sorting by a specified field and excluding tiddlers with a specified tag. The callback is called with the title of the tiddler and a reference to the tiddler itself. For example:

	store.forEachTiddler(function(title,tiddler) {
		console.log(title);
	});

#### store.parseTiddler(title)

Returns the parse tree object for a tiddler, which may be cached within the tiddler.

#### store.renderTiddler(type,title)

Returns a dynamically generated rendering of the tiddler in a representation identified by a MIME type.

### Recipe.js

The Recipe() class loads a TiddlyWiki recipe file, resolving references to subrecipe files. Tiddlers referenced by the recipe are loaded into a WikiStore. A fully loaded recipe can then be cooked to produce an HTML or RSS TiddlyWiki representation of the recipe.

#### var recipe = new Recipe(options,callback)

Creates a new Recipe object by loading the specified recipe file. On completion the callback is invoked with a single parameter `err` that is null if the recipe loading was successful, or an Error() object otherwise.

	var recipe = new Recipe({
		filepath: "recent.recipe",
		tiddlerConverters: tiddlerConverters,
		store: store	
	},function callback(err) {
		if(err) {
			throw err;
		} else {
			console.log(recipe.cook())
		}
	}

Options is a hashmap with the following mandatory fields:

* **filepath:** The filepath to the recipe file to load
* **tiddlerConverters:** The TiddlerConverters() object to use to serialize and deserialize tiddlers
* **textProcessors:** The TextProcessors() object to use to parse and render tiddler text
* **store:** The WikiStore object to use to store the tiddlers in the recipe

The options can also contain these optional fields:

* (none at present)

#### recipe.cook()

Cooks a TiddlyWiki HTML file from the recipe and returns it as a string.

#### recipe.cookRss()

Cooks a TiddlyWiki RSS file from the recipe and returns it as a string.

## Parsing and rendering wiki text

Wiki text is parsed into a simple object tree format. The parser doesn't need access to a WikiStore, nor does it need to know which tiddler, if any, the text it is parsing came from. This means that the parse tree can be cached within a tiddler when needed, and that parse trees can exist independently of tiddlers and WikiStores.

Rendering converts the parse tree into a textual format. The process requires access to a WikiStore so that it can resolve references to other tiddlers. It also needs to know which tiddler to use as the context for rendering the parse tree - this is the tiddler that is referenced by the `<<view>>` macro, for example.

### Parse tree format

The parse tree described here is defined as part of the WikiTextParser; other text processors could choose to represent their parse trees differently. However, it is hoped that this format is a sufficiently generic, transparent representation of HTML (and SVG) that it could be used by many other parsers, allowing the rendering engine, and macro processing, to be shared across parsers.

HTML elements are represented as:

	{type: "div", attributes: {
			attr1: value,
			style: {
				name: value,
				name2: value2
			}
		}, children: [
			{child},
			{child},		
		]}

Text nodes are represented as:

	{type: "text", value: "string of text node"}

Macros are represented as:

	{type: "macro", name: "macroname", params: "parameter string", output: [<outputtree]}

Note that the macro output is only added to the tree during rendering.

The parse tree can also contain context frames:

	{type: "context", tiddler: "title", children: [<childnodes>]}

Context frames are explained further in the section on rendering below.

### Rendering process

Wiki text rendering requires:

* the MIME type of the target format (currently `text/plain` or `text/html`)
* the parse tree to be rendered
* the WikiStore object to be used for resolving references to other tiddlers
* the title of the tiddler to use as the rendering context

The rendering process is to recursively scan the parse tree and stitch together the fragments making up the HTML elements corresponding to the nodes of the tree.

Macros are executed during rendering, which involves invoking the named macro handler with the macro parameter string, and a reference to the parse tree node for the macro. The handler then inserts the output parse tree into the `output` member of the macro node.

The `<<tiddler>>` macro doesn't change the tiddler context for its children. This means that when you transclude a tiddler, any `<<view>>` macros within it reference the fields of the tiddler that did the transcluding.

The list macro uses transcluding in a slightly different way as a form of templating. For example:

	<<list all template:MyTiddler>>

Here, `MyTiddler` specifies the information that should be displayed about each tiddler. In this example, there is a link to the tiddler, a link to the author, and the modification date:

	<<view title link>>, <<view modifier link>>, <<view modified "YYYY MM DD">>

In order to ensure that the correct target is used for these view macros, the `<<list>>`` macro creates a context frame around each list item:

	{type: "li", children: [
		{type: "context", tiddler: "FirstTiddler", children: [
			{type: "macro", name: "view", params: "title link"},
			{type: "macro", name: "view", params: "modifier link"},
			{type: "macro", name: "view", params: "modified \"YYYY MM DD\""}
		]}
	]}

