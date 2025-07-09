/*\
title: cyclic/program.js
type: application/javascript
module-type: library

Cycle require test

\*/



const test = require('test');
const a = require('./a');
const b = require('./b');

test.assert(a.a,'a exists');
test.assert(b.b,'b exists');
test.assert(a.a().b === b.b,'a gets b');
test.assert(b.b().a === a.a,'b gets a');

test.print('DONE','info');

