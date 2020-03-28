/*\
title: test-backlinks.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the backlinks mechanism.

\*/
(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe('Backlinks tests', function() {
	describe('a tiddler with no links to it', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		it('should have no backlinks', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('');
		});
	});

	describe('A tiddler added to the wiki with a link to it', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A link to [[TestIncoming]]'});

		it('should have a backlink', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing');
		});
	});

	describe('A tiddler that has a link added to it later', function() {
		it('should have an additional backlink', function() {
			var wiki = new $tw.Wiki();

			wiki.addTiddler({
				title: 'TestIncoming',
				text: ''});

			wiki.addTiddler({
				title: 'TestOutgoing',
				text: 'A link to [[TestIncoming]]'});

			wiki.addTiddler({
				title: 'TestOutgoing2',
				text: 'Nothing yet!'});

			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing');

			wiki.addTiddler({
				title: 'TestOutgoing2',
				text: 'Updated with link to [[TestIncoming]]'});

			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing,TestOutgoing2');
		});
	});

	describe('A tiddler that has a link remove from it later', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A link to [[TestIncoming]]'});

		it('should have one fewer backlink', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing');

			wiki.addTiddler({
				title: 'TestOutgoing',
				text: 'No link to ~TestIncoming'});

			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('');
		});
	});

	describe('A tiddler linking to another that gets renamed', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A link to [[TestIncoming]]'});

		it('should have its name changed in the backlinks', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing');

			wiki.renameTiddler('TestOutgoing', 'TestExtroverted');

			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestExtroverted');
		});
	});

	describe('A tiddler linking to another that gets deleted', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A link to [[TestIncoming]]'});

		it('should be removed from backlinks', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing');

			wiki.deleteTiddler('TestOutgoing');

			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('');
		});
	});
});

})();
