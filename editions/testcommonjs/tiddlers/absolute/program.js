/*\
title: absolute/program.js
type: application/javascript
module-type: library

Absolute require test

\*/


const test = require('test');
const a = require('./submodule/a');
const b = require('./b');
test.assert(a.foo().foo === b.foo,'require works with absolute identifiers');
test.print('DONE','info');

