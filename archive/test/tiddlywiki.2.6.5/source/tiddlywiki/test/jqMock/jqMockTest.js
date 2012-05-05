jQuery(document).ready(function(){
	
	module("PASS");
	
	test("without shortcut", function() {    
		var myObj = {sayHello:function(){}};
	    var mock = new jqMock.Mock(myObj, "sayHello");
	    mock.modify().args(jqMock.is.anyOf(["Lisa","Bart","Maggie"]));
	    mock.modify().args("Homer").multiplicity(jqMock.expects.atLeast(1));    
	    myObj.sayHello("Lisa");    
	    myObj.sayHello("Homer");    
	    mock.verifyAll();
	});
	
	jqMock.addShortcut();
	
	test("mocking native dialog", function() {
		var confirmMock = new jqMock.Mock(window, "confirm");
		confirmMock.modify().args("are you sure?").returnValue(true);
		confirmMock.modify().args("are you sure 2?").returnValue(false);
		var b1 = confirm("are you sure?");
		ok(b1, "should be true");
		var b2 = confirm("are you sure 2?");
		ok(!b2, "should be true (2)");	
		confirmMock.verifyAll();
		confirmMock.restore();
		
		var alertMock = new jqMock.Mock(window, "alert");
		alertMock.modify().args("are you sure?").returnValue();
		alert("are you sure?");
		alertMock.verifyAll();
		alertMock.restore();
	});
	
	test("args() expectation", function() {
	
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
		
		mock.modify().args(16);
		mock.modify().args([4,5,6]);
		var obj = {a:'a', b: ['x', 'y'], func : function() {}};
		mock.modify().args(obj);
		mock.modify().args(null);
		mock.modify().args(undefined);
		mock.modify().args(16,[4,5,6], obj);
		mock.modify(); // default no arg, multiplicity 1
		
		var objActual = {a:3, fn:function(){}, b:{x:'x',y:'y'}};
		var objExpect = {b:{x:'x',y:'y'}, a:3, fn:is.anything};
		mock.modify().args(objExpect);
		myobj.fn(objActual);
		
		myobj.fn(16);
		myobj.fn([4,5,6]);
		myobj.fn(obj);
		myobj.fn(null);
		myobj.fn();
		var b;
		myobj.fn(b);
		myobj.fn(16,[4,5,6], obj);
		
		mock.verifyAll();
	});
	
	test("Expression is()", function() {
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
		
		mock.modify().args(is.anything).multiplicity(4);
		myobj.fn("a");
		myobj.fn(3);
		myobj.fn([1,2,3]);
		myobj.fn({a:[1,2,3],b:{c:'c'}});
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args({a:'apple', x: is.anything, b:'banana'}).multiplicity(2);
		myobj.fn({a:'apple', x: 'xxx', b:'banana'});
		myobj.fn({a:'apple', b:'banana'});
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args(is.not('x')).multiplicity(4);
		myobj.fn("y");
		myobj.fn(1);
		myobj.fn(['x','y']);
		myobj.fn({x:'x', y:'y'});
		mock.verifyAll();
		mock.reset();
		
		var MyObject = function MyObject(){};
		mock.modify().args(is.instanceOf(MyObject));
		mock.modify().args(is.instanceOf(Array));
		myobj.fn(new MyObject());
		myobj.fn([1,2,3]);
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args(is.not(null));
		mock.modify().args(is.not(undefined));	
		myobj.fn("something");
		myobj.fn(null);
		mock.verifyAll();
		mock.reset();	
		
		mock.modify().args(is.objectThatIncludes({a:'apple', b:'banana'}));
		myobj.fn({a:'apple', fn:function(){}, b:'banana'});
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args(is.regex(/^abc[0-9]*xyz$/));
		mock.modify().args(is.not(is.regex(/[0-9]/)));
		myobj.fn("abc12345xyz");
		myobj.fn("abc");
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args(is.anyOf(["a", "b", "c",null, undefined])).multiplicity(5);
		myobj.fn("a");
		myobj.fn(null);
		myobj.fn("c");
		myobj.fn(undefined);
		myobj.fn("b");
		mock.verifyAll();
		mock.reset();	
		
		mock.modify().args(is.allOf([is.not("a"), is.not("b")])).multiplicity(2);
		mock.modify().args(is.allOf([is.not(null), is.not(undefined)]));
		myobj.fn("x");
		myobj.fn("y");
		myobj.fn("z");
		mock.verifyAll();
		mock.reset();
			
		var isEven = function(arg) {
			return arg % 2 == 0 ;
		};
		mock.modify().args(is.custom(isEven)).multiplicity(3);
		myobj.fn(2);
		myobj.fn(4);
		myobj.fn(6);
		mock.verifyAll();
		mock.reset();	
	});
	
	test("expectation resolution", function() {
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
		
		mock.modify().args(is.not('x'));
		mock.modify().args(is.not('y')); 
		mock.modify().args(is.anything);
		myobj.fn(1);
		myobj.fn(2);
		myobj.fn(3);
		mock.verifyAll();
		mock.reset();
		
		// this is an RMock behaviour.
		mock.modify().multiplicity(2).args(is.not("y"));
		mock.modify().multiplicity(expects.atLeast(2)).args("x");
		for(var i=0; i<4; i++) myobj.fn("x");
		mock.verifyAll();
		mock.reset();
		
		mock.modify().multiplicity(expects.times(2,3)).args("x");
		mock.modify().multiplicity(expects.exactly(1)).args(is.not("y"));
		mock.modify().multiplicity(expects.atMost(1)).args("x");
		for(var i=0; i<5; i++) myobj.fn("x");
		mock.verifyAll();
		mock.reset();	
	});
	
	test("ordered expectations", function() {
	
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
		mock.setOrdered(true);
		
		mock.modify().args(1);
		mock.modify().args(2);
		mock.modify().args(3);
		myobj.fn(1);
		myobj.fn(2);
		myobj.fn(3);
		mock.verifyAll();
		mock.reset();	
		
		mock.modify().args(4);
		myobj.fn(4);
		mock.verifyAll();
		mock.reset();	
		
		mock.modify().args('x');
		mock.modify().args('y');
		mock.modify().args('x');
		myobj.fn('x');
		myobj.fn('y');
		myobj.fn('x');
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args(is.anything);
		mock.modify().args(is.not('y'));
		mock.modify().args(is.instanceOf(Array));
		myobj.fn({});
		myobj.fn('x');
		myobj.fn([1,2,3]);
		mock.verifyAll();
		mock.reset();		
	});
	
	test("unexpected invocation, but using verify() only", function() {
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");	
		mock.modify().args(1);
		mock.modify().args(2);
		mock.modify().args(3);
		myobj.fn(3);
		myobj.fn(2);
		myobj.fn(5);  // unexpected, but we dont check
		myobj.fn(4);  // unexpected, but we dont check
		myobj.fn(1);
		mock.verify();
	});
	
	test("returnValue and intercepting", function() {
		var myobj = {sum:function(a,b){return a+b;}};
		var mock = new jqMock.Mock(myobj, "sum");
		mock.modify().args(5,6).returnValue(100);  // change the returnValue
		mock.modify().args(5,6); // don't intercept
		equals(myobj.sum(5,6) , 100);
		equals(myobj.sum(5,6) , 11);
		mock.restore();
		equals(myobj.sum(11,12) , 23);
	});
	
	test("throwException", function() {
		expect(2);
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
		mock.modify().args().throwException("my exception");
		var myError = new Error("some error");
		mock.modify().args(1).throwException(myError);	
		try {
			myobj.fn();
		} catch (ex) {
			equals(ex, "my exception");
		}
		try {
			myobj.fn(1);
		} catch (ex) {
			equals(ex.message, "some error");
		}	
	});
	
	test("multiplicity", function() {
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
	
		mock.modify().args().multiplicity(expects.exactly(1));
		mock.modify().args('a').multiplicity(expects.times(3));
		mock.modify().args('c').multiplicity(2);
		mock.modify().args('b','bbb').multiplicity(expects.times(2,3));
		mock.modify().args({p:'p'},[7,8]);
		mock.modify().args('y').multiplicity(expects.atLeast(1));
		mock.modify().args('z').multiplicity(expects.atMost(4));	
		mock.modify().args('foo').multiplicity(expects.atMost(0));
		mock.modify().args('zero1').multiplicity(0);
		mock.modify().args('zero2').multiplicity(expects.exactly(0));
		mock.modify().args('zero3').multiplicity(expects.times(0,2));
	
		myobj.fn({p:'p'},[7,8]);
		myobj.fn('a');
		myobj.fn();
		myobj.fn('a');		
		myobj.fn('a');
		myobj.fn('c');
		myobj.fn('c');
		myobj.fn('b','bbb');
		myobj.fn('z');	
		myobj.fn('y');	
		myobj.fn('y');	
		myobj.fn('b','bbb');
		myobj.fn('z');	
		myobj.fn('z');	
		myobj.fn('z');	
		mock.verifyAll();
		mock.reset();
	});
	
	test("tostring", function() {
		equals(jqMock.tostring(3), "3");
		equals(jqMock.tostring("a"), "'a'");
		equals(jqMock.tostring([]), "[]");
		equals(jqMock.tostring([1,2,3]), "[1,2,3]");
		equals(jqMock.tostring([1,2,"x"]), "[1,2,'x']");	
		equals(jqMock.tostring(function(){}), "function()");
		equals(jqMock.tostring({}), "{}");
		equals(jqMock.tostring({a:1,b:2,c:'cc'}), "{a:1,b:2,c:'cc'}");
		var x;
		equals(jqMock.tostring(x), "undefined");
		equals(jqMock.tostring(null), "null");
	
		equals(jqMock.tostring(is.anything), "is.anything");
		equals(jqMock.tostring(is.not('x')), "is.not('x')");
		equals(jqMock.tostring(is.instanceOf(Array)), "is.instanceOf(Array)");
		equals(jqMock.tostring(is.objectThatIncludes({a:'a'})), "is.objectThatIncludes({a:'a'})");
		equals(jqMock.tostring(is.regex(/^[0-9]*/)), "is.regex(/^[0-9]*/)");
		equals(jqMock.tostring(is.anyOf([is.not('a'), is.not('b')])), "is.anyOf([is.not('a'),is.not('b')])");
		equals(jqMock.tostring(is.allOf([is.not(null), is.not(undefined)])), "is.allOf([is.not(null),is.not(undefined)])");
		equals(jqMock.tostring(is.exception({name: "ReferenceError", message: "blah is not defined", type: ReferenceError})), "is.exception({name:'ReferenceError',message:'blah is not defined',type:is.instanceOf(ReferenceError)})");
		equals(jqMock.tostring(is.exception("foo")), "is.exception({message:'foo'})");
		
		// NOTE: rhino has error during for(var i : obj) which returns the wrong ordering due to HashMap implementation
		var obj = {c:{x:'x',y:['xx',99]}, d:[1,2,{p:'p',q:5}], fn:function(){}, a:3, b:'bob'};
		var objStr = "{c:{x:'x',y:['xx',99]},d:[1,2,{p:'p',q:5}],fn:function(),a:3,b:'bob'}"
		equals(jqMock.tostring(obj), objStr);
	});
	
	test("circular reference", function() {
		var a={}; 
		var b={};
		var x1={'x':a};
		var x2={'x':b};
		a['x'] = x1;		 
		b['x'] = x2;
	
		var aa=[]; 
		var bb=[];
		var xx1=[aa];
		var xx2=[bb];
		aa[0] = xx1;		 
		bb[0] = xx2;			
				
		expect(6);
	
		equals(jqMock.tostring(a), "{x:{x:...}}");
		equals(jqMock.tostring(aa), "[[...]]");
			
		try {
			jqMock.assertThat(a,b);
		} catch (ex) {
			equals(ex.message, "Circular Reference detected in the object!", "ciruclar ref in object");
		}
		try {
			jqMock.assertThat(a,b);
		} catch (ex) {
			equals(ex.message, "Circular Reference detected in the object!", "ciruclar ref in object");
		}
		try {
			var myobj = {fn:function(){}};
			var mock = new jqMock.Mock(myobj, "fn");
			mock.modify().args(a).multiplicity(1);
			myobj.fn(b);
		} catch (ex) {
			equals(ex.message, "Circular Reference detected in the object!", "ciruclar ref in object");
		}
		try {
			var myobj = {fn:function(){}};
			var mock = new jqMock.Mock(myobj, "fn");
			mock.modify().args(aa).multiplicity(1);
			myobj.fn(bb);
		} catch (ex) {
			equals(ex.message, "Circular Reference detected in the object!", "ciruclar ref in object");
		}
	});
	
	test("object assertion", function() {
		jqMock.assertThat(window, window, "assertThat(window), reference equality");
		jqMock.assertThat(3,3);
		jqMock.assertThat("a","a");
		jqMock.assertThat([1,2,3],[1,2,3]);	
		jqMock.assertThat({},{}, "{}");
		jqMock.assertThat([{a:'a'},{b:'b',d:'d'}],[{a:'a'},{d:'d', b:'b'}]);
		jqMock.assertThat({b:'b',x:[1,2,3],d:'d'},{d:'d',x:[1,2,3],b:'b'});
		var fn = function(n) {return n+1;};
		jqMock.assertThat(fn, fn);
		
		var objActual = {a:3, b:{x:'x',y:'y'}, c:[7,8,9]};
		var objExpect = {b:{x:'x',y:'y'}, c:[7,8,9], a:3};
		jqMock.assertThat(objActual,objExpect);
		
		jqMock.assertThat([1,2,3], is.instanceOf(Array));
		jqMock.assertThat("foo", is.anyOf(['foo','bar']));
		jqMock.assertThat({x:'x', a:'a', y:'y'}, is.objectThatIncludes({a:'a'}));
		
		jqMock.assertThat(new Error("booya"), is.exception("booya"), "is.exception");
	});
	
	test("expectThatExceptionThrown", function() {
		// simple compare
		jqMock.expectThatExceptionThrown(function() {
			throw "blah";
		}, "blah");
		// using expression
		jqMock.expectThatExceptionThrown(function() {
			throw new Error("booya");
		}, is.allOf([is.instanceOf(Error), is.objectThatIncludes({'message':'booya'})]));	
		// using is.exception expression
		jqMock.expectThatExceptionThrown(function() {
			throw {"message":"bad exception"};
		}, is.exception({message: "bad exception"}));	
		jqMock.expectThatExceptionThrown(function() {
			throw new Error("bad exception 2");
		}, is.exception("bad exception 2"));		
		jqMock.expectThatExceptionThrown(function() {
			eval("blah");
		}, is.exception({name: "ReferenceError", message: "blah is not defined", type: ReferenceError}));
		function MyUserException (message) {
		  this.message=message;
		  this.name="UserException";
		}
		jqMock.expectThatExceptionThrown(function() {
			throw new MyUserException("booya");
		}, is.exception({name: "UserException", message: "booya", type: MyUserException}));
		// just that some expression is thrown
		jqMock.expectThatExceptionThrown(function() {
			throw new Error("anything");
		}, is.exception());	
	});
	
	test("error handling", function() {
		expect(15);
		var obj = {x:'x'};
		try {
			new jqMock.Mock(obj, "x");
		} catch(ex) {
			equals(ex.message, "Could not create Mock: x is not a function", "exception should be thrown");
		}
		var obj2;
		try {
			new jqMock.Mock(obj2, "x");
		} catch(ex) {
			equals( ex.message, "Could not create Mock: the object or function you specified is not defined, obj.x", "exception should be thrown");
		}	
		var obj3 = {};
		try {
			new jqMock.Mock(obj3, "x");
		} catch(ex) {
			equals(ex.message, "Could not create Mock: the object or function you specified is not defined, obj.x", "exception should be thrown");
		}
		var obj4 = {fn:function(){}};
		try {
			var mock = new jqMock.Mock(obj4, "fn");
			mock.verify();
		} catch(ex) {
			equals(ex.message, "Expectation setup error. You must set up some expectations", "exception should be thrown");
		}
		var alertMock = new jqMock.Mock(window, "alert");
		try {		
			ok(window.alert.isMock, "flag should be set");
			new jqMock.Mock(window, "alert");		
		} catch(ex) {
			equals(ex.message, "Could not create Mock: you tried to overwrite a function which is already a mock!", "exception should be thrown");
		}
		alertMock.restore();
		
		var obj5 = {fn:function(){}};
		var mock5 = new jqMock.Mock(obj5, "fn");
		try {
			mock5.modify().args(is.instanceOf('x'));
		} catch(ex) {
			equals(ex.message, "Invalid argument to is.instanceOf() , argument must be a Class", "exception should be thrown");
		}
		try {
			mock5.modify().args(is.regex('x'));
		} catch(ex) {
			equals(ex.message, "Invalid argument to is.regex() , argument must be regex", "exception should be thrown");
		}
		try {
			mock5.modify().args(is.anyOf('x'));
		} catch(ex) {
			equals(ex.message, "Invalid argument to is.anyOf() , argument must be an Array", "exception should be thrown");
		}
		try {
			mock5.modify().args(is.allOf('x'));
		} catch(ex) {
			equals(ex.message, "Invalid argument to is.allOf() , argument must be an Array", "exception should be thrown");
		}
		try {
			mock5.modify().args(is.custom('x'));
		} catch(ex) {
			equals(ex.message, "Invalid argument to is.custom() , argument must be a Function that returns a boolean value", "exception should be thrown");
		}
		try {
			mock5.modify().multiplicity("x");
		} catch(ex) {
			equals(ex.message, "Invalid argument for multiplicity()", "exception should be thrown");
		}
			
		try {
			jqMock.addShortcut();
		} catch(ex) {
			equals(ex.message, "Cannot add shortcuts, expect() or is() already exists in global scope!", "exception should be thrown");	
		}	
	
		try {
			is.exception(0);
		} catch(ex) {
			equals(ex.message, "Invalid argument to is.exception() , argument must be an object or string");
		}
		
		try {
			is.exception({type:'foo'});
		} catch(ex) {
			equals(ex.message, "Invalid argument to is.exception() , the type attribute of the parameter must be a Class");
		}
	});
	
	//====================================================================
	// The following tests check the failure behaviour of jqMock.
	// After running tests that record failures through the framework,
	// this code will scrape the resulting HTML to check the failures.
	// Note: does not support the drilldown doubleclick view
	//====================================================================
	
	var counter = 15; // number of tests in PASS module above
	
	var assertFailureCallbacks = []
	function assertFailure(callback) {
		assertFailureCallbacks.push(callback);
	}
	function assertFailMessages(expectedMessages) {
		var allAssertionsPassed = true;
		var createSpan = function(passes) {
			return $("<span></span>")
				.css("color", passes ? "green" : "#FF6E1F")
				.text(passes? " [PASS]" : " [FAIL]");
		};
		var testResult = $('ol#tests>li').eq(counter++);	
		var assertionResults = testResult.find("ol>li");
		assertionResults.each(function(i,x) {
			var tmp = document.createElement("div");
			tmp.innerHTML = expectedMessages[i];  // because of HTML entities
			var ok = (x.innerHTML==tmp.innerHTML);
			if (!ok) {
				allAssertionsPassed = false;
				if (console && console.error) {
					console.error("[" + counter + "] Actual:\n" + x.innerHTML);
					console.error("[" + counter + "] Expected:\n" + tmp.innerHTML);
				}
			}
			$(x).append(createSpan(ok));
			tmp = null;
		});
		createSpan(allAssertionsPassed).appendTo(testResult.find("strong"));
	}
	$(function() {
		for(var i=0; i<assertFailureCallbacks.length; i++) {
			assertFailureCallbacks[i]();
		}
		// scrape HTML to find fails, ignoring expected failures
		var failed = $('ol#tests>li.fail').filter(function(){
			return $(this).find('strong').text().indexOf(") [PASS]")<0;
		});
		$('h2#banner')[0].className = (failed.length>0 ? "fail" : "pass");
	});
	
	
	var unos = "Unordered expectations have not yet been satisfied:<br>";
	var onos = "Ordered expectations have not yet been satisfied:<br>";
	var noex = "No expectation matched for the following calls:<br>";
	var noex2 = "No expectation matched for the following calls which were setup as expectations:<br>"
	var br = "<br>";
	var s3 = "&nbsp;&nbsp;&nbsp;";
	
	
	// ----------------------  run the tests ----------------------
	module("FAIL");
	
	test("mocking native dialog", function() {
		var alertMock = new jqMock.Mock(window, "alert");
		alertMock.modify().args("some alert");
		window.alert("some other value");		
		alertMock.verifyAll();
		alertMock.restore();
	});
	assertFailure(function() {
		var expected = [];
		expected[0] = unos +
			"&rarr;0 (1) alert('some alert')" + br +
			noex +
			"alert('some other value')" + br;
		assertFailMessages(expected);
	});
	
	
	test("args() expectation", function() {
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
		
		var objActual = {a:3, fn:function(){}, b:{x:'x',y:'y'}};
		var objExpect = {b:{x:'x',y:'zzzzz'}, a:3};
		mock.modify().args(objExpect);
		mock.modify().args(1,2,3);
		mock.modify().args();
		
		myobj.fn(objActual);
		myobj.fn(1,2);
		myobj.fn('foo');
				
		mock.verifyAll();
	});
	assertFailure(function() {
		var expected = [];
		expected[0] = unos +
			"&rarr;0 (1) fn({b:{x:'x',y:'zzzzz'},a:3})" +br+
			"&rarr;0 (1) fn(1,2,3)"+br+
			"&rarr;0 (1) fn()"+br+		
			noex+
			"fn({a:3,fn:function(),b:{x:'x',y:'y'}})"+br+
			"fn(1,2)"+br+
			"fn('foo')"+br;
		assertFailMessages(expected);
	});
	
	
	test("Expression is()", function() {
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
	
		mock.modify().args(is.not('x'));
		mock.verifyAll();
		mock.reset();
		
		var MyObject = function MyObject(){};
		mock.modify().args(is.instanceOf(MyObject));
		mock.modify().args(is.instanceOf(Array));
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args(is.objectThatIncludes({a:'apple', b:'banana'}));
		myobj.fn({a:'apple'});
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args(is.regex(/^[0-9]+/));
		myobj.fn("abc");
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args(is.anyOf(["a", "b", "c"]));
		myobj.fn("d");
		mock.verifyAll();
		mock.reset();	
		
		mock.modify().args(is.allOf([is.not(null), is.not(undefined)]));
		myobj.fn(null);
		myobj.fn(undefined);
		mock.verifyAll();
		mock.reset();
			
		var isEven = function(arg) {
			return arg % 2 == 0 ;
		};
		mock.modify().args(is.custom(isEven)).multiplicity(2);
		myobj.fn(3);
		myobj.fn(2);
		mock.verifyAll();
		mock.reset();
			
	});
	assertFailure(function() {
		var expected = [];
		expected[0] = unos +
			"&rarr;0 (1) fn(is.not('x'))" +br;
		expected[1] = unos +		
			"&rarr;0 (1) fn(is.instanceOf(MyObject))" +br+
			"&rarr;0 (1) fn(is.instanceOf(Array))" +br;	
		expected[2] = unos +	
			"&rarr;0 (1) fn(is.objectThatIncludes({a:'apple',b:'banana'}))" + br+
			noex+
			"fn({a:'apple'})"+ br;
		expected[3] = unos +	
			"&rarr;0 (1) fn(is.regex(/^[0-9]+/))" + br +
			noex+
			"fn('abc')" + br;
		expected[4] = unos +
			"&rarr;0 (1) fn(is.anyOf(['a','b','c']))" + br + 
			noex+
			"fn('d')" + br;
		expected[5] = unos +
			"&rarr;0 (1) fn(is.allOf([is.not(null),is.not(undefined)]))" + br + 
			noex+
			"fn(null)" + br +
			"fn(undefined)" + br;		
		expected[6] = unos +
			"&rarr;1 (2) fn(is.custom(function))" + br + 
			noex+
			"fn(3)" + br;			
		assertFailMessages(expected);
	});
	
	test("expectation resolution", function() {
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
		
		// this is RMock behaviour
		mock.modify().multiplicity(expects.atLeast(2)).args("x"); // atLeast will always match...
		mock.modify().multiplicity(2).args(is.not("y"));         // meaning this will never get matched
		myobj.fn("x");
		myobj.fn("x");
		myobj.fn("x");
		myobj.fn("x");
		mock.verifyAll();
		mock.reset();
		
		// even without verifying unexpected invocations, should fail
		mock.modify().args("x").multiplicity(2);
		myobj.fn("x");
		myobj.fn("x");
		myobj.fn("x");  // 3rd invoc, should fail
		myobj.fn("y");  // since using verify(), should ignore this one
		mock.verify();	
	});
	assertFailure(function() {
		var expected = [];
		expected[0] = unos +
			s3 + "4 (2..*) fn('x')" + br +
			"&rarr;0 (2) fn(is.not('y'))" + br;
		expected[1] = noex2 + "fn('x')" + br;
		assertFailMessages(expected);
	});
	
	
	
	
	test("ordered expectations", function() {
	
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
		mock.setOrdered(true);
		
		mock.modify().args(1);
		mock.modify().args(2);
		mock.modify().args(3);
		myobj.fn(1);
		myobj.fn(3);
		myobj.fn(2);
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args('x');
		mock.modify().args('y');
		mock.modify().args('x');
		myobj.fn('x');
		myobj.fn('x');
		myobj.fn('y');
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args(1);
		mock.modify().args(2);
		mock.modify().args(3);
		myobj.fn(1);
		myobj.fn(3);
		myobj.fn(2);
		mock.verify();  // verify() only
		mock.reset();			
	});
	assertFailure(function() {
		var expected = [];
		expected[0] = onos +
			s3 + "1 (1) fn(1)" + br +
			"&rarr;0 (1) fn(2)" + br+
			"&rarr;0 (1) fn(3)" + br+
			noex+
			"fn(3)" + br+
			"fn(2)" + br;
		expected[1] = onos +
			s3 + "1 (1) fn('x')" + br +
			"&rarr;0 (1) fn('y')" + br+
			"&rarr;0 (1) fn('x')" + br+
			noex+
			"fn('x')" + br+
			"fn('y')" + br;		
		expected[2] = onos +
			s3 + "1 (1) fn(1)" + br +
			"&rarr;0 (1) fn(2)" + br+
			"&rarr;0 (1) fn(3)" + br;	
		assertFailMessages(expected);
	});
	
	
	test("using verify() does not print out unexpected section", function() {
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
		
		var objActual = {a:3, fn:function(){}, b:{x:'x',y:'y'}};
		var objExpect = {b:{x:'x',y:'zzzzz'}, a:3};
		mock.modify().args(objExpect);
		mock.modify().args(1,2,3);
		mock.modify().args();
		
		myobj.fn(objActual);
		myobj.fn(1,2);
		myobj.fn('foo');
				
		mock.verify();
	});
	assertFailure(function() {
		var expected = [];
		expected[0] = unos +
			"&rarr;0 (1) fn({b:{x:'x',y:'zzzzz'},a:3})" +br+
			"&rarr;0 (1) fn(1,2,3)"+br+
			"&rarr;0 (1) fn()"+br;
		assertFailMessages(expected);
	});
	
	
	test("object assertion", function() {
		jqMock.assertThat(1,3);
		jqMock.assertThat(3,"3");
		jqMock.assertThat("b","a");
		jqMock.assertThat([1,2,3],[1,2]);
		jqMock.assertThat([1,2,3],[3,2,1]);
		jqMock.assertThat([1,2,3],[1,2,"x"]);	
		jqMock.assertThat([1,2,3,4,5,6,7],[1,2,"x",4,5,6,7]);
		jqMock.assertThat([1,2,3,4,5,6,7],[1,2,"3",4,5,6,7]);
		jqMock.assertThat({a:'a',b:'b',c:'c'},{a:'a',b:'b'});
		var objActual = {a:3, fn:function(){}, b:{x:'x',y:'y'}};
		var objExpect = {b:{x:'x',y:'zzzzz'}, a:3};
		jqMock.assertThat(objActual,objExpect);
		jqMock.assertThat(3, is.instanceOf(Array));
	});
	assertFailure(function() {
		var expected = [
			"object did not match expectation, actual: 1, expected: 3",
			"object did not match expectation, actual: 3, expected: '3'",
			"object did not match expectation, actual: 'b', expected: 'a'",
			"object did not match expectation, actual: [1,2,3], expected: [1,2]",
			"object did not match expectation, actual: [1,2,3], expected: [3,2,1]",
			"object did not match expectation, actual: [1,2,3], expected: [1,2,'x']",
			"object did not match expectation, actual: [1,2,3,4,5,6,7], expected: [1,2,'x',4,5,6,7]",
			"object did not match expectation, actual: [1,2,3,4,5,6,7], expected: [1,2,'3',4,5,6,7]",
			"object did not match expectation, actual: {a:'a',b:'b',c:'c'}, expected: {a:'a',b:'b'}",
			"object did not match expectation, actual: {a:3,fn:function(),b:{x:'x',y:'y'}}, expected: {b:{x:'x',y:'zzzzz'},a:3}",
			"object did not match expectation, actual: 3, expected: is.instanceOf(Array)"
		];
		assertFailMessages(expected);
	});	
	
	
	  
	  
	test("multiplicity", function() {
		var myobj = {fn:function(){}};
		var mock = new jqMock.Mock(myobj, "fn");
	
		mock.modify().args('x');
		mock.modify().args('y');
		myobj.fn('x');
		myobj.fn('x');
		myobj.fn('y');
		mock.verifyAll();
		mock.reset();
		
		mock.modify().args({a:'alice',b:'bob'});
		mock.modify().args("foobar").multiplicity(expects.atLeast(3));
		mock.modify().args("foo").multiplicity(expects.atMost(1));
		mock.modify().args('a','b', 'c').multiplicity(expects.times(2,3));
		mock.modify().args(123).multiplicity(0);
		
		for (var i=0; i<2; i++) myobj.fn({a:'alice',b:'bob'});
		for (var i=0; i<2; i++) myobj.fn('foobar');
		for (var i=0; i<2; i++) myobj.fn('foo');
		for (var i=0; i<4; i++) myobj.fn('a','b', 'c');
		myobj.fn(123);
		mock.verifyAll();
		mock.reset();
			
	});
	assertFailure(function() {
		var expected = [];
		expected[0] = noex+
			"fn('x')" + br;
		expected[1] = unos +
			s3 + "1 (1) fn({a:'alice',b:'bob'})" + br +
			"&rarr;2 (3..*) fn('foobar')" + br+
			s3 + "1 (0..1) fn('foo')" + br +
			s3 + "3 (2..3) fn('a','b','c')" + br +
			"&rarr;1 (0..0) fn(123)" + br +
			noex+
			"fn({a:'alice',b:'bob'})" + br+
			"fn('foo')" + br +		
			"fn('a','b','c')" + br;
		assertFailMessages(expected);
	});
	
	
	test("expectThatExceptionThrown", function() {
		jqMock.expectThatExceptionThrown(function() {
			//noop
		}, "something");
		
		jqMock.expectThatExceptionThrown(function() {
			throw "foo";
		}, "bar");
		
		jqMock.expectThatExceptionThrown(function() {
			throw new Error("bad exception 2");
		}, is.exception("bad exception 3"));
		
		jqMock.expectThatExceptionThrown(function() {
			eval("blah");
		}, is.exception({type: RangeError}));
		
		// just that some expression is thrown
		jqMock.expectThatExceptionThrown(function() {
			//noop
		}, is.exception());		
	});
	assertFailure(function() {
		var expected = [
			"The expected exception was never thrown. Expression was: 'something'",
			"expected exception matching 'bar' to be thrown: object did not match expectation, actual: 'foo', expected: 'bar'",
			"expected exception matching is.exception({message:'bad exception 3'}) to be thrown: object did not match expectation, actual: {name:'Error',message:'bad exception 2'}, expected: is.exception({message:'bad exception 3'})",
			"expected exception matching is.exception({type:is.instanceOf(RangeError)}) to be thrown: object did not match expectation, actual: {name:'ReferenceError',message:'blah is not defined'}, expected: is.exception({type:is.instanceOf(RangeError)})",
			"The expected exception was never thrown. Expression was: is.exception()"
		];
		assertFailMessages(expected);
	});


});
