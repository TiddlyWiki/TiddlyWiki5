/*\
title: nested/program.js
type: application/javascript
module-type: library

Nested test

\*/


var test = require('test');
test.assert(require('a/b/c/d').foo() == 1, 'nested module identifier');
test.print('DONE', 'info');

