/*\
title: transitive/program.js
type: application/javascript
module-type: library

Transitive test

\*/

const test = require('test');
test.assert(require('./a').foo() == 1,'transitive');
test.print('DONE','info');

