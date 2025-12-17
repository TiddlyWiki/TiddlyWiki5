# TiddlyWiki5 Development Guide

## Architecture Overview

TiddlyWiki5 is a non-linear personal web notebook built as a complete interactive wiki in JavaScript. It runs as a single-file HTML application in browsers or as a Node.js application.

### Core Components

- **boot/boot.js**: Bootstrap kernel creating the barebones TW environment. Executed directly on server; packed into HTML for browser.
- **core/modules/**: Core functionality organized by module type using TiddlyWiki's module system
- **core/plugin.info**: Plugin metadata following the plugin folder structure
- **editions/**: Pre-configured wiki configurations with different plugin/theme combinations
- **plugins/tiddlywiki/**: Official plugins organized by functionality
- **themes/tiddlywiki/**: Visual themes for the UI

## Module System

TiddlyWiki uses a custom module system where modules declare their type via a `module-type:` comment header:

```javascript
/*\
title: $:/core/modules/widgets/mywidget.js
type: application/javascript
module-type: widget

Description of the module

\*/
```

### Key Module Types

- **widget**: UI components (extend Widget base class from `$:/core/modules/widgets/widget.js`)
- **filteroperator**: Filter expression operators (exports function taking `source`, `operator`, `options`)
- **wikimethod**: Extensions to `$tw.Wiki.prototype`
- **tiddlermethod**: Extensions to `$tw.Tiddler.prototype`
- **utils**: Utility functions added to `$tw.utils`
- **macro**: Macro definitions stored in `$tw.macros`
- **parser**: Content parsers (WikiText parser at `core/modules/parsers/wikiparser/`)
- **wikirule**: Parser rules (pragma, block, inline) for WikiText syntax
- **startup**: Initialization code with `exports.name`, `exports.synchronous`, `exports.startup()`
- **command**: CLI commands for Node.js (used via `tiddlywiki --commandname`)
- **saver**: Mechanisms for saving wiki changes
- **storyview**: Animation effects for tiddler transitions
- **indexer**: Performance optimization for wiki operations

Access modules via:
- `$tw.modules.applyMethods(type, target)` - Apply module methods to target object
- `$tw.modules.getModulesByTypeAsHashmap(type)` - Get modules as hashmap
- `$tw.modules.createClassesFromModules(type, subtype, baseClass)` - Create class instances

## Development Workflows

### Running TiddlyWiki

```bash
# Development server (tw5.com-server edition)
npm run dev

# Custom edition
node ./tiddlywiki.js ./editions/EDITION_NAME --listen

# With plugins loaded dynamically
node ./tiddlywiki.js +plugins/tiddlywiki/filesystem mywiki --listen
```

### Testing

```bash
# Run all tests
npm test
# or
node ./tiddlywiki.js ./editions/test --verbose --version --build index

# Browser tests: open editions/test/output/test.html
```

### Building

```bash
# Build specific edition using tiddlywiki.info build targets
node ./tiddlywiki.js ./editions/EDITION_NAME --build TARGET_NAME
```

Build targets are defined in `tiddlywiki.info` files:
```json
{
  "build": {
    "index": [
      "--rendertiddler", "$:/core/save/all", "index.html", "text/plain"
    ]
  }
}
```

### Linting

```bash
npm run lint        # Check for errors
npm run lint:fix    # Auto-fix where possible
```

ESLint enforces ES2017 for most code, ES2023 for bin/ and core-server/. Config in `eslint.config.mjs`.

## Project Structure Patterns

### Edition Layout

```
editions/EDITION_NAME/
├── tiddlywiki.info          # Edition configuration
└── tiddlers/                # Tiddler content files
    ├── file.tid             # Single tiddler
    └── subfolder/
```

### Plugin Layout

```
plugins/tiddlywiki/PLUGIN_NAME/
├── plugin.info              # Plugin metadata (JSON)
├── files/                   # External resources
└── *.js or *.tid files      # Plugin content
```

### Tiddler File Formats

- `.tid`: Text format with metadata header (field: value pairs) and blank line before content
- `.js`: JavaScript modules with special header comments
- `.meta` + content file: Separate metadata and content files
- `.json`: JSON tiddler format

## Widget Development

Widgets extend the base `Widget` class. Required methods:

```javascript
var Widget = require("$:/core/modules/widgets/widget.js").widget;

var MyWidget = function(parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
};

// Inherit from base widget
MyWidget.prototype = new Widget();

// Compute internal state
MyWidget.prototype.execute = function() {
    // Set widget variables from attributes
    this.myAttribute = this.getAttribute("myattribute", "defaultValue");
    // Construct child widgets
    this.makeChildWidgets();
};

// Render into DOM
MyWidget.prototype.render = function(parent, nextSibling) {
    this.parentDomNode = parent;
    this.execute();
    // Create DOM nodes and store in this.domNodes
    var domNode = this.document.createElement("div");
    parent.insertBefore(domNode, nextSibling);
    this.domNodes.push(domNode);
    // Render children
    this.renderChildren(domNode, null);
};

// Handle updates
MyWidget.prototype.refresh = function(changedTiddlers) {
    // Check if refresh needed
    var changedAttributes = this.computeAttributes();
    if(changedAttributes.myattribute) {
        this.refreshSelf();
        return true;
    }
    // Refresh children
    return this.refreshChildren(changedTiddlers);
};

exports.mywidget = MyWidget;
```

## Filter Operator Pattern

```javascript
exports.operatorname = function(source, operator, options) {
    var results = [];
    source(function(tiddler, title) {
        // Process each input title
        // Use operator.operand for the operator parameter
        // Access wiki via options.wiki
        results.push(processedTitle);
    });
    return results;
};
```

## WikiText Parser Rules

Rules are organized by type (pragma/block/inline) and instantiated during parsing. See `core/modules/parsers/wikiparser/wikiparser.js` for rule instantiation and `core/modules/parsers/wikiparser/rules/` for examples.

## $tw Global Object

Key properties:
- `$tw.wiki`: The wiki store (tiddler database)
- `$tw.utils`: Utility functions
- `$tw.modules`: Module system interface
- `$tw.node`: Boolean, true if running under Node.js
- `$tw.browser`: Boolean, true if running in browser

## Tiddler Concepts

A "tiddler" is TiddlyWiki's atomic unit of content. Access via:
- `$tw.wiki.getTiddler(title)` - Get tiddler object
- `$tw.wiki.getTextReference(textRef)` - Get field value
- `$tw.wiki.addTiddler(tiddler)` - Add/update tiddler
- `$tw.wiki.deleteTiddler(title)` - Delete tiddler

## Contributing

- PRs require signed CLA (add name to `licenses/cla-individual.md` in `tiddlywiki-com` branch)
- PR titles must be imperative mood, ≤50 chars, no period
- Include visual changes as before/after screenshots
- One feature per PR
- Run tests and linting before submitting
- See [contributing.md](contributing.md) for full guidelines

## Key Files for Understanding

- [boot/boot.js](boot/boot.js) - Bootstrap and module loading
- [core/modules/wiki.js](core/modules/wiki.js) - Wiki store operations
- [core/modules/widgets/widget.js](core/modules/widgets/widget.js) - Widget base class
- [core/modules/startup/load-modules.js](core/modules/startup/load-modules.js) - Module initialization
- [tiddlywiki.js](tiddlywiki.js) - Entry point for CLI
