/*\
title: test.js
type: application/javascript
module-type: library

testing lib

\*/


exports.assert = function(cond, msg) {
  if(!cond) {
    if(msg) {
		throw msg
	} else {
		throw "ASSERT FAILED"
	}
  }
}

exports.print = function() {
  console.log.apply(console, arguments);
}
