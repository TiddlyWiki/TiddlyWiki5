/*\
title: relative/program.js
type: application/javascript
module-type: library

Relative test

\*/


const test = require('test');
const a = require('submodule/a');
const b = require('submodule/b');
test.assert(a.foo == b.foo,'a and b share foo through a relative require');
test.print('DONE','info');

