jQuery(document).ready(function(){

	module("Tiddler");

	test('constructor', function() {
		var tiddler = new Tiddler("temp");
		var empty = "";
		same(tiddler.text,"",'Newly created tiddler should have empty string as content');
		tiddler = new Tiddler("temp");
		same(tiddler.created,tiddler.modified,'Created and modified dates should be equal for newly created tiddler');
		tiddler = new Tiddler("temp");
		same(tiddler.getTags(),"",'Newly created tiddler should not have any tags');
	});

	test('tiddler.isTouched()', function() {
		var tiddler = new Tiddler("temp");
		same(tiddler.isTouched(),false,'it should return true if the tiddler has been updated since the tiddler was created or downloaded');
		if(!tiddler.fields['changecount'])
			tiddler.fields['changecount'] = 0;
		tiddler.fields['changecount']++;
		same(tiddler.isTouched(),true,'it should return true if the tiddler has been updated since the tiddler was created or downloaded');
	});

	test('tiddler.incChangeCount()', function() {
		var tiddler = new Tiddler("temp");
		same(tiddler.isTouched(),false,'Tiddler changecount should increment by 1 when incChangeCount is called 1');
		tiddler.incChangeCount();
		same(tiddler.isTouched(),true,'Tiddler changecount should increment by 1 when incChangeCount is called 2');
	});

	test('tiddler.clearChangeCount()', function() {
		var tiddler = new Tiddler("temp");
		same(tiddler.isTouched(),false,'Tiddler changecount should be set to 0 when clearChangeCount is called 1');
		tiddler.incChangeCount();
		same(tiddler.isTouched(),true,'Tiddler changecount should be set to 0 when clearChangeCount is called 2');
		tiddler.clearChangeCount();
		same(tiddler.isTouched(),false,'Tiddler changecount should be set to 0 when clearChangeCount is called 3');
	});

	test('tiddler.assign()', function() {
		function newTiddler() {
			var tiddler = new Tiddler("temp");
			tiddler.text = "some text";
			tiddler.modifier = "a modifier";
			tiddler.created = new Date(2008,04,21,01,02,03);
			tiddler.modified = new Date(2009,05,22,12,13,14);
			return tiddler;
		}

		var tiddler = newTiddler();
		tiddler.assign("NewTitle");
		same(tiddler.title,"NewTitle",'Assigning value to tiddler title should override old title 1');
		same(tiddler.text,"some text",'Assigning value to tiddler title should override old title 2');
		same(tiddler.modifier,"a modifier",'Assigning value to tiddler title should override old title 3');
		same(tiddler.created,new Date(2008,04,21,01,02,03),'Assigning value to tiddler title should override old title 4');
		same(tiddler.modified,new Date(2009,05,22,12,13,14),'Assigning value to tiddler title should override old title 5');

		tiddler = newTiddler();
		tiddler.assign(null,"new text");
		same(tiddler.title,"temp",'Assigning value to tiddler text should override old text 1');
		same(tiddler.text,"new text",'Assigning value to tiddler text should override old text 2');
		same(tiddler.modifier,"a modifier",'Assigning value to tiddler text should override old text 3');
		same(tiddler.created,new Date(2008,04,21,01,02,03),'Assigning value to tiddler text should override old text 4');
		same(tiddler.modified,new Date(2009,05,22,12,13,14),'Assigning value to tiddler text should override old text 5');

		tiddler = newTiddler();
		tiddler.assign(null,null,"new modifier");
		same(tiddler.title,"temp",'Assigning value to tiddler modifier should override old modifier 1');
		same(tiddler.text,"some text",'Assigning value to tiddler modifier should override old modifier 2');
		same(tiddler.modifier,"new modifier",'Assigning value to tiddler modifier should override old modifier 3');
		same(tiddler.created,new Date(2008,04,21,01,02,03),'Assigning value to tiddler modifier should override old modifier 4');
		same(tiddler.modified,new Date(2009,05,22,12,13,14),'Assigning value to tiddler modifier should override old modifier 5');

		tiddler = newTiddler();
		tiddler.assign(null,null,null,null,null,new Date(2007,03,20,00,01,02));
		same(tiddler.title,"temp",'Assigning value to tiddler created date should override old created date 1');
		same(tiddler.text,"some text",'Assigning value to tiddler created date should override old created date 2');
		same(tiddler.modifier,"a modifier",'Assigning value to tiddler created date should override old created date 3');
		same(tiddler.created,new Date(2007,03,20,00,01,02),'Assigning value to tiddler created date should override old created date 4');
		same(tiddler.modified,new Date(2009,05,22,12,13,14),'Assigning value to tiddler created date should override old created date 5');

		tiddler = newTiddler();
		tiddler.assign(null,null,null,new Date(2010,06,23,13,14,15));
		same(tiddler.title,"temp",'Assigning value to tiddler modified date should override old modified date 1');
		same(tiddler.text,"some text",'Assigning value to tiddler modified date should override old modified date 2');
		same(tiddler.modifier,"a modifier",'Assigning value to tiddler modified date should override old modified date 3');
		same(tiddler.created,new Date(2008,04,21,01,02,03),'Assigning value to tiddler modified date should override old modified date 4');
		same(tiddler.modified,new Date(2010,06,23,13,14,15),'Assigning value to tiddler modified date should override old modified date 5');
	});
});
