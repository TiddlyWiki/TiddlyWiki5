/*\
title: method/program.js
type: application/javascript
module-type: library

Method test

\*/


const test = require('test');
const a = require('./a');
const {foo} = a;
test.assert(a.foo() == a,'calling a module member');
test.assert(foo() == (function() {return this;})(),'members not implicitly bound');
a.set(10);
test.assert(a.get() == 10,'get and set');
test.print('DONE','info');

