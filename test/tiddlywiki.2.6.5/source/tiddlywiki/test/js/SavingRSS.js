// carried over from jsspec testing
// TBD: refactor out
tests_xml = {

	parse: function(text) {
		var doc;
		if(window.ActiveXObject) {
			doc = new ActiveXObject("Microsoft.XMLDOM");
			doc.async = "false";
			doc.loadXML(text);
		} else {
			var parser = new DOMParser();
			doc = parser.parseFromString(text,"text/xml");
		}
		if(!doc) {
			return null;
		}

		doc.xpath = function(expression, type) {
			var t;

			if(type == "string") { t = XPathResult.STRING_TYPE; }
			if(type == "number") { t = XPathResult.NUMBER_TYPE; }
			if(type == "boolean") { t = XPathResult.BOOLEAN_TYPE; }
			if(type == "singlenode") { t = XPathResult.SINGLENODE_TYPE; }

			var res = this.evaluate(expression, this, null, t, null);

			if(type == "string") { return res.stringValue; }
			if(type == "number") { return res.numberValue; }
			if(type == "boolean") { return res.booleanValue; }
			if(type == "singleNode") { return this.singleNodeValue; }
			return null;
		};

		return doc;
	}
};

jQuery(document).ready(function(){

	var _username;
	module("GenerateRss", {
		setup: function() {
			_username = config.options.txtUserName;
			config.options.txtUserName = "YourName";
		},
		teardown: function() {
			config.options.txtUserName = _username;
		}
	});

	/*
		<rss version="2.0">
		<channel>
			<title>My TiddlyWiki</title>
			<link>http://www.tiddlywiki.com/</link>
			<description>a reusable non-linear personal web notebook</description>
			<language>en-us</language>
			<copyright>Copyright 2008 YourName</copyright>
			<pubDate>Tue, 15 Apr 2008 11:11:50 GMT</pubDate>
			<lastBuildDate>Tue, 15 Apr 2008 11:11:50 GMT</lastBuildDate>
			<docs>http://blogs.law.harvard.edu/tech/rss</docs>
			<generator>TiddlyWiki 2.4.0</generator>
		</channel>
		</rss>
	*/
	test("generateRss: feed for an empty store", function() {

		var actual, expected;
		var rss = generateRss();

		actual = (typeof rss);
		expected = 'string';
		same(actual, expected, 'produces a string value');

		// <?xml version='1.0'?>
		// <?xml version="1.0" ?>
		// <?xml version="1.0" encoding='utf-8' ?>
		actual = rss.match(new RegExp(/^<\?xml\s+version=(["'])1.0\1\s*(encoding=(["'])utf-8\2)?\s*\?>/));
		ok(actual, 'should start with an XML 1.0 declaration');

		xml = tests_xml.parse(rss);
		actual = typeof xml;
		expected = 'object';
		same(actual, expected, 'should be well-formed XML');

		actual = xml.documentElement.nodeName;
		expected = "rss";
		same(actual, expected, 'document node should be "rss"');

		actual = xml.documentElement.getAttribute("version");
		expected = "2.0";
		same(actual, expected, 'rss version should be "2.0"');

		actual = xml.xpath("count(/rss/channel)", "number");
		expected = 1;
		same(actual, expected, 'document should have a single channel element');

		actual = xml.xpath("/rss/channel/title", "string");
		expected = 'My TiddlyWiki';
		same(actual, expected, 'channel title should be the default TiddlyWiki title');

		actual = xml.xpath("/rss/channel/description", "string");
		expected = 'a reusable non-linear personal web notebook';
		same(actual, expected, 'channel description should be the default TiddlyWiki subtitle');

		actual = xml.xpath("/rss/channel/language", "string");
		expected = 'en';
		same(actual, expected, 'channel language should be "en"');

		// Y2K+99 issue
		var message = xml.xpath("/rss/channel/copyright", "string");
		actual = message.match(new RegExp(/Copyright 20[0-9]{2,2} YourName/));
		ok(actual, 'channel copyright should be "TiddlyWiki YYYY YourName"');
	});
});
