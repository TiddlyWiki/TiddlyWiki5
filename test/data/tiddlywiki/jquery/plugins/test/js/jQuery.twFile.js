jQuery(document).ready(function() {
	module("jQuery.twFile");

	test("load", function() {
		var actual, expected, filepath;

		actual = jQuery.twFile.load();
		expected = null;
		same(actual, expected, "returns null if no argument is specified");

		filepath = getDocumentPath() + "/sample.txt";
		actual = jQuery.twFile.load(filepath);
		expected = "lorem ipsum\n" +
			"dolor sit amet\n" +
			"\n" +
			" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~\n" +
			"foo bar baz\n";
		same(actual, expected, "returns contents of specified file");

		filepath = "/null";
		actual = jQuery.twFile.load(filepath);
		expected = null;
		same(actual, expected, "returns null if the specified file does not exist");

		filepath = "sample.txt";
		actual = jQuery.twFile.load(filepath);
		expected = null;
		same(actual, expected, "returns null if specified file path is not absolute");
	});

	test("save", function() {
		var actual, expression, expected, str;
		var filepath = getDocumentPath() + "/savetest.txt";

		/* disabled as browser-level exceptions cannot be trapped
		expression = function() { jQuery.twFile.save(); };
		expected = "ReferenceError";
		raises(expression, expected, "raises exception if no argument is specified");
		*/

		/* disabled as browser-level exceptions cannot be trapped
		expression = function() { jQuery.twFile.save(filepath); };
		expected = "TypeError";
		raises(expression, expected, "raises exception if no content argument is specified");
		*/

		/* disabled as browser-level exceptions cannot be trapped
		expression = function() { jQuery.twFile.save("foo.txt", "sample content"); };
		expected = "ReferenceError";
		raises(expression, expected, "raises exception if specified file path is not absolute");
		*/

		str = "lorem ipsum\n" +
			"dolor sit amet\n" +
			"\n" +
			" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~\n" +
			//"\xa9\u010d\u010c\n" +
			"foo bar baz\n" +
			(new Date).toString();
		saveAndLoadString(filepath, str, "writes given ANSI text content to specified file");

		//str = "\xa9\u010d\u010c";
		//saveAndLoadString(filepath, str, "writes given UTF-8 text content to specified file");

		//jQuery.twFile.save(filepath, ""); // teardown: blank file contents (deletion impossible)
	});

	// helper function to save and load back a string to a file
	var saveAndLoadString = function(filepath,str,desc) {
		jQuery.twFile.save(filepath, str);
		var actual = jQuery.twFile.load(filepath);
		same(actual, str, desc);
	}

	// helper function to retrieve current document's file path
	var getDocumentPath = function() {
		var path = document.location.pathname;
		var startpos = 0;
		var endpos = path.lastIndexOf("/");
		if(path.charAt(2) == ":") {
			startpos = 1;
			path = path.replace(new RegExp("/","g"),"\\")
		}
		return unescape(path.substring(startpos, endpos));
	};
});
