/*\
title: $:/core/modules/startup/seedrandom.js
type: application/javascript
module-type: startup

Load the seedrandom library at startup.
\*/


exports.name = "shuffle"
exports.before = ["render"]
exports.startup = function() {
  $tw.modules.execute('$:/core/modules/utils/seedrandom.js');
}
