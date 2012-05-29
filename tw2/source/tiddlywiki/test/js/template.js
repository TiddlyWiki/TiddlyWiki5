jQuery(document).ready(function() {
	module("<module>");

	test("<section>", function() {
		var actual, expected;

		actual = <...>;
		expected = <...>;
		same(actual, expected, "<message>");
	});
});
