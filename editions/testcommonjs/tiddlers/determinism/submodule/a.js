/*\
title: determinism/submodule/a.js
type: application/javascript
module-type: library

Determinism require test A

\*/


var test = require('test');
var pass = false;
var test = require('test');
try {
    require('a');
} catch (exception) {
    pass = true;
}
test.assert(pass, 'require does not fall back to relative modules when absolutes are not available.')

