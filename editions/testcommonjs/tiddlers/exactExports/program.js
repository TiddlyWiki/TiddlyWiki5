/*\
title: exactExports/program.js
type: application/javascript
module-type: library

ExactExports test

\*/



const test = require('test');
const a = require('./a');
test.assert(a.program() === exports,'exact exports');
test.print('DONE','info');

