// <![CDATA[

describe('XML: testing framework XML functions', {
	'parsing XML returns an object' : function() { 
                xml = tests_xml.parse('<foo><bar></bar></foo>');
                value_of(typeof xml).should_match('object');
	},
        'documentElement should be an object' : function() { 
                xml = tests_xml.parse('<foo><bar></bar></foo>');
                value_of(typeof xml.documentElement).should_be("object");
        },
        'DOM should be able to access documentElement nodeName' : function() { 
                xml = tests_xml.parse('<foo><bar></bar></foo>');
                value_of(xml.documentElement.nodeName).should_be("foo");
        },
        'DOM should be able to access documentElement nodeName from empty document' : function() { 
                xml = tests_xml.parse('<foo/>');
                value_of(xml.documentElement.nodeName).should_be("foo");
        },
        'DOM should be able to access attribute on document node' : function() { 
                xml = tests_xml.parse('<foo version="2.0"></foo>');
                value_of(xml.documentElement.getAttribute("version")).should_be("2.0");
        },
        'XPath should be able to access the documentElement' : function() { 
                xml = tests_xml.parse('<foo>hello</foo>');
		value_of(xml.xpath("/foo", "string")).should_be("hello");
        },
        'XPath should be able to access the documentElement' : function() { 
                xml = tests_xml.parse('<foo>hello<bar>world</bar></foo>');
		value_of(xml.xpath("/foo/bar", "string")).should_be("world");
        },
        'XPath count of nodeset containing elements' : function() { 
                xml = tests_xml.parse('<foo><bar/><bar/><bar/></foo>');
		value_of(xml.xpath("count(/foo/bar)", "number")).should_be(3);
        }
});

// ]]>
