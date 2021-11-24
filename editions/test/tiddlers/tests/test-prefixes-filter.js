/*\
title: test-prefixes-filters.js
type: application/javascript
tags: [[$:/tags/test-spec]]
Tests the reduce prefix and filter.
\*/
(function(){

/* jslint node: true, browser: true */
/* eslint-env node, browser, jasmine */
/* eslint no-mixed-spaces-and-tabs: ["error", "smart-tabs"]*/
/* global $tw, require */
"use strict";

describe("general filter prefix tests", function() {
	it("should handle nonexistent prefixes gracefully", function() {
		var wiki = new $tw.Wiki();
		var results = wiki.filterTiddlers("[tag[A]] :nonexistent[tag[B]]");
		expect(results).toEqual(["Filter Error: Unknown prefix for filter run"]);
	});

	// Test filter run prefix parsing
	it("should parse filter run prefix suffixes", function() {

		// two runs, one with a named prefix but no suffix
		expect($tw.wiki.parseFilter("[[Sparkling water]tags[]] :intersection[[Red wine]tags[]]")).toEqual(
			[
				{
					"prefix": "",
					"operators": [
						{
							"operator": "title",
							"operands": [
								{
									"text": "Sparkling water"
								}
							]
						},
						{
							"operator": "tags",
							"operands": [
								{
									"text": ""
								}
							]
						}
					]
				},
				{
					"prefix": ":intersection",
					"operators": [
						{
							"operator": "title",
							"operands": [
								{
									"text": "Red wine"
								}
							]
						},
						{
							"operator": "tags",
							"operands": [
								{
									"text": ""
								}
							]
						}
					],
					"namedPrefix": "intersection"
				}
			]
		);

		// named prefix with no suffix
		expect($tw.wiki.parseFilter(":reduce[multiply<accumulator>]")).toEqual(
			[
				{
					"prefix": ":reduce",
					"operators": [
						{
							"operator": "multiply",
							"operands": [
								{
									"variable": true,
									"text": "accumulator"
								}
							]
						}
					],
					"namedPrefix": "reduce"
				}
			]
		);

		//named prefix with one simple suffix
		expect($tw.wiki.parseFilter(":reduce:1[multiply<accumulator>]")).toEqual(
			[
				{
					"prefix": ":reduce:1",
					"operators": [
						{
							"operator": "multiply",
							"operands": [
								{
									"variable": true,
									"text": "accumulator"
								}
							]
						}
					],
					"namedPrefix": "reduce",
					"suffixes": [
						[
							"1"
						]
					]
				}
			]
		);

		//named prefix with two simple suffixes
		expect($tw.wiki.parseFilter(":reduce:1:hello[multiply<accumulator>]")).toEqual(
			[
				{
					"prefix": ":reduce:1:hello",
					"operators": [
						{
							"operator": "multiply",
							"operands": [
								{
									"variable": true,
									"text": "accumulator"
								}
							]
						}
					],
					"namedPrefix": "reduce",
					"suffixes": [
						[
							"1"
						],
						[
							"hello",
						]
					]
				}
			]
		);

		//named prefix with two rich (comma separated) suffixes
		expect($tw.wiki.parseFilter(":reduce:1,one:hello,there[multiply<accumulator>]")).toEqual(
			[
				{
					"prefix": ":reduce:1,one:hello,there",
					"operators": [
						{
							"operator": "multiply",
							"operands": [
								{
									"variable": true,
									"text": "accumulator"
								}
							]
						}
					],
					"namedPrefix": "reduce",
					"suffixes": [
						[
							"1",
							"one"
						],
						[
							"hello",
							"there"
						]
					]
				}
			]
		);
		
		// suffixes with spaces
		expect($tw.wiki.parseFilter(":reduce: 1, one:hello, there [multiply<accumulator>]")).toEqual(
			[
				{
					"prefix": ":reduce: 1, one:hello, there ",
					"operators": [
						{
							"operator": "multiply",
							"operands": [
								{
									"variable": true,
									"text": "accumulator"
								}
							]
						}
					],
					"namedPrefix": "reduce",
					"suffixes": [
						[
							"1",
							"one"
						],
						[
							"hello",
							"there"
						]
					]
				}
			]
		);

	});	

});

describe("'reduce' and 'intersection' filter prefix tests", function() {

	var wiki = new $tw.Wiki();

	wiki.addTiddler({
		title: "Brownies",
		text: "//This is a sample shopping list item for the [[Shopping List Example]]//",
		description: "A square of rich chocolate cake",
		tags: ["shopping","food"],
		price: "4.99",
		quantity: "1"
	});
	wiki.addTiddler({
		title: "Chick Peas",
		text: "//This is a sample shopping list item for the [[Shopping List Example]]//",
		tags: ["shopping","food"],
		description: "a round yellow seed",
		price: "1.32",
		quantity: "5"
	});
	wiki.addTiddler({
		title: "Milk",
		text: "//This is a sample shopping list item for the [[Shopping List Example]]//",
		tags: ["shopping", "dairy", "drinks"],
		price: "0.46",
		quantity: "12"
	});
	wiki.addTiddler({
		title: "Rice Pudding",
		price: "2.66",
		quantity: "4",
		description: "",
		tags: ["shopping", "dairy"],
		text: "//This is a sample shopping list item for the [[Shopping List Example]]//"
	});
	wiki.addTiddler({
		title: "Sparkling water",
		tags: ["drinks", "mineral water", "textexample"],
		text: "This is some text"
	});
	wiki.addTiddler({
		title: "Red wine",
		tags: ["drinks", "wine", "textexample"],
		text: "This is some more text!"
	});
	wiki.addTiddler({
		title: "Cheesecake",
		tags: ["cakes", "food", "textexample"],
		text: "This is even even even more text"
	});
	wiki.addTiddler({
		title: "Chocolate Cake",
		tags: ["cakes", "food", "textexample"],
		text: "This is even more text"
	});
	wiki.addTiddler({
		title: "Persian love cake",
		tags: ["cakes"],
		text: "An amazing cake worth the effort to make"
	});
	wiki.addTiddler({
		title: "cheesecake",
		tags: ["cakes"],
		text: "Everyone likes cheescake"
	});
	wiki.addTiddler({
		title: "chocolate cake",
		tags: ["cakes"],
		text: "lower case chocolate cake"
	});
	wiki.addTiddler({
		title: "Pound cake",
		tags: ["cakes","with tea"],
		text: "Does anyone eat pound cake?"
	});
	wiki.addTiddler({
		title: "$:/filter1",
		text: "[tag[cakes]then[It is customary]]",
		tags: "$:/tags/Filter $:/tags/SecondFilter"
	});
	wiki.addTiddler({
		title: "$:/filter2",
		text: "[<currentTiddler>tag[shopping]then[It is not customary]]",
		tags: "$:/tags/Filter $:/tags/SecondFilter"
	});
	wiki.addTiddler({
		title: "$:/filter3",
		text: "[[Just a default]]",
		tags: "$:/tags/Filter"
	});
	wiki.addTiddler({
		title: "$:/tags/Filter",
		list: "$:/filter1 $:/filter2 $:/filter3"
	});
	wiki.addTiddler({
		title: "$:/tags/SecondFilter",
		list: "$:/filter1 $:/filter2"
	});
	
	it("should handle the :cascade filter prefix", function() {
		expect(wiki.filterTiddlers("[[Rice Pudding]] :cascade[all[shadows+tiddlers]tag[$:/tags/Filter]get[text]]").join(",")).toBe("It is not customary");
		expect(wiki.filterTiddlers("[[chocolate cake]] :cascade[all[shadows+tiddlers]tag[$:/tags/Filter]get[text]]").join(",")).toBe("It is customary");
		expect(wiki.filterTiddlers("[[Sparkling water]] :cascade[all[shadows+tiddlers]tag[$:/tags/Filter]get[text]]").join(",")).toBe("Just a default");
		expect(wiki.filterTiddlers("[[Rice Pudding]] :cascade[all[shadows+tiddlers]tag[$:/tags/SecondFilter]get[text]]").join(",")).toBe("It is not customary");
		expect(wiki.filterTiddlers("[[chocolate cake]] :cascade[all[shadows+tiddlers]tag[$:/tags/SecondFilter]get[text]]").join(",")).toBe("It is customary");
		expect(wiki.filterTiddlers("[[Sparkling water]] :cascade[all[shadows+tiddlers]tag[$:/tags/SecondFilter]get[text]]").join(",")).toBe("");
	});

	it("should handle the :reduce filter prefix", function() {
		expect(wiki.filterTiddlers("[tag[shopping]] :reduce[get[quantity]add<accumulator>]").join(",")).toBe("22");
		expect(wiki.filterTiddlers("[tag[shopping]] :reduce[get[price]multiply{!!quantity}add<accumulator>]").join(",")).toBe("27.75");
		expect(wiki.filterTiddlers("[tag[shopping]] :reduce[<index>compare:number:gt[0]then<accumulator>addsuffix[, ]addsuffix<currentTiddler>else<currentTiddler>]").join(",")).toBe("Brownies, Chick Peas, Milk, Rice Pudding");
		// Empty input should become empty output
		expect(wiki.filterTiddlers("[tag[non-existent]] :reduce[get[price]multiply{!!quantity}add<accumulator>]").length).toBe(0);
		expect(wiki.filterTiddlers("[tag[non-existent]] :reduce[get[price]multiply{!!quantity}add<accumulator>] :else[[0]]").join(",")).toBe("0");
		
		expect(wiki.filterTiddlers("[tag[non-existent]] :reduce:11,22[get[price]multiply{!!quantity}add<accumulator>] :else[[0]]").join(",")).toBe("0");

		expect(wiki.filterTiddlers("[tag[non-existent]] :reduce:11[get[price]multiply{!!quantity}add<accumulator>] :else[[0]]").join(",")).toBe("0");
	});

	it("should handle the reduce operator", function() {
		var widget = require("$:/core/modules/widgets/widget.js");
		var rootWidget = new widget.widget({ type:"widget", children:[ {type:"widget", children:[]} ] },
										   { wiki:wiki, document:$tw.document});
		rootWidget.makeChildWidgets();
		var anchorWidget = rootWidget.children[0];
		rootWidget.setVariable("add-price","[get[price]multiply{!!quantity}add<accumulator>]");
		rootWidget.setVariable("num-items","[get[quantity]add<accumulator>]");
		rootWidget.setVariable("join-with-commas","[<index>compare:number:gt[0]then<accumulator>addsuffix[, ]addsuffix<currentTiddler>else<currentTiddler>]");

		expect(wiki.filterTiddlers("[tag[shopping]reduce<num-items>]",anchorWidget).join(",")).toBe("22");
		expect(wiki.filterTiddlers("[tag[shopping]reduce<add-price>]",anchorWidget).join(",")).toBe("27.75");
		expect(wiki.filterTiddlers("[tag[shopping]reduce<join-with-commas>]",anchorWidget).join(",")).toBe("Brownies, Chick Peas, Milk, Rice Pudding");
		// Empty input should become empty output
		expect(wiki.filterTiddlers("[tag[non-existent]reduce<add-price>,[0]]",anchorWidget).join(",")).not.toBe("0");
		expect(wiki.filterTiddlers("[tag[non-existent]reduce<add-price>,[0]]",anchorWidget).length).toBe(0);
		expect(wiki.filterTiddlers("[tag[non-existent]reduce<add-price>else[0]]",anchorWidget).join(",")).toBe("0");
	});

	it("should handle the average operator", function() {
		expect(wiki.filterTiddlers("[tag[shopping]get[price]average[]]").join(",")).toBe("2.3575");
		expect(parseFloat(wiki.filterTiddlers("[tag[food]get[price]average[]]").join(","))).toBeCloseTo(3.155);
	});

	it("should handle the median operator", function() {
		expect(parseFloat(wiki.filterTiddlers("[tag[shopping]get[price]median[]]").join(","))).toBeCloseTo(1.99);
		expect(parseFloat(wiki.filterTiddlers("[tag[food]get[price]median[]]").join(","))).toBeCloseTo(3.155);
	});
	
	it("should handle the variance operator", function() {
		expect(parseFloat(wiki.filterTiddlers("[tag[shopping]get[price]variance[]]").join(","))).toBeCloseTo(2.92);
		expect(parseFloat(wiki.filterTiddlers("[tag[food]get[price]variance[]]").join(","))).toBeCloseTo(3.367);
		expect(wiki.filterTiddlers(" +[variance[]]").toString()).toBe("NaN");
	});

	it("should handle the standard-deviation operator", function() {
		expect(parseFloat(wiki.filterTiddlers("[tag[shopping]get[price]standard-deviation[]]").join(","))).toBeCloseTo(1.71);
		expect(parseFloat(wiki.filterTiddlers("[tag[food]get[price]standard-deviation[]]").join(","))).toBeCloseTo(1.835);
		expect(wiki.filterTiddlers(" +[standard-deviation[]]").toString()).toBe("NaN");
	});	

	it("should handle the :intersection prefix", function() {
		expect(wiki.filterTiddlers("[[Sparkling water]tags[]] :intersection[[Red wine]tags[]]").join(",")).toBe("drinks,textexample");
		expect(wiki.filterTiddlers("[[Brownies]tags[]] :intersection[[Chocolate Cake]tags[]]").join(",")).toBe("food");
		expect(wiki.filterTiddlers("[tag[shopping]] :intersection[tag[food]]").join(",")).toBe("Brownies,Chick Peas");
		expect(wiki.filterTiddlers("[tag[shopping]] :intersection[tag[drinks]]").join(",")).toBe("Milk");
		expect(wiki.filterTiddlers("[tag[shopping]] :intersection[tag[wine]]").join(",")).toBe("");
	});
	
	it("should handle the :filter prefix and filter operator", function() {
		var widget = require("$:/core/modules/widgets/widget.js");
		var rootWidget = new widget.widget({ type:"widget", children:[ {type:"widget", children:[]} ] },
										   { wiki:wiki, document:$tw.document});
		rootWidget.makeChildWidgets();
		var anchorWidget = rootWidget.children[0];
		rootWidget.setVariable("larger-than-18","[get[text]length[]compare:integer:gteq[18]]");
		rootWidget.setVariable("nr","18");
		rootWidget.setVariable("larger-than-18-with-var","[get[text]length[]compare:integer:gteq<nr>]");
		expect(wiki.filterTiddlers("[tag[textexample]] :filter[get[text]length[]compare:integer:gteq[18]]",anchorWidget).join(",")).toBe("Red wine,Cheesecake,Chocolate Cake");
		expect(wiki.filterTiddlers("[tag[textexample]]",anchorWidget).join(",")).toBe("Sparkling water,Red wine,Cheesecake,Chocolate Cake");
		expect(wiki.filterTiddlers("[tag[textexample]filter<larger-than-18>]",anchorWidget).join(",")).toBe("Red wine,Cheesecake,Chocolate Cake");
		expect(wiki.filterTiddlers("[tag[textexample]filter<larger-than-18-with-var>]",anchorWidget).join(",")).toBe("Red wine,Cheesecake,Chocolate Cake");
	});

	it("should handle the :sort prefix", function() {
		expect(wiki.filterTiddlers("a1 a10 a2 a3 b10 b3 b1 c9 c11 c1 :sort:alphanumeric[{!!title}]").join(",")).toBe("a1,a2,a3,a10,b1,b3,b10,c1,c9,c11");
		expect(wiki.filterTiddlers("a1 a10 a2 a3 b10 b3 b1 c9 c11 c1 :sort:alphanumeric:reverse[{!!title}]").join(",")).toBe("c11,c9,c1,b10,b3,b1,a10,a3,a2,a1");
		expect(wiki.filterTiddlers("[tag[shopping]] :sort:number:[get[price]]").join(",")).toBe("Milk,Chick Peas,Rice Pudding,Brownies");
		expect(wiki.filterTiddlers("[tag[textexample]] :sort:number:[get[text]length[]]").join(",")).toBe("Sparkling water,Chocolate Cake,Red wine,Cheesecake");
		expect(wiki.filterTiddlers("[tag[textexample]] :sort:number:reverse[get[text]length[]]").join(",")).toBe("Cheesecake,Red wine,Chocolate Cake,Sparkling water");
		expect(wiki.filterTiddlers("[tag[notatag]] :sort:number[get[price]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[tag[cakes]] :sort:string[{!!title}]").join(",")).toBe("Cheesecake,cheesecake,Chocolate Cake,chocolate cake,Persian love cake,Pound cake");
		expect(wiki.filterTiddlers("[tag[cakes]] :sort:string:casesensitive[{!!title}]").join(",")).toBe("Cheesecake,Chocolate Cake,Persian love cake,Pound cake,cheesecake,chocolate cake");
		expect(wiki.filterTiddlers("[tag[cakes]] :sort:string:casesensitive,reverse[{!!title}]").join(",")).toBe("chocolate cake,cheesecake,Pound cake,Persian love cake,Chocolate Cake,Cheesecake");
	});

	it("should handle the :map prefix", function() {
		expect(wiki.filterTiddlers("[tag[shopping]] :map[get[title]]").join(",")).toBe("Brownies,Chick Peas,Milk,Rice Pudding");
		expect(wiki.filterTiddlers("[tag[shopping]] :map[get[description]]").join(",")).toBe("A square of rich chocolate cake,a round yellow seed,,");
		expect(wiki.filterTiddlers("[tag[shopping]] :map[get[description]else{!!title}]").join(",")).toBe("A square of rich chocolate cake,a round yellow seed,Milk,Rice Pudding");
		// Return the first title from :map if the filter returns more than one result
		expect(wiki.filterTiddlers("[tag[shopping]] :map[tags[]]").join(",")).toBe("shopping,shopping,shopping,shopping");
		// Prepend the position in the list using the index and length variables
		expect(wiki.filterTiddlers("[tag[shopping]] :map[get[title]addprefix[-]addprefix<length>addprefix[of]addprefix<index>]").join(",")).toBe("0of4-Brownies,1of4-Chick Peas,2of4-Milk,3of4-Rice Pudding");
	});

	it("should handle macro parameters for filter run prefixes",function() {
		var widget = require("$:/core/modules/widgets/widget.js");
		var rootWidget = new widget.widget({ type:"widget", children:[ {type:"widget", children:[]} ] },
										   { wiki:wiki, document:$tw.document});
		rootWidget.makeChildWidgets();
		var anchorWidget = rootWidget.children[0];
		rootWidget.setVariable("greet","Hello $name$",[{name:"name"}],true);
		rootWidget.setVariable("echo","$text$",[{name:"text"}],true);
		// :map prefix
		expect(wiki.filterTiddlers("1 :map[subfilter<greet Tom>join[ ]]",anchorWidget).join(",")).toBe("Hello Tom");
		expect(wiki.filterTiddlers('[tag[shopping]] :map[<echo "$(index)$ $(currentTiddler)$">]',anchorWidget).join(",")).toBe("0 Brownies,1 Chick Peas,2 Milk,3 Rice Pudding");
		// :reduce prefix
		expect(wiki.filterTiddlers("1 :reduce[subfilter<greet Tom>join[ ]]",anchorWidget).join(",")).toBe("Hello Tom");
		expect(wiki.filterTiddlers('[tag[shopping]] :reduce[<echo "$(accumulator)$ $(index)$ $(currentTiddler)$,">]',anchorWidget).join(",")).toBe(" 0 Brownies, 1 Chick Peas, 2 Milk, 3 Rice Pudding,");
	});
});

})();