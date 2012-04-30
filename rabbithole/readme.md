# Down the Rabbit Hole

This is a major refactoring of the TiddlyWiki5 code to introduce a plugin module architecture.

The work has been done by creating a new boot kernel architecture and then methodically transliterating the core TiddlyWiki5 code to fit into that architecture. The work hasn't completely caught up with the old code, and so the two code bases will live alongside one another for a little while the new code is built out.

## Try it out

The easiest way to try out the code is to visit http://tiddlywiki.com/tiddlywiki5/

For trying it out under `node.js`, two batch files are provided:

* `run.sh` boots the kernel and loads the core modules and then outputs the `$tw` global for inspection
* `bld.sh` builds the new TiddlyWiki 5 HTML file (placed in the `tmp/tw5/` directory by default)

## Boot Kernel

The file `core/boot.js` is a barebones TiddlyWiki kernel that is just sufficient to load the core plugin modules and trigger a startup plugin module to load up the rest of the application.

The kernel includes:

* Eight short shared utility functions
* Three methods implementing the plugin module mechanism
* The `$tw.Tiddler` class (and three field definition plugins)
* The `$tw.Wiki` class (and three tiddler deserialization methods)
* Code for the browser to load tiddlers from the HTML DOM
* Code for the server to load tiddlers from the file system

Each module is an ordinary `node.js`-style module, using the `require()` function to access other modules and the `exports` global to return JavaScript values. The boot kernel smooths over the differences between `node.js` and the browser, allowing the same plugin modules to execute in both environments.

In the browser, `core/boot.js` is packed into a template HTML file that contains the following elements in order:

* Ordinary and shadow tiddlers, packed as HTML `<DIV>` elements
* `core/bootprefix.js`, containing a few lines to set up the plugin environment
* Plugin JavaScript modules, packed as HTML `<SCRIPT>` blocks
* `core/boot.js`, containing the boot kernel

On the server, `core/boot.js` is executed directly. It uses the `node.js` local file API to load plugins directly from the file system in the `core/modules` directory. The code loading is performed synchronously for brevity (and because the system is in any case inherently blocked until plugins are loaded).

The boot kernel sets up the `$tw` global variable that is used to store all the state data of the system.

## Core 

The 'core' is the boot kernel plus the set of plugin modules that it loads. It contains plugins of the following types:

* `tiddlerfield` - defines the characteristics of tiddler fields of a particular name
* `tiddlerdeserializer` - methods to extract tiddlers from text representations or the DOM
* `startup` - functions to be called by the kernel after booting
* `global` - members of the `$tw` global
* `config` - values to be merged over the `$tw.config` global
* `utils` - general purpose utility functions residing in `$tw.utils`
* `tiddlermethod` - additional methods for the `$tw.Tiddler` class
* `wikimethod` - additional methods for the `$tw.Wiki` class
* `treeutils` - static utility methods for parser tree nodes 
* `treenode` - classes of parser tree nodes
* `macro` - macro definitions
* `editor` - interactive editors for different types of content
* `parser` - parsers for different types of content
* `wikitextrule` - individual rules for the wikitext parser

TiddlyWiki5 makes extensive use of JavaScript inheritance:

* Tree nodes defined in `$:/core/treenodes/` all inherit from `$:/core/treenodes/node.js`
* Macros defined in `$:/core/macros/` all inherit from `$:/core/treenodes/macro.js`
