/*\
title: monkeys/program.js
type: application/javascript
module-type: library

Monkeys test

\*/


var a = require('./a');
var test = require('test');
test.assert(exports.monkey == 10, 'monkeys permitted');
test.print('DONE', 'info');

