// <![CDATA[

describe('Mock: testing framework mock functions', {
	before_each : function() {
	    mock_me = function() {
		return "ha-ha!";
	    }
	    mock_me2 = function() {
		return "tee-hee!";
	    }
	    tests_mock_test_var1 = "original value 1";
	    tests_mock_test_var2 = "original value 2";
	},
	'mocking a function restores orignial function afterwards' : function() { 
		tests_mock.before('mock_me');
		tests_mock.after('mock_me');
		value_of(mock_me()).should_be("ha-ha!");
	},
	'not calling a mocked function returns 0' : function() { 
		tests_mock.before('mock_me');
		value_of(tests_mock.after('mock_me').called).should_be(0);
	},
	'calling a mocked function once returns 1' : function() { 
		tests_mock.before('mock_me');
		mock_me();
		value_of(tests_mock.after('mock_me').called).should_be(1);
	},
	'calling a mocked function 1001 times returns 1001' : function() { 
		tests_mock.before('mock_me');
		for (var i=0; i<1001;i++)
		    mock_me();
		value_of(tests_mock.after('mock_me').called).should_be(1001);
	},
	'shouldn\'t be able to mock a non-existant function' : function() { 
		var caught = "no error";
		try { tests_mock.before('nonexistant_function') } catch(e) { caught = e.message }
		value_of(caught).should_match(/nonexistant_function/);
	},
	'mocked function should be able to return a hard-coded value' : function() { 
		tests_mock.before('mock_me', function() { return "hoho" });
		var returnValue = mock_me();
		value_of(tests_mock.after('mock_me').called).should_be(1);
		value_of(returnValue).should_be('hoho');
	},
	'mocked function should be able to process passed arguments' : function() { 
		tests_mock.before('mock_me', function(p1,p2,p3,p4,p5) { return p1+p2+p3+p4+p5 });
		var returnValue = mock_me(5,3,2,99,101);
		var returnValue2 = mock_me(9,10,0,0,1);
		value_of(tests_mock.after('mock_me').called).should_be(2);
		value_of(returnValue).should_be(210);
		value_of(returnValue2).should_be(20);
	},
	'should be able to mock more than one function at a time' : function() { 
		tests_mock.before('mock_me', function() { return "called1" });
		tests_mock.before('mock_me2', function() { return "called2" });
		var returnValue = mock_me();
		var returnValue2 = mock_me2();
		value_of(returnValue).should_be('called1');
		value_of(returnValue2).should_be('called2');
	},
	'mocked functions should have independent counters' : function() { 
		tests_mock.before('mock_me');
		tests_mock.before('mock_me2');
		mock_me();
		for (var i=0; i<1001;i++) {
		    mock_me();
		    mock_me2();
		}
		mock_me();
		value_of(tests_mock.after('mock_me').called).should_be(1003);
		value_of(tests_mock.after('mock_me2').called).should_be(1001);
	},
	'saving a global variable restores orignial value afterwards' : function() { 
		var original = tests_mock_test_var1;
		tests_mock.save('tests_mock_test_var1');
		tests_mock_test_var1 = "foo foo foo";
		tests_mock.restore();
		value_of(tests_mock_test_var1).should_be(original);
	},
});

// ]]>
