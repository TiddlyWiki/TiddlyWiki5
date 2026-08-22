/*\
title: test-dates.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests date parsing, date stringification and every template token listed in DateFormat.

Dates are built with the local time Date constructor, so the local time tokens give the
same answer whatever timezone the runner uses. The two assertions that must talk about
UTC derive their expectation from Date.prototype.toISOString(), which is the platform's
own serializer rather than a restatement of the code under test.

Any assertion can be reproduced in a browser console on tiddlywiki.com:

	var d = new Date(2014,10,9,17,41,28,542);
	$tw.utils.formatDateString(d,"DDth MMM YYYY");

\*/

"use strict";

describe("Date parsing", function() {

	var pd = function(v) {
		return $tw.utils.parseDate(v).toUTCString();
	};

	it("should parse a full UTC datestamp", function() {
		expect(pd("20150428204930183")).toEqual("Tue, 28 Apr 2015 20:49:30 GMT");
		expect(pd("00730428204930183")).toEqual("Fri, 28 Apr 0073 20:49:30 GMT");
		expect($tw.utils.parseDate("20150428204930183").getUTCMilliseconds()).toBe(183);
	});

	it("should read a leading minus sign as a negative year", function() {
		expect(pd("-20150428204930183")).toEqual("Sun, 28 Apr -2015 20:49:30 GMT");
		expect(pd("-00730428204930183")).toEqual("Thu, 28 Apr -0073 20:49:30 GMT");
	});

	it("should default the components a truncated datestamp omits", function() {
		// A field holding only a year, or only a year and a month, produced an invalid date
		// that setUTCFullYear() then rebuilt as 1 January, silently losing the month.
		// See https://github.com/TiddlyWiki/TiddlyWiki5/issues/9974
		expect(pd("2015")).toEqual("Thu, 01 Jan 2015 00:00:00 GMT");
		expect(pd("201504")).toEqual("Wed, 01 Apr 2015 00:00:00 GMT");
		expect(pd("20150428")).toEqual("Tue, 28 Apr 2015 00:00:00 GMT");
		expect(pd("2015042820")).toEqual("Tue, 28 Apr 2015 20:00:00 GMT");
		expect(pd("201504282049")).toEqual("Tue, 28 Apr 2015 20:49:00 GMT");
		expect(pd("20150428204930")).toEqual("Tue, 28 Apr 2015 20:49:30 GMT");
		expect(pd("-201504")).toEqual("Mon, 01 Apr -2015 00:00:00 GMT");
	});

	it("should pass a Date through and reject every other type", function() {
		var date = new Date(2015,3,28);
		expect($tw.utils.parseDate(date)).toBe(date);
		expect($tw.utils.parseDate(undefined)).toBeNull();
		expect($tw.utils.parseDate(null)).toBeNull();
		expect($tw.utils.parseDate(20150428)).toBeNull();
	});

	it("should round trip through stringifyDate", function() {
		var date = new Date(2015,3,28,20,49,30,183);
		expect($tw.utils.stringifyDate(date)).toBe(date.toISOString().replace(/[-:.TZ]/g,""));
		expect($tw.utils.parseDate($tw.utils.stringifyDate(date)).getTime()).toBe(date.getTime());
		// stringifyDate pads the milliseconds to three digits
		expect($tw.utils.stringifyDate(new Date(2015,3,28,20,49,30,7))).toMatch(/007$/);
	});

});

