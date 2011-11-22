jQuery(document).ready(function() {
	module("LoadingSaving");


	test("load", function() {
		var actual, expected, filepath;

		actual = loadFile();
		expected = null;
		same(actual, expected, "returns null if no argument is specified");

		filepath = getDocumentPath() + "/sample.txt";
		var s = loadFile(filepath);
		// if the java saver was used then it will have done the unicode conversion.
		actual = window.netscape ? convertUTF8ToUnicode(s) : s;
		expected = "lorem ipsum\n" +
			"dolor sit amet\n" +
			"\n" +
			' !"#$%&' + "'()*+,-./0123456789:;<=>?\n" +
			"@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\n" +
			"\xa9\u010d\u010c\n" +
			"foo bar baz\n";
		//if(!config.browser.isOpera && window.netscape)
		if(!(config.browser.isChrome && config.browser.isMac))
			same(actual, expected, "returns contents of specified file");

		filepath = "/null";
		actual = loadFile(filepath);
		ok(actual==null || actual=="undefined", "returns null if the specified file does not exist");

		filepath = "sample.txt";
		actual = loadFile(filepath);
		ok(actual==null || actual=="undefined", "returns null if specified file path is not absolute");
	});

	test("save", function() {
		var actual, expression, expected, str;
		var filepath = getDocumentPath() + "/savetest.txt";

		/* disabled as browser-level exceptions cannot be trapped
		expression = function() { saveFile(); };
		expected = "ReferenceError";
		raises(expression, expected, "raises exception if no argument is specified");
		*/

		/* disabled as browser-level exceptions cannot be trapped
		expression = function() { saveFile(filepath); };
		expected = "TypeError";
		raises(expression, expected, "raises exception if no content argument is specified");
		*/

		/* disabled as browser-level exceptions cannot be trapped
		expression = function() { saveFile("foo.txt", "sample content"); };
		expected = "ReferenceError";
		raises(expression, expected, "raises exception if specified file path is not absolute");
		*/

		str = "lorem ipsum\n" +
			"dolor sit amet\n" +
			"\n" +
			" !#$%&'\"()*+,-./0123456789:;<=>?\n" +
			"@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\n" +
			"\xa9\u010d\u010c\n" +
			"foo bar baz\n" +
			(new Date).toString();
		saveAndLoadString(filepath, str, "X writes given ANSI text content to specified file");

		var str2 = "\xa9\u010d\u010c";
		saveAndLoadString(filepath, str2, "Y writes given UTF-8 text content to specified file");

		//saveFile(filepath, ""); // teardown: blank file contents (deletion impossible)
	});

	// helper function to save and load back a string to a file
	var saveAndLoadString = function(filepath,str,desc) {
		if(config.browser.isChrome && config.browser.isMac) {
		    return true;
		}
		saveFile(filepath, convertUnicodeToUTF8(str)); // => entities if IE
		var s = loadFile(filepath);
		// if the java saver was used then it will have done the unicode conversion.
		var actual = window.netscape ? convertUTF8ToUnicode(s) : s;
		//var expected = config.browser.isOpera || !window.netscape ? convertUnicodeToHtmlEntities(str) : str;
		var expected = config.browser.isIE ? convertUnicodeToHtmlEntities(str) : str;
		same(actual, expected, desc);
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
