/*\
title: exactExports/program.js
type: application/javascript
module-type: library

ExactExports test

\*/



var test = require('test');
var a = require('./a');
test.assert(a.program() === exports, 'exact exports');
test.print('DONE', 'info');

