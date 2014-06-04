#[tw5-jsxgraph-widget](https://kpe.github.io/tw5-jsxgraph-widget/)

JSXGraph Widget for TiddlyWiki5 (requires 5.0.13+)

#[Usage](https://kpe.github.io/tw5-jsxgraph-widget/)

In your tiddler use the ```jsxgraph``` widget like this:

```
<$jsxgraph width="600px" height="400px">
var brd = JXG.JSXGraph.initBoard('ignored',
           {axis:true,originX: 250, originY: 250, unitX: 50, unitY: 25});
...
</$jsxgraph>
```

Note that the first argument to ```initBoard()``` will be ignored.

Check the demo at [$:/plugins/kpe/jsxgraph/jsxgraph.demo.tid]($:/plugins/kpe/jsxgraph/jsxgraph.demo.tid).

# Dev notes
When updating [jsxgraphcore.js](https://raw.githubusercontent.com/jsxgraph/jsxgraph/master/distrib/jsxgraphcore.js)
consider, that the distribution of [JSXGraph](https://raw.githubusercontent.com/jsxgraph/jsxgraph/master/distrib/jsxgraphcore.js) uses 
requirejs through almond, and it somehow does not load properly in node's CommonJS.
 
As a workaround replace the

    require("../build/core.deps.js")}();

at the end of the last line with:

    module.exports = require("../build/core.deps.js")}();

