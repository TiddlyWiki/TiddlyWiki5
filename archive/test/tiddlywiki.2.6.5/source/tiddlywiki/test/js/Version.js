jQuery(document).ready(function(){

	module("Utilitis.js");

	test("Version", function() {
		expect(17);

		ok(version,'there should be a version value');
		ok(version.title=='TiddlyWiki','the title should be "TiddlyWiki"');
		ok(parseInt(version.major)!=NaN,'the major value should be a number');
		ok(parseInt(version.minor)!=NaN,'the minor value should be a number');
		ok(parseInt(version.revision)!=NaN,'the revision value should be a number');
		ok(parseInt(version.beta)!=NaN,'the beta value should be a number');
		ok(typeof version.date=='object','the date value should be a TiddlyWiki Date object');
		//ok(version.date.convertToYYYYMMDDHHMM()).should_match(/^\d{12,12}$/);
		ok(typeof version.extensions=='object','the extensions value should be an object');

		var v = {title: "TiddlyWiki", major: 1, minor: 2, revision: 3, beta: 5, date: new Date("Apr 17, 2008"), extensions: {}};
		var expected = "1.2.3 (beta 5)";
		var actual = formatVersion(v);
		ok(actual==expected,'format version 1.2.3 beta 5 should match an asserted string');

		expected = version.major + "." + version.minor + "." + version.revision + (version.alpha ? " (alpha " + version.alpha + ")" : (version.beta ? " (beta " + version.beta + ")" : ""));
		actual = formatVersion();
		ok(actual==expected,'format version should match a constructed value');

		var v1 = {title: "TiddlyWiki", major: 2, minor: 4, revision: 0, beta: 2, date: new Date("Apr 17, 2008"), extensions: {}};
		var v2 = {title: "TiddlyWiki", major: 2, minor: 4, revision: 0, beta: 2, date: new Date("Apr 17, 2008"), extensions: {}};
		ok(compareVersions(v1,v2)==0,'version 2.4.0 beta 2 should equal version 2.4.0 beta 2');

		v1 = {title: "TiddlyWiki", major: 1, minor: 0, revision: 0, date: new Date("Apr 17, 2008"), extensions: {}};
		v2 = {title: "TiddlyWiki", major: 2, minor: 0, revision: 0, date: new Date("Apr 17, 2008"), extensions: {}};
		ok(compareVersions(v1,v2)==1,'version 1.0 should be less than version 2.0');

		v1 = {title: "TiddlyWiki", major: 1, minor: 0, revision: 0, date: new Date("Apr 17, 2008"), extensions: {}};
		v2 = {title: "TiddlyWiki", major: 1, minor: 1, revision: 0, date: new Date("Apr 17, 2008"), extensions: {}};
		ok(compareVersions(v1,v2)==1,'version 1.0 should be less than version 1.1');

		v1 = {title: "TiddlyWiki", major: 1, minor: 0, revision: 0, date: new Date("Apr 17, 2008"), extensions: {}};
		v2 = {title: "TiddlyWiki", major: 1, minor: 0, revision: 1, date: new Date("Apr 17, 2008"), extensions: {}};
		ok(compareVersions(v1,v2)==1,'version 1.0.0 should be less than version 1.0.1');

		v1 = {title: "TiddlyWiki", major: 1, minor: 0, revision: 0, date: new Date("Apr 17, 2008"), extensions: {}};
		v2 = {title: "TiddlyWiki", major: 1, minor: 0, revision: 0, beta: 1, date: new Date("Apr 17, 2008"), extensions: {}};
		ok(compareVersions(v1,v2)==-1,'version 1.0.0 (no beta) should be more than version 1.0.0 beta 1');

		v1 = {title: "TiddlyWiki", major: 1, minor: 0, revision: 0, beta: 1, date: new Date("Apr 17, 2008"), extensions: {}};
		v2 = {title: "TiddlyWiki", major: 1, minor: 0, revision: 0, beta: 2, date: new Date("Apr 17, 2008"), extensions: {}};
		ok(compareVersions(v1,v2)==1,'version 1.0.0 beta 1 should be less than version 1.0.0 beta 2');

		v1 = {title: "TiddlyWiki", major: 1, minor: 2, revision: 3, date: new Date("Apr 17, 2008"), extensions: {}};
		v2 = {title: "TiddlyWiki", major: 1, minor: 2, revision: 3, beta: 4, date: new Date("Apr 17, 2008"), extensions: {}};
		ok(compareVersions(v1,v2)==-1,'version 1.2.3 (no beta) should be more than version 1.2.3 beta 4');

	});


});
