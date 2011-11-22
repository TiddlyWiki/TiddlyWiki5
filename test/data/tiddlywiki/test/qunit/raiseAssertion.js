/*
 * extension of the QUnit framework to support exception handling
 * cf. http://dev.jquery.com/ticket/4318
 */

(function($) {

$.extend(window, {
	raises: raises
});

/**
 * Checks that the given expression throws an exception of the expected type, with an optional message.
 *
 * @example raises( function() { return foo.bar; }, "TypeError", "invalid property access raises TypeError exception" );
 *
 * @param Function expression
 * @param String expected exception type
 * @param String message (optional)
 */
function raises(expression, expected, message) {
	try {
		push(false, expression(), expected, message);
	} catch(ex) {
		push(ex.name == expected, ex.name, expected, message);
	}
}

// duplicated private function from testrunner.js
function push(result, actual, expected, message) {
	message = message || (result ? "okay" : "failed");
	QUnit.ok( result, result ? message + ": " + expected : message + ", expected: " + jsDump.parse(expected) + " result: " + jsDump.parse(actual) );
}

})(jQuery);
