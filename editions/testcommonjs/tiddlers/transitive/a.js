/*\
title: transitive/a.js
type: application/javascript
module-type: library

Transitive test A

\*/

exports.foo = require('./b').foo;