describe("Date formatting", function() {

	var fds = $tw.utils.formatDateString,
		// Sunday 9 November 2014 at 17:41:28.542 local time
		refDate = new Date(2014,10,9,17,41,28,542),
		bceDate = new Date(2014,10,9,17,41,28,542),
		zeroDate = new Date(2014,10,9,17,41,28,542);
	bceDate.setFullYear(-2014);
	zeroDate.setFullYear(0);

	it("should substitute the year tokens", function() {
		expect(fds(refDate,"YYYY")).toBe("2014");
		expect(fds(refDate,"aYYYY")).toBe("2014");
		expect(fds(refDate,"YY")).toBe("14");
	});

	it("should substitute the year tokens for negative and zero years", function() {
		expect(fds(bceDate,"YYYY")).toBe("-2014");
		expect(fds(bceDate,"aYYYY")).toBe("2014");
		expect(fds(zeroDate,"YYYY")).toBe("0000");
		expect(fds(zeroDate,"aYYYY")).toBe("0000");
	});

	it("should show the last two digits of the year in YY", function() {
		// YY and wYY subtracted 2000 rather than taking the last two digits, so a year
		// outside 2000 to 2099 did not render as two digits at all
		expect(fds(new Date(1999,0,15,12,0,0),"YY")).toBe("99");
		expect(fds(new Date(2100,0,15,12,0,0),"YY")).toBe("00");
		expect(fds(new Date(2007,0,15,12,0,0),"YY")).toBe("07");
		expect(fds(bceDate,"YY")).toBe("14");
		// 15 January 1999 is a Friday in week 2 of 1999, so the week year is 1999 too
		expect(fds(new Date(1999,0,15,12,0,0),"wYY")).toBe("99");
	});

	it("should choose the era string from the sign of the year", function() {
		expect(fds(refDate,"{era:BCE|ZERO|CE}")).toBe("CE");
		expect(fds(bceDate,"{era:BCE|ZERO|CE}")).toBe("BCE");
		expect(fds(zeroDate,"{era:BCE|ZERO|CE}")).toBe("ZERO");
		// only the three alternative form is a token, anything else is literal text
		expect(fds(refDate,"{era:BCE|CE}")).toBe("{era:BCE|CE}");
	});

	it("should substitute the month tokens", function() {
		expect(fds(refDate,"MM")).toBe("11");
		expect(fds(refDate,"0MM")).toBe("11");
		expect(fds(refDate,"mmm")).toBe("Nov");
		expect(fds(refDate,"MMM")).toBe("November");
		var january = new Date(2014,0,9,17,41,28,542);
		expect(fds(january,"MM")).toBe("1");
		expect(fds(january,"0MM")).toBe("01");
		// walk every month so an off by one in getMonth() cannot hide
		var names = [];
		for(var m = 0; m < 12; m++) {
			names.push(fds(new Date(2014,m,15,12,0,0),"mmm"));
		}
		expect(names.join(" ")).toBe("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec");
	});

	it("should substitute the day of month tokens", function() {
		expect(fds(refDate,"DD")).toBe("9");
		expect(fds(refDate,"0DD")).toBe("09");
		expect(fds(refDate,"DDth")).toBe("9th");
		var suffixed = [];
		[1,2,3,4,11,12,13,21,22,23,31].forEach(function(day) {
			suffixed.push(fds(new Date(2014,0,day,12,0,0),"DDth"));
		});
		expect(suffixed.join(" ")).toBe("1st 2nd 3rd 4th 11th 12th 13th 21st 22nd 23rd 31st");
	});

	it("should substitute the day of week tokens", function() {
		// 9 November 2014 is a Sunday, so this walks Sunday through Saturday
		var shortNames = [], longNames = [], isoNumbers = [];
		for(var i = 9; i <= 15; i++) {
			var d = new Date(2014,10,i,12,0,0);
			shortNames.push(fds(d,"ddd"));
			longNames.push(fds(d,"DDD"));
			isoNumbers.push(fds(d,"dddd"));
		}
		expect(shortNames.join(" ")).toBe("Sun Mon Tue Wed Thu Fri Sat");
		expect(longNames.join(" ")).toBe("Sunday Monday Tuesday Wednesday Thursday Friday Saturday");
		// dddd is the ISO weekday number, so Monday is 1 and Sunday is 7
		expect(isoNumbers.join(" ")).toBe("7 1 2 3 4 5 6");
	});

	it("should substitute the day of year tokens", function() {
		expect(fds(new Date(2014,0,1,12,0,0),"ddddd")).toBe("1");
		expect(fds(new Date(2014,0,1,12,0,0),"0ddddd")).toBe("001");
		expect(fds(refDate,"ddddd")).toBe("313");
		expect(fds(new Date(2014,11,31,12,0,0),"ddddd")).toBe("365");
		// 2016 is a leap year
		expect(fds(new Date(2016,11,31,12,0,0),"ddddd")).toBe("366");
		expect(fds(new Date(2016,11,31,12,0,0),"0ddddd")).toBe("366");
	});

	it("should substitute the ISO week number tokens", function() {
		// edge cases taken from https://en.wikipedia.org/wiki/ISO_week_date
		expect(fds(refDate,"WW")).toBe("45");
		expect(fds(refDate,"0WW")).toBe("45");
		expect(fds(new Date(2016,10,12,23,59,59),"WW")).toBe("45");
		expect(fds(new Date(2016,10,13,23,59,59,999),"WW")).toBe("45");
		expect(fds(new Date(2016,10,13,23,59,60),"WW")).toBe("46");
		expect(fds(new Date(2006,11,31,23,59,59),"WW")).toBe("52");
		expect(fds(new Date(2006,11,31,23,59,60),"WW")).toBe("1");
		expect(fds(new Date(2006,11,31,23,59,60),"0WW")).toBe("01");
		expect(fds(new Date(2010,0,3,23,59,59),"WW")).toBe("53");
		expect(fds(new Date(2010,0,3,23,59,60),"WW")).toBe("1");
	});

	it("should count the ISO week independently of summer time", function() {
		// getWeek() measured a summer time date against a standard time 1 January, which
		// dropped a whole week. It showed in the hour after local midnight, and only in a
		// year whose 1 January is a Thursday, which is exactly the 53 week years: 1998,
		// 2004, 2009, 2015, 2026. Reproducible only where summer time is observed, for
		// example TZ=Europe/Vienna
		expect(fds(new Date(2015,6,1,12,0,0),"WW")).toBe("27");
		expect(fds(new Date(2015,6,1,0,30,0),"WW")).toBe("27");
		expect(fds(new Date(2015,6,1,23,30,0),"WW")).toBe("27");
		expect(fds(new Date(2026,6,1,0,30,0),"WW")).toBe("27");
	});

	it("should substitute the week year tokens", function() {
		expect(fds(refDate,"wYYYY")).toBe("2014");
		expect(fds(refDate,"wYY")).toBe("14");
		// 29 December 2014 falls in week 1 of 2015
		var lastWeek = new Date(2014,11,29,23,59,59);
		expect(fds(lastWeek,"WW")).toBe("1");
		expect(fds(lastWeek,"wYYYY")).toBe("2015");
		expect(fds(lastWeek,"wYY")).toBe("15");
	});

	it("should substitute the time of day tokens", function() {
		expect(fds(refDate,"hh")).toBe("17");
		expect(fds(refDate,"0hh")).toBe("17");
		expect(fds(refDate,"mm")).toBe("41");
		expect(fds(refDate,"0mm")).toBe("41");
		expect(fds(refDate,"ss")).toBe("28");
		expect(fds(refDate,"0ss")).toBe("28");
		expect(fds(refDate,"XXX")).toBe("542");
		expect(fds(refDate,"0XXX")).toBe("542");
		// only the padded forms add a leading zero
		var earlyDate = new Date(2014,10,9,7,5,3,7);
		expect(fds(earlyDate,"hh:mm:ss.XXX")).toBe("7:5:3.7");
		expect(fds(earlyDate,"0hh:0mm:0ss.0XXX")).toBe("07:05:03.007");
	});

	it("should substitute the twelve hour clock tokens", function() {
		var clock = [];
		[0,1,11,12,13,23].forEach(function(hour) {
			var d = new Date(2014,10,9,hour,0,0);
			clock.push(fds(d,"hh12") + "/" + fds(d,"0hh12") + fds(d,"am"));
		});
		// midnight and noon are both 12, and noon counts as pm
		expect(clock.join(" ")).toBe("12/12am 1/01am 11/11am 12/12pm 1/01pm 11/11pm");
		// am and pm are interchangeable, the date decides which of the two is shown
		expect(fds(refDate,"am")).toBe("pm");
		expect(fds(refDate,"pm")).toBe("pm");
		expect(fds(refDate,"AM")).toBe("PM");
		expect(fds(refDate,"PM")).toBe("PM");
	});

	it("should substitute the timestamp token", function() {
		expect(fds(refDate,"TIMESTAMP")).toBe(refDate.getTime().toString());
	});

	it("should substitute the timezone offset token", function() {
		// The offset is stubbed because the runner's timezone cannot be chosen, and because
		// deriving the expectation from getTimezoneOffset() would only restate the code.
		// getTimezoneOffset() counts minutes west of UTC, so TZD carries the opposite sign
		var atOffset = function(minutes) {
			var d = new Date(2014,10,9,17,41,28,542);
			d.getTimezoneOffset = function() { return minutes; };
			return fds(d,"TZD");
		};
		expect(atOffset(-60)).toBe("+01:00");
		expect(atOffset(300)).toBe("-05:00");
		expect(atOffset(-345)).toBe("+05:45"); // Asia/Kathmandu
		expect(atOffset(210)).toBe("-03:30"); // America/St_Johns
		expect(atOffset(-840)).toBe("+14:00"); // Pacific/Kiritimati
		// ISO 8601 has no -00:00
		expect(atOffset(0)).toBe("+00:00");
		expect(fds(refDate,"TZD")).toMatch(/^[+-]\d\d:\d\d$/);
	});

	it("should shift the date to UTC when the template starts with [UTC]", function() {
		var iso = refDate.toISOString(); // 2014-11-09T16:41:28.542Z on a UTC+1 runner
		expect(fds(refDate,"[UTC]YYYY-0MM-0DD 0hh:0mm:0ss.0XXX")).toBe(iso.substr(0,10) + " " + iso.substr(11,12));
		// the raw datestamp shortcut and the template DateFormat documents must agree
		var stamp = iso.replace(/[-:.TZ]/g,"");
		expect(fds(refDate,"[UTC]YYYY0MM0DD0hh0mm0ssXXX")).toBe(stamp);
		expect(fds(refDate,"[UTC]YYYY0MM0DD0hh0mm0ss0XXX")).toBe(stamp);
		expect($tw.utils.stringifyDate(refDate)).toBe(stamp);
	});

	it("should shift to the same UTC instant across a summer time transition", function() {
		// The shift took the offset of the original instant and then read the shifted one,
		// which can sit in the other summer time period, so the result was out by the
		// summer time delta on either side of a transition. In Europe/Vienna local
		// 29 March 2015 03:30 rendered as 00:30 UTC rather than 01:30. The [UTC] shortcut
		// escaped it, so the two spellings of the datestamp disagreed, and
		// format:timestamp defaults to the 0XXX spelling that takes the generic path.
		// Sweeps a whole year so that every timezone's transitions are covered, at
		// quarter hours because some zones shift by 30 or 45 minutes. Every instant counts,
		// including the ones whose UTC reading is an hour local time skips over: those are
		// exactly the ones no shifted Date can carry
		var wrong = [];
		for(var t = Date.UTC(2015,0,1); t < Date.UTC(2016,0,1); t += 15 * 60 * 1000) {
			var d = new Date(t),
				stamp = d.toISOString().replace(/[-:.TZ]/g,"");
			if(fds(d,"[UTC]YYYY0MM0DD0hh0mm0ss0XXX") !== stamp || fds(d,"[UTC]YYYY0MM0DD0hh0mm0ssXXX") !== stamp) {
				wrong.push(d.toISOString());
			}
		}
		expect(wrong).toEqual([]);
	});

	it("should treat [UTC] as literal text unless it starts the template", function() {
		expect(fds(refDate,"x[UTC]0hh")).toBe("x[UTC]17");
	});

	it("should pass unrecognised text through unchanged", function() {
		expect(fds(refDate,"")).toBe("");
		expect(fds(refDate,"Q q Z z, 0MM")).toBe("Q q Z z, 11");
		expect(fds(refDate,"MM0DD")).toBe("1109");
	});

	it("should honour a backslash escape", function() {
		// the two examples DateFormat gives
		expect(fds(refDate,"MM0\\D\\D")).toBe("110DD");
		expect(fds(refDate,"DDth MMM \\M\\M\\M YYYY")).toBe("9th November MMM 2014");
	});

	// https://github.com/TiddlyWiki/TiddlyWiki5/issues/9974
	describe("regressions from issue 9974", function() {

		it("should substitute a zero valued time token", function() {
			// The loop used to test the substituted value for truthiness rather than for a
			// match, so hh, mm, ss and XXX disappeared when they were zero and the character
			// after the token was re-read as literal text, which made mmss report "ss". The
			// padded forms never showed it because they always substitute a string
			var midnight = new Date(2014,10,9,0,0,0,0),
				tenOClock = new Date(2014,10,9,10,0,0,0);
			expect(fds(midnight,"0hh:0mm:0ss")).toBe("00:00:00");
			expect(fds(midnight,"hh:mm:ss")).toBe("0:0:0");
			expect(fds(midnight,"XXX")).toBe("0");
			expect(fds(tenOClock,"hh:mm")).toBe("10:0");
			expect(fds(tenOClock,"mmss")).toBe("00");
		});

		it("should substitute an empty era alternative", function() {
			// {era:BCE||CE} is the notation DateFormat documents, and its empty middle
			// alternative reached the same truthiness branch, taking the month with it
			expect(fds(zeroDate,"{era:BCE||CE}MM")).toBe("11");
		});

		it("should count the day of year independently of summer time", function() {
			// The day of year used to subtract a standard time 1 January from a summer time
			// date, which lost a day. Only a timezone that observes summer time showed it,
			// for example TZ=Europe/Vienna
			var earlyMorning = new Date(2014,6,1,0,30,0),
				noon = new Date(2014,6,1,12,0,0);
			expect(fds(noon,"ddddd")).toBe("182");
			expect(fds(earlyMorning,"ddddd")).toBe("182");
		});

	});

});
