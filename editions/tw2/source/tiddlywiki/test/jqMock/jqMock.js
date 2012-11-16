/*
 * jqMock - The JavaScript Mock framework for jQuery / jqUnit 
 * http://code.google.com/p/jqmock/
 * version 1.1
 * 
 * Copyright 2008 Kenneth Ko, under the GNU Lesser General Public License
 *
 * By Kenneth Ko
 * http://longgoldenears.blogspot.com/
 * 
 * ==================================================================
 * Release Notes:
 * --------------
 * version 1.1
 *  - [3] change behaviour of verify() to NOT check unexpected invocations
 *        (note: it does check unexpected invocations of calls which were setup as expectations)
 *  - [3] added verifyAll() method which will check unexpected invocations
 *  - [4] added new assertion method to check for exceptions being thrown, expectThatExceptionThrown()
 *  - [4] added new expression to help assert the exception, is.exception({name: ... , message: ..., type: ...})
 *  - refactoring, ArgExpectation has been internally renamed to Expression
 *
 * version 1.01
 *  - [1] [2] bug fixes: circular references
 *
 * version 1.0
 *  - initial release
* 
 */
 
var jqMock = jqMock || {};

(function ($) {
	//======== Utils =============
	function _isObjExpected(actual, expected, oneway, rchain) {					
		oneway = oneway || false;
		rchain = rchain || [] ; // holds elements already compared in the recursion, to prevent circular references
		if (actual === expected) {
			return true;
		} else if (expected instanceof Expression) {
			return expected.assert(actual);
		} else if (actual===null || expected===null) {
			return false;
		} else if (actual instanceof Array && expected instanceof Array) {
			// array compare
			if (actual.length != expected.length)
				return false;
			for(var i=0; i<actual.length; i++) {
				var result = _recurseIsObjExpected(actual[i], expected[i], oneway, rchain, expected[i]);
				if (!result) return false;
			
				//if (!_isObjExpected(actual[i],expected[i]))
				//	return false;
			}
			return true;
		} else if (typeof actual == "object" && typeof expected == "object") {
			// object compare, both ways
			for(var i in expected) {
				var result = _recurseIsObjExpected(actual[i], expected[i], oneway, rchain, expected[i]);
				if (!result) return false;
				//	if ( !_isObjExpected(actual[i], expected[i]))
				//		return false;				
			}
			if (!oneway) {
				for(var i in actual) {
					if ( !_isObjExpected(actual[i], expected[i]))
						return false;
				}
			}
			return true;
		} else {
			return false;
		}
	};
	
	function _recurseIsObjExpected(actual, expected, oneway, rchain, loopvar) {
		if (typeof loopvar == "object") {
			for(var i=0; i<rchain.length; i++) {
				if (loopvar===rchain[i])
					throw new Error("Circular Reference detected in the object!");
			}
			var chainCount = rchain.length;			
			rchain.push(loopvar);		
			var result = _isObjExpected(actual, expected, oneway, rchain);
			rchain.splice(chainCount);
			return result;	
		} else {
			return _isObjExpected(actual, expected, oneway, rchain);
		}
	}
	
	function assertThat(actual, expected, msg) {
		var result = actual===expected || _isObjExpected(actual, expected);
		msg = (msg ? msg + ": " : "");
		msg += (result ? "actual matched expectation" : "object did not match expectation, actual: " + tostring(actual) + ", expected: " + tostring(expected));
		ok(result, msg);
	};
	var MAX_DEPTH = 100;
	function tostring(obj, rchain) {
		
		rchain = rchain || [];
		if (rchain.length > MAX_DEPTH)
			return ".....";
		if (typeof obj=="object") {
			for(var a=0; a<rchain.length; a++) {
				if (obj==rchain[a]) {
					return "...";					
				}
			}
		}
		rchain.push(obj);
		var rchainCount = rchain.length;
		
		var result = [];
		if (obj === null) {
			return "null";
		} else if (obj === undefined) {
			return "undefined";
		} else if (obj instanceof Array) {
			result.push("[");
			for(var j=0; j<obj.length; j++) {
				result.push(tostring(obj[j], rchain));
				result.push(",");
			}
			if (obj.length>0)
				result[result.length-1] = "]";
			else
				result.push("]");
		} else if (obj instanceof Expression) {
			return obj.tostring();
		} else if (obj instanceof Error) {
			// for errors, only print name and message (don't want stack)
			var err = {};
			if ("name" in obj) err.name = obj.name;
			if ("message" in obj) err.message = obj.message;
			return tostring(err, rchain);
		} else if ($.isFunction(obj)) {
		//} else if (typeof obj == "function") {
			return "function()";
		} else if (typeof obj == "object") {
			result.push("{");
			for(var i in obj) {
				if (/^__/.test(i)) continue;
				result.push(i);
				result.push(":");
				result.push(tostring(obj[i], rchain));
				result.push(",");
			}
			result[result.length==1 ? result.length : result.length-1] = "}";
		} else {
			result.push(typeof obj == "string" ? "'" : "");		
			result.push(obj);
			result.push(typeof obj == "string" ? "'" : "");		
		}
		rchain.splice(rchainCount);
		return result.join("");					
	};	
	function _getClassName(clz) {
		return $.trim(clz.toString()).match(/^function\s(.*)\(/)[1];
	}
	function expectThatExceptionThrown(fn, expression) {
		try {
			fn();
			ok(false, "The expected exception was never thrown. Expression was: " + tostring(expression)); 
		} catch(ex) {
			assertThat(ex, expression, "expected exception matching " + tostring(expression) + " to be thrown"); 
		}
	};
	//======== Modifier =============
	function Modifier(fnName, _origFn) {
		this._fnName = fnName;
		this._origFn = _origFn;
		this._args = [];  // default no arg
		this._multiplicity = MultiplicityFactory.exactly(1); // default of 1
		this._returnValue = undefined;
		this._returnValueSpecified = false;
		this._exception = null;
		this._matchCount = 0;
	}
	Modifier.prototype.args = function() {
		var expectedArgs = Array.prototype.slice.call(arguments);
		this._args = expectedArgs; 
		return this;
	};
	Modifier.prototype.multiplicity = function(m) {
		if (m instanceof Multiplicity)
			this._multiplicity = m;
		else if (typeof m == "number")
			this._multiplicity = MultiplicityFactory.exactly(m);
		else
			throw new Error("Invalid argument for multiplicity()");
		return this;
	};	
	Modifier.prototype.returnValue = function(rv) {
		this._returnValueSpecified = true;
		if (typeof rv != "undefined")
			this._returnValue = rv;
	};
	Modifier.prototype.throwException = function(ex) {
		this._exception = ex;
	};
	var MATCHRESULT_does_not_match = -1;
	var MATCHRESULT_matched_but_disabled = 0;
	var MATCHRESULT_matched = 1;
	Modifier.prototype.matches = function(actualArgs) {
		var b = true;
		var expectedArgs = this._args;
		if (expectedArgs.length==0) {
			// handle no argument
			b = (actualArgs.length==0);
		} else if (expectedArgs.length == actualArgs.length) {
			for(var i=0; i<expectedArgs.length; i++) {
				if (!_isObjExpected(actualArgs[i], expectedArgs[i])) {
					b = false;
					break;
				}
			}
		} else {
			b = false;
		}
		if(!b)
			return MATCHRESULT_does_not_match; // does not match args
		else if (this._multiplicity.isDisabled)
			return MATCHRESULT_matched_but_disabled; // matches args, but disabled
		else {
			this._multiplicity.verify(++this._matchCount);
			return MATCHRESULT_matched; // matches args, and still enabled.
		}
	};
	Modifier.prototype.doAction = function(scope, args) {
		if (this._returnValueSpecified) {
			return this._returnValue;
		} else if (this._exception) {
			throw this._exception;
		} else {
			return this._origFn.apply(scope, args);
		}	
	};	
	Modifier.prototype.satisfied = function() {
		return this._multiplicity.satisfied;
	};	
	Modifier.prototype.tostring = function() {
		return [
			(this._multiplicity.satisfied ? "&nbsp;&nbsp;&nbsp;" : "&rarr;"),
			this._matchCount, " ",
			this._multiplicity.tostring(), " ",
			this._fnName, "(",
			tostring(this._args).replace(/^\[(.*)\]$/, "$1"), 
			")"
		].join("");
	};
	// ======= Multiplicity ===============
	var MultiplicityType = {
		EXACTLY:0,
		ATLEAST:1,
		ATMOST:2,
		RANGE:3		
	};
	function Multiplicity(type, lower, upper, initiallySatisfied) {
		this.type = type;
		this.lower = lower;
		this.upper = upper;
		this.satisfied = initiallySatisfied;
		this.isDisabled = false;
	};
	Multiplicity.prototype.verify = function(count) {
		this.satisfied = (count >= this.lower & count <= this.upper);
		this.isDisabled = (count >= this.upper);
	};
	Multiplicity.prototype.tostring = function() {
		if (this.type==MultiplicityType.EXACTLY) {
			return "(" + this.lower + ")";
		} else {
			return [
				"(", this.lower, "..", 
				(this.upper==Infinity ? "*" : this.upper),")"
			].join("");
		}
	};
	var MultiplicityFactory = {	
		exactly : function(n) {
			if (n==0) {
				// zero is actually atMost(0)
				return new Multiplicity(MultiplicityType.ATMOST, 0, 0, true);
			} else {
				return new Multiplicity(MultiplicityType.EXACTLY, n, n, false);
			}
		},	
		times : function(n,m) {
			if (arguments.length == 1) {
				return new Multiplicity(MultiplicityType.EXACTLY, n, n, false);
			} else {
				if (n==0)
					// (0..m) is actually atMost(m)
					return new Multiplicity(MultiplicityType.ATMOST, 0, m, true);
				else
					return new Multiplicity(MultiplicityType.RANGE, n, m, false);
			}
		},
		atLeast : function(n) {
			return new Multiplicity(MultiplicityType.ATLEAST, n, Infinity, false);
		},
		atMost : function(n) {
			return new Multiplicity(MultiplicityType.ATMOST, 0, n, true);
		}
	};	
	// ======= Expression ===============
	var ExpressionType = {
		ANYTHING:0,
		NOT:1,
		INSTANCEOF:2,
		SUPERSET:3,
		REGEX:4,
		ANYOF:5,
		ALLOF:6,
		CUSTOM: 7,
		ERROR:8
	};
	function Expression(type, param) {
		this.type = type;
		this.param = param;
	};	
	Expression.prototype.assert = function(actual) {
		switch(this.type) {
			case ExpressionType.ANYTHING:
				return true;
			case ExpressionType.NOT:
				return !_isObjExpected(actual, this.param);
			case ExpressionType.INSTANCEOF:
				return actual instanceof this.param;				
			case ExpressionType.SUPERSET:
				return _isObjExpected(actual, this.param, true);
			case ExpressionType.REGEX:
				return this.param.test(actual);
			case ExpressionType.ANYOF:
				for(var i=0; i<this.param.length; i++) {
					if (_isObjExpected(actual, this.param[i]))
						return true;
				}
				return false;
			case ExpressionType.ALLOF:
				for(var i=0; i<this.param.length; i++) {
					if (!_isObjExpected(actual, this.param[i]))
						return false;
				}
				return true;	
			case ExpressionType.CUSTOM:	
				return this.param(actual);
			case ExpressionType.ERROR:
				var exOk = true;
				if ("name" in this.param)
					exOk = exOk && (this.param.name === actual.name);
				if ("message" in this.param)
					exOk = exOk && (this.param.message === actual.message);
				if ("type" in this.param)  // type= is.instanceOf(Class)
					exOk = exOk && (_isObjExpected(actual, this.param.type));
				return exOk;
		}	
	};
	Expression.prototype.tostring = function() {
		switch(this.type) {
			case ExpressionType.ANYTHING:
				return "is.anything";
			case ExpressionType.NOT:
				return "is.not(" + tostring(this.param) +")";
			case ExpressionType.INSTANCEOF:
				//return "is.instanceOf(" + $.trim(this.param.toString()).match(/^function\s(.*)\(/)[1] +")";
				return "is.instanceOf(" + _getClassName(this.param) +")";
			case ExpressionType.SUPERSET:
				return "is.objectThatIncludes(" + tostring(this.param) +")";
			case ExpressionType.REGEX:
				return "is.regex(" + this.param.toString() +")";
			case ExpressionType.ANYOF:
				return "is.anyOf(" + tostring(this.param) +")";		
			case ExpressionType.ALLOF:
				return "is.allOf(" + tostring(this.param) +")";					
			case ExpressionType.CUSTOM:
				return "is.custom(function)";
			case ExpressionType.ERROR:
				if (_isObjExpected(this.param, {}))
					return "is.exception()";
				else
					return "is.exception(" + tostring(this.param) +")";		
		}
	};
	var ExpressionFactory = {
		anything : new Expression(ExpressionType.ANYTHING),
		not: function(param) {
			return new Expression(ExpressionType.NOT, param);
		},
		instanceOf: function(param) {
			if (!$.isFunction(param))
				throw new Error("Invalid argument to is.instanceOf() , argument must be a Class");
			return new Expression(ExpressionType.INSTANCEOF, param);
		},
		objectThatIncludes: function(param) {
			return new Expression(ExpressionType.SUPERSET, param);
		},
		regex: function(param) {
			if (!(param instanceof RegExp))
				throw new Error("Invalid argument to is.regex() , argument must be regex");
			return new Expression(ExpressionType.REGEX, param);
		},
		anyOf: function(param) {
			if (!(param instanceof Array))
				throw new Error("Invalid argument to is.anyOf() , argument must be an Array");
			return new Expression(ExpressionType.ANYOF, param);
		},
		allOf: function(param) {
			if (!(param instanceof Array))
				throw new Error("Invalid argument to is.allOf() , argument must be an Array");
			return new Expression(ExpressionType.ALLOF, param);
		},
		custom: function(param) {
			if (!$.isFunction(param))
				throw new Error("Invalid argument to is.custom() , argument must be a Function that returns a boolean value");
			return new Expression(ExpressionType.CUSTOM, param);
		},
		exception: function(param) {
			if (typeof param == "string")
				return new Expression(ExpressionType.ERROR, {message: param});
			if (typeof param == "undefined")
				param = {};
			if (typeof param != "object")
				throw new Error("Invalid argument to is.exception() , argument must be an object or string");
			if ("type" in param && !$.isFunction(param["type"]))
				throw new Error("Invalid argument to is.exception() , the type attribute of the parameter must be a Class");
			if ("type" in param)  // convert type to is.instanceof()
				param.type = new Expression(ExpressionType.INSTANCEOF, param.type);
			return new Expression(ExpressionType.ERROR, param);
		}
	};
	// ======= Mock ==============
	function Mock(obj, fnName) {
		var _unmatched = [];
		var _modifiers = [];
		var _obj = obj;
		var _fnName = fnName;	
		var _isOrdered = false;
		var _oep = 0; // ordered expectation pointer
		var _oef = false;  // ordered expectation has failed
		
		if (obj ==undefined || obj[fnName] == undefined) {
			throw new Error("Could not create Mock: the object or function you specified is not defined, obj." + fnName);
		}
		if (!$.isFunction(obj[fnName])) {
			throw new Error("Could not create Mock: " + fnName + " is not a function");
		}
		var intercept = function() {
			var matchedModifier;
			var matchResult;
			// ordered expectations
			if (_isOrdered) {
				if (!_oef) {
					matchResult = _modifiers[_oep].matches(arguments);
					if (matchResult == MATCHRESULT_matched) {
						matchedModifier = _modifiers[_oep];
					} else {
						_oep++;						
						if (_modifiers.length > _oep) {
							matchResult = _modifiers[_oep].matches(arguments);
							if (matchResult == MATCHRESULT_matched) {
								matchedModifier = _modifiers[_oep];
							}
						}
					}
				}
				if (matchedModifier === undefined)
					_oef = true;	
			} else {
				// unordered expectations, matches first one
				for(var i=0; i<_modifiers.length; i++) {
					matchResult = _modifiers[i].matches(arguments);
					if (matchResult == MATCHRESULT_matched) {
						matchedModifier = _modifiers[i];
						break;
					}
				}
			}
			
			if (matchedModifier)
				return matchedModifier.doAction(this, arguments);
				
			// store the unmatched expectation as an error string
			var actualArgs = Array.prototype.slice.call(arguments);
			var unmatchedMsg = fnName + "(" + tostring(actualArgs).replace(/^\[(.*)\]$/, "$1") + ")";
			_unmatched.push( {'matchResult': matchResult, 'msg': unmatchedMsg} );
		};
		if (!obj[fnName].isMock) {
			var _origFn = obj[fnName];
			obj[fnName] = intercept;		
			obj[fnName].isMock = true;
		} else {
			throw new Error("Could not create Mock: you tried to overwrite a function which is already a mock!");
		}
		this.reset = function() {
			_oep = 0;
			_oef = false;		
			for(var i=0; i<_modifiers.length; i++)
				delete _modifiers[i];
			_modifiers = [];
			for(var i=0; i<_unmatched.length; i++)
				delete _unmatched[i];
			_unmatched = [];			
		};
		this.restore = function() {
			this.reset();
			_obj[_fnName] = _origFn;
		};
		this.modify = function() {
			_modifiers.push(new Modifier(_fnName, _origFn));
			return _modifiers[_modifiers.length-1];
		};
		this.setOrdered = function(b) {
			_isOrdered = b;
		};
		// check that all expectations satisfied
		var _verify = function(verifyUnmatched) {
			if (_modifiers.length > 0) {
				var b = true;
				for(var i=0; i<_modifiers.length; i++) {
					if (!_modifiers[i].satisfied()){
						b = false;
						break;					
					}
				}
				// unsatisfied expectations
				var msg = "";				
				if (!b) {
					msg += (_isOrdered ? "Ordered" : "Unordered") + " expectations have not yet been satisfied:<br/>";
					for(var i=0; i<_modifiers.length; i++) {
						msg += _modifiers[i].tostring() + "<br/>";
					}
				}
				
				if (_unmatched.length>0) {
					// unmatched expectations, when using verifyAll()
					if (verifyUnmatched) {
						b = false;
						msg += "No expectation matched for the following calls:<br/>"
						for(var i=0; i<_unmatched.length; i++) {
							msg += _unmatched[i].msg + "<br/>";
						}
					// unmatched expectations, when using verify()
					} else {
						var msg1 = "";
						for(var i=0; i<_unmatched.length; i++) {
							if (_unmatched[i].matchResult == MATCHRESULT_matched_but_disabled)
								msg1 += _unmatched[i].msg + "<br/>";
						}
						if (msg1.length>0) {
							msg += "No expectation matched for the following calls which were setup as expectations:<br/>" + msg1;
							b = false;
						}
					}
				}
				
				if (msg=="")
					msg = _modifiers.length + " expectations were satisfied";
				
				ok(b, msg);
			} else {
				throw new Error("Expectation setup error. You must set up some expectations");
			}
		};
		this.verify = function() {
			_verify(false);
		};
		this.verifyAll = function() {
			_verify(true);
		};		
	};
	//=====changed expect to expects as window.expect exists in qunit==============
	function addShortcut() {
		if (window.expects || window.is)
			throw new Error("Cannot add shortcuts, expect() or is() already exists in global scope!");
		expects = jqMock.expects;
		is = jqMock.is;
	};
	//===================
	$.extend(jqMock, {
		assertThat: assertThat,
		tostring: tostring,
		expectThatExceptionThrown: expectThatExceptionThrown,
		Mock: Mock,
		// changed expect to expects
		expects: MultiplicityFactory,
		is: ExpressionFactory,
		addShortcut: addShortcut
	});	
}) (jQuery);
