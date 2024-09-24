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
	function setupWiki(wikiOptions) {
		wikiOptions = wikiOptions || {};
		// Create a wiki
		var wiki = new $tw.Wiki(wikiOptions);
		wiki.addIndexersToWiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: '',
		});
		
		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A link to [[TestIncoming]]',
		});
		return wiki;
	}

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
		var wiki = setupWiki();

		it('should have a backlink', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing');
		});
	});

	describe('A tiddler that has a link added to it later', function() {
		it('should have an additional backlink', function() {
			var wiki = setupWiki();

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
		var wiki = setupWiki();

		it('should have one fewer backlink', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing');

			wiki.addTiddler({
				title: 'TestOutgoing',
				text: 'No link to ~TestIncoming'});

			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('');
		});
	});

	describe('A tiddler linking to another that gets renamed', function() {
		var wiki = setupWiki();

		it('should have its name changed in the backlinks', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing');

			wiki.renameTiddler('TestOutgoing', 'TestExtroverted');

			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestExtroverted');
		});
	});

	describe('A tiddler linking to another that gets deleted', function() {
		var wiki = setupWiki();

		it('should be removed from backlinks', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('TestOutgoing');

			wiki.deleteTiddler('TestOutgoing');

			expect(wiki.filterTiddlers('TestIncoming +[backlinks[]]').join(',')).toBe('');
		});
	});

	describe('Binary tiddlers should not be parsed', function() {
		var wiki = setupWiki();

		wiki.addTiddler({
			title: 'TestDoc.doc',
			text: 'A link to [[TestOutgoing]]',
			type: 'application/msword'
		});

		wiki.addTiddler({
			title: 'TestExcel.xls',
			text: 'A link to [[TestOutgoing]]',
			type: 'application/excel'
		});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'Some links to [[TestDoc.doc]] and [[TestExcel.xls]].'
		});

		it('should ignore office files', function() {
			expect(wiki.getIndexer("BackIndexer").subIndexers.link._getTarget(wiki.getTiddler('TestExcel.xls'))).toEqual([]);

			expect(wiki.filterTiddlers('[all[]] +[backlinks[]]').join(',')).toBe('TestOutgoing');
			
			// make it tw5 tiddler
			wiki.addTiddler({
				title: 'TestExcel.xls',
				text: 'A link to [[TestOutgoing]]'
			});

			expect(wiki.filterTiddlers('[all[]] +[backlinks[]]').join(',')).toBe('TestOutgoing,TestExcel.xls');
		});
	});
});

})();
