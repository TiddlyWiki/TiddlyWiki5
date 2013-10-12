/*\
title: determinism/program.js
type: application/javascript
module-type: library

Determinism test

\*/


var test = require('test');
require('submodule/a');
test.print('DONE', 'info');

