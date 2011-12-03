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
