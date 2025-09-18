/*\
title: $:/plugins/tiddlywiki/core-compressor/startup.js
type: application/javascript
module-type: startup

Core compressor initialisation

\*/

"use strict";

// Export name and synchronous status
exports.name = "core-compressor";
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function () {
    if ($tw.node) require("$:/plugins/tiddlywiki/core-compressor/register-node.js").registerNode($tw);
    const ourCompressor = $tw.Wiki.pluginSerializerModules["application/vnd.json.gz"];
    if (!ourCompressor) return;
    const core = $tw.wiki.getTiddler("$:/core");
    const coredata = $tw.Wiki.pluginSerializerModules[core.fields.type].parse(core);
    const text = ourCompressor.stringify(core.fields, coredata);
    $tw.wiki.addTiddler(Object.assign({}, core.fields, { text: text, type: "application/vnd.json.gz", }));
};
