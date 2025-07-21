/*\
title: determinism/program.js
type: application/javascript
module-type: library

Determinism test

\*/


const test = require('test');
require('submodule/a');
test.print('DONE','info');

