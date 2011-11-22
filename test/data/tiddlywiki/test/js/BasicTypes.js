jQuery(document).ready(function() {
	module("Basic Types");

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

	test("Array indexOf", function() {
		var actual, expected;

		actual = typeof [].indexOf;
		expected = "function";
		same(actual, expected, "method exists");

		actual = ["foo", "bar", "baz"].indexOf("bar");
		expected = 1;
		same(actual, expected, "returns element postion");

		actual = ["foo", "bar"].indexOf("baz");
		expected = -1;
		same(actual, expected, "returns -1 if element not present");

		actual = ["foo", "bar", "baz"].indexOf("baz", 1);
		expected = 2;
		same(actual, expected, "returns element position if element is present within given range");

		actual = ["foo", "bar", "baz"].indexOf("foo", 1);
		expected = -1;
		same(actual, expected, "returns -1 if element is not present within given range");
	});

	test("Array findByField", function() {
		var actual, expected;

		var L = [{ foo: "lorem", bar: "ipsum" }, { bar: "dolor", baz: "sit" }, { bar: "dolor" }];

		actual = L.findByField();
		expected = 0;
		same(actual, expected, "returns 0 if no arguments are specified"); // XXX: not actually desired; cf. ticket #964

		actual = L.findByField("bar", "dolor");
		expected = 1;
		same(actual, expected, "returns position of first matching element");

		actual = L.findByField("bar", "xxx");
		expected = null;
		same(actual, expected, "returns null if no match was found"); // XXX: not actually desired; cf. ticket #966

	});

	test("Array contains", function() {
		var actual, expected;

		var L = ["foo", "bar", "baz", "bar"];

		actual = L.contains();
		expected = false;
		same(actual, expected, "returns false if no arguments are specified");

		actual = L.contains("bar");
		expected = true;
		same(actual, expected, "returns true if a matching element was found");

		actual = L.contains("xxx");
		expected = false;
		same(actual, expected, "returns false if no matching element was found");
	});

	test("Array containsAny", function() {
		var actual, expression, expected;

		var L = ["foo", "bar", "baz"];

		expression = function() { L.containsAny(); };
		expected = "TypeError";
		raises(expression, expected, "raises exception if no arguments are specified");

		actual = L.containsAny("foo");
		expected = false;
		same(actual, expected, "returns false if argument is not an array"); // XXX: not actually desired!?

		actual = L.containsAny(["lorem", "bar"]);
		expected = true;
		same(actual, expected, "returns true if a matching item has been found");

		actual = L.containsAny(["lorem", "ipsum"]);
		expected = false;
		same(actual, expected, "returns false if no matching item has been found");
	});

	test("Array containsAll", function() {
		var actual, expression, expected;

		var L = ["foo", "bar", "baz"];

		expression = function() { L.containsAll(); };
		expected = "TypeError";
		raises(expression, expected, "raises exception if no arguments are specified");

		actual = L.containsAll("foo");
		expected = false;
		same(actual, expected, "returns false if argument is not an array"); // XXX: not actually desired!?

		actual = L.containsAll(["foo", "bar"]);
		expected = true;
		same(actual, expected, "returns true if all given items have been found");

		actual = L.containsAll(["lorem", "bar"]);
		expected = false;
		same(actual, expected, "returns false if not all given items have been found");
	});

	test("Array pushUnique", function() {
		var actual, expected;

		/* XXX: behavior currently undefined
		actual = ["foo", "bar"];
		actual.pushUnique();
		expected = ["foo", "bar"];
		same(actual, expected, "does not modify array if no arguments are specified");
		*/

		actual = ["foo", "bar"];
		actual.pushUnique("baz");
		expected = ["foo", "bar", "baz"];
		same(actual, expected, "appends given item to original array, provided an identical element is not present yet");

		actual = ["foo", "bar", "baz"];
		actual.pushUnique("baz");
		expected = ["foo", "bar", "baz"];
		same(actual, expected, "does not modify original array if given item is already present");

		actual = [{ foo: "lorem" }, { bar: "ipsum" }];
		actual.pushUnique({ bar: "ipsum" });
		expected = [{ foo: "lorem" }, { bar: "ipsum" }, { bar: "ipsum" }];
		same(actual, expected, "appends given item to original array if it is an object (deep comparison is not supported)"); // XXX: not actually desired!? -- cf. #606
	});

	test("Array remove", function() {
		var actual, expected, L;

		actual = ["foo", "bar", "baz"];
		actual.remove();
		expected = ["foo", "bar", "baz"];
		same(actual, expected, "does not modify original array if no arguments are specified");

		actual = ["foo", "bar", "baz"];
		actual.remove("bar");
		expected = ["foo", "baz"];
		same(actual, expected, "removes given item from original array, provided such an element is present");

		actual = ["foo", "bar", "baz"];
		actual.remove("lorem");
		expected = ["foo", "bar", "baz"];
		same(actual, expected, "does not modify original array if given item is not present");

		actual = [{ foo: "lorem" }, { bar: "ipsum" }];
		actual.remove({ bar: "ipsum" });
		expected = [{ foo: "lorem" }, { bar: "ipsum" }];
		same(actual, expected, "does not modify original array if given item is an object (deep comparison is not supported)"); // XXX: not actually desired!? -- cf. #606
	});

	test("Array setItem", function() {
		var actual, expected;

		actual = ["foo", "bar", "baz"];
		actual.setItem();
		expected = ["foo", "bar", "baz"];
		same(actual, expected, "does not modify array if no arguments are specified");

		actual = ["foo", "bar", "baz"];
		actual.setItem("foo");
		expected = ["foo", "bar", "baz"];
		same(actual, expected, "does not modify original array if mode is not specified");

		actual = ["foo", "bar"];
		actual.setItem("baz", 0);
		expected = ["foo", "bar", "baz"];
		same(actual, expected, "appends given item to original array if mode is 0 and element is not present");

		actual = ["foo", "bar", "baz"];
		actual.setItem("bar", 0);
		expected = ["foo", "baz"];
		same(actual, expected, "removes given item from original array if mode 0 and element is present");

		actual = ["foo", "bar"];
		actual.setItem("baz", +1);
		expected = ["foo", "bar", "baz"];
		same(actual, expected, "appends given item to original array if mode is +1 and element is not present");

		actual = ["foo", "bar"];
		actual.setItem("bar", +1);
		expected = ["foo", "bar"];
		same(actual, expected, "does not modify original array if mode is +1 and element is present");

		actual = ["foo", "bar", "baz"];
		actual.setItem("bar", -1);
		expected = ["foo", "baz"];
		same(actual, expected, "removes given item from original array if mode is -1 and element is present");

		actual = ["foo", "bar"];
		actual.setItem("baz", -1);
		expected = ["foo", "bar"];
		same(actual, expected, "does not modify original array if mode is -1 and element is not present");
	});

	test("Array map", function() {
		var actual, expected, L;

		L = ["foo", "lorem", "amet"];

		actual = L.map(function(item, i) {
			return item.substr(2, 1);
		});
		expected = ["o", "r", "e"];
		same(actual, expected, "returns an array of elements defined by the specified callback");

		actual = L.map(function(item, i) {
			return item.length + i;
		});
		expected = [3, 6, 6];
		same(actual, expected, "passes element value and index to the callback");
	});
});
