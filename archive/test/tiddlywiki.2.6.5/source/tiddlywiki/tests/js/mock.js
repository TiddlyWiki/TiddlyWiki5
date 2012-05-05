tests_mock = {
	frame:  {},

	/*
 	 *  replace named global functions with a mock version
	 *  - mock can access original function, and store context in tests_mock.frame[funcName]
	 */
	before: function(funcName,mocker)
	{
		var frame = {};
		frame.called = 0;
		frame.savedFunc = eval(funcName);
		if (typeof frame.savedFunc != "function")
			throw(funcName +" is not a function: " + (typeof frame.savedFunc));

		var mockFunction = function() {
			tests_mock.frame[funcName].called++;
			if (mocker)
			    return mocker.apply(this, arguments);
		};
		eval(funcName + "=mockFunction");

		this.frame[funcName] = frame;
	},

	/*
	 *  restore named global function
	 *  - return frame object, which includes a count of calls
	 */
	after: function(funcName)
	{
		frame = this.frame[funcName];
		eval(funcName + '=frame.savedFunc');
		return frame;
	},

	/*
	 *  save values of named global variables
	 */
	save: function(varName)
	{
		var frame = {};
		frame.restore = true;
		frame.savedValue = eval(varName);
		if (typeof frame.savedValue == "function")
			throw(varName +" is a function: " + (typeof frame.savedValue));

		this.frame[varName] = frame;
	},

	/*
	 *  restore any named global variables
	 */
	restore: function()
	{
		var varName;
		for(varName in this.frame) {
			frame = this.frame[varName];
			if (frame.restore){
			    eval(varName+'=frame.savedValue');
			    frame.restore = false;
			}
		}
	}
};
