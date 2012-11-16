jQuery(document).ready(function() {
	module("File System");

	test("convertUTF8ToUnicode", function() {
		var actual, expected, str;

		str = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

		actual = convertUTF8ToUnicode(str);
		expected = str;
		same(actual, expected, "ASCII characters should remain unchanged when converted from UTF8 to Unicode using convert");
	});

	test("manualConvertUTF8ToUnicode", function() {
		var actual, expected, str;

		str = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

		actual = manualConvertUTF8ToUnicode(str);
		expected = str;
		same(actual, expected, "ASCII characters should remain unchanged when converted from UTF8 to Unicode manually");
	});

	test("convertUnicodeToUTF8", function() {
		var actual, expected, str;

		str = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

		actual = convertUnicodeToUTF8(str);
		expected = str;
		same(actual, expected, "ASCII characters should remain unchanged when converted from Unicode to UTF8 using convert");
	});

	test("manualConvertUnicodeToUTF8", function() {
		var actual, expected, str;

		str = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

		actual = manualConvertUnicodeToUTF8(str);
		expected = str;
		same(actual, expected, "ASCII characters should remain unchanged when converted from Unicode to UTF8 manually");
	});

	/* XXX: this test does not work
	test("round trip conversion from UTF8 to Unicode and back", function() {
		var actual, expected, str;

		str = "\u007f\u0080";

		actual = convertUTF8ToUnicode(convertUnicodeToUTF8(str));
		expected = str;
		same(actual, expected, "characters should remain unchanged when converted from Unicode to UTF8 and back to Unicode");
	});
	*/
});
