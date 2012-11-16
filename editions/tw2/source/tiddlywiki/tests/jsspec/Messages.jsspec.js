// <![CDATA[
function getMessage() {
	return msgArea.getElementsByTagName("div")[1].innerHTML;
}

describe('displayMessage', 
{	
	before_each: function() {
		msgArea = createTiddlyElement(document.body,"div","messageArea");
		msgArea.style.visibility = "hidden";	},	
	after_each: function() {
		removeNode(msgArea);
	},
	'should raise an alert if the messageArea element does not exist': function() {
		msgArea.id = "messageArea_disabled";
		var text = "alert this text!";
		tests_mock.before('alert', function() { 
		    tests_mock.frame['alert'].args = arguments;
		});
		displayMessage(text);
		frame = tests_mock.after('alert');
		value_of(frame.called).should_be(1);	
		value_of(frame.args[0]).should_be(text);	
	},
	'should put single letter "s" into the message area': function() {
		var text = "s";
		displayMessage(text);
		var actual = getMessage();		
		value_of(actual).should_be(text);	
	},
	'should put text into the message area': function() {
		var text = "The quick brown fox jumps over the lazy dog";
		displayMessage(text);
		var actual = getMessage();		
		value_of(actual).should_be(text);	
	}
});

// ]]>
