/*\
title: test-backtranscludes.js
type: application/javascript
tags: $:/tags/test-spec

Tests the backtranscludes mechanism.

\*/
"use strict";

describe('Backtranscludes and transclude filter tests', function() {
	describe('a tiddler with no transcludes to it', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			text: ''});

		it('should have no backtranscludes', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('');
		});
		it('should have no transcludes', function() {
			expect(wiki.filterTiddlers('TestIncoming +[transcludes[]]').join(',')).toBe('');
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
		it('should have a transclude', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[transcludes[]]').join(',')).toBe('TestIncoming');
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

	describe('A data tiddler transclude will still use the tiddler as result.', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestIncoming',
			type: 'application/x-tiddler-dictionary',
			text: 'name: value'});

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: 'A transclude to {{TestIncoming##name}}'});

		it('should have a backtransclude', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing');
		});
		it('should have a transclude', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[transcludes[]]').join(',')).toBe('TestIncoming');
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

	describe('a tiddler with some transcludes on it in order', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: "{{New Tiddler!!created}}\n\nA transclude to {{TestIncoming}}"
		});

		it('should have a transclude', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[transcludes[]]').join(',')).toBe('New Tiddler,TestIncoming');
		});

		it('should have a back transclude', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing');
			expect(wiki.filterTiddlers('[[New Tiddler]] +[backtranscludes[]]').join(',')).toBe('TestOutgoing');
		});
	});

	describe('include implicit self transclusion', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: "{{!!created}}\n\nAn implicit self-referential transclude to <$transclude $field='created'/> and <$transclude field='created'/>"});

		it('should have no transclude', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[transcludes[]]').join(',')).toBe('TestOutgoing');
		});

		it('should have no back transcludes', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[backtranscludes[]]').join(',')).toBe('TestOutgoing');
		});
	});

	describe('include explicit self transclusion', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: "{{TestOutgoing!!created}}\n\n<$transclude $tiddler='TestOutgoing' $field='created'/> and <$transclude tiddler='TestOutgoing' field='created'/>"});

			it('should have no transclude', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[transcludes[]]').join(',')).toBe('TestOutgoing');
		});

		it('should have no back transcludes', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[backtranscludes[]]').join(',')).toBe('TestOutgoing');
		});
	});

	describe('exclude self when target tiddler is not string', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: "<$transclude $tiddler={{TestOutgoing!!title}} $field='created'/> and <$transclude tiddler={{TestOutgoing!!title}} field='created'/>"});

		it('should have no transclude', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[transcludes[]]').join(',')).toBe('');
		});

		it('should have no back transcludes', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[backtranscludes[]]').join(',')).toBe('');
		});
	});

	describe('recognize transclusion defined by widget', function() {
		var wiki = new $tw.Wiki();

		wiki.addTiddler({
			title: 'TestOutgoing',
			text: "<$tiddler tiddler='TestIncoming'><$transclude $tiddler /></$tiddler>\n\n<$transclude tiddler='TiddlyWiki Pre-release'/>"});

		it('should have a transclude', function() {
			expect(wiki.filterTiddlers('TestOutgoing +[transcludes[]]').join(',')).toBe('TestIncoming,TiddlyWiki Pre-release');
		});

		it('should have a back transclude', function() {
			expect(wiki.filterTiddlers('TestIncoming +[backtranscludes[]]').join(',')).toBe('TestOutgoing');
			expect(wiki.filterTiddlers('[[TiddlyWiki Pre-release]] +[backtranscludes[]]').join(',')).toBe('TestOutgoing');
		});
	});
});
