jQuery(document).ready(function() {
	module("Numbers");

	test("Number clamp", function() {
		var actual, expected;

		actual = (99).clamp();
		expected = 99;
		same(actual, expected, "returns original number if no arguments are specified");

		actual = (11).clamp(20);
		expected = 20;
		same(actual, expected, "if only one argument is specified, uses it as minimum");

		actual = (55).clamp(20, 80);
		expected = 55;
		same(actual, expected, "returns original number if it is between minimum and maximum");

		actual = (11).clamp(20, 80);
		expected = 20;
		same(actual, expected, "returns minimum if number is smaller than minimum");

		actual = (99).clamp(20, 80);
		expected = 80;
		same(actual, expected, "returns maximum if number is greater than maximum");
	});

});
