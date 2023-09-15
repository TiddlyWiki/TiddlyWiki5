/*\
title: test-backtranscludes.js
type: application/javascript
tags: $:/tags/test-spec

Tests the backtranscludes mechanism.

\*/
(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe('Backtranscludes tests', function() {
	describe('a tiddler with no transcludes to it', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		it('should have no backtranscludes', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('');
		});
	});

	describe('A tiddler added to the wiki with a transclude to it', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: 'something'});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A transclude to {{TestIncoming}}'});

		it('should have a backtransclude', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing');
		});
	});

	describe('A tiddler transclude with template will still use the tiddler as result.', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: 'something'});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A transclude to {{TestIncoming||$:/core/ui/TagTemplate}}'});

		it('should have a backtransclude', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing');
		});
	});

	describe('A tiddler that has a transclude added to it later', function() {
		it('should have an additional backtransclude', function() {
			var wiki = new $tw.Wiki();

			wiki.addTiddler({
				title: 'TestIncoming',
				text: ''});

			wiki.addTiddler({
				title: 'TestOutgoing',
				text: 'A transclude to {{TestIncoming}}'});

			wiki.addTiddler({
				title: 'TestOutgoing2',
				text: 'Nothing yet!'});

			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing');

			wiki.addTiddler({
				title: 'TestOutgoing2',
				text: 'Updated with transclude to {{TestIncoming}}'});

			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing,TestOutgoing2');
		});
	});

	describe('A tiddler that has a transclude remove from it later', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A transclude to {{TestIncoming}}'});

		it('should have one fewer backtransclude', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing');

			wiki.addTiddler({
				title: 'TestOutgoing',
				text: 'No transclude to ~TestIncoming'});

			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('');
		});
	});

	describe('A tiddler transcludeing to another that gets renamed', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A transclude to {{TestIncoming}}'});

		it('should have its name changed in the backtranscludes', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing');

			wiki.renameTiddler('TestOutgoing', 'TestExtroverted');

			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestExtroverted');
		});
	});

	describe('A tiddler transcludeing to another that gets deleted', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A transclude to {{TestIncoming}}'});

		it('should be removed from backtranscludes', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing');

			wiki.deleteTiddler('TestOutgoing');

			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('');
		});
	});
});

})();
