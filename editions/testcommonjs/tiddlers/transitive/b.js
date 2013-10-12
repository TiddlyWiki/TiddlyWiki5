/*\
title: transitive/b.js
type: application/javascript
module-type: library

Transitive test B

\*/



exports.foo = require('./c').foo;
