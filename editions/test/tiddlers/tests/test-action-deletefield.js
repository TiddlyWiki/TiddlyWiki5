/*\
title: test-action-deletefield.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests <$action-deletefield />.

\*/
"use strict";

describe("<$action-deletefield /> tests", function() {

const TEST_TIDDLER_TITLE = "TargetTiddler";
const TEST_TIDDLER_MODIFIED = "20240313114828368";

function setupWiki(condition, targetField, wikiOptions) {
	// Create a wiki
	var wiki = new $tw.Wiki({});
	var tiddlers = [{
		title: "Root",
		text: "Some dummy content"
	}];
	var tiddler;
	if(condition.targetTiddlerExists) {
		var fields = {
			title: TEST_TIDDLER_TITLE,
		};
		if(condition.modifiedFieldExists) {
			fields.modified = TEST_TIDDLER_MODIFIED;
		}
		if(condition.targetFieldExists) {
			fields[targetField] = "some text";
		}
		var tiddler = new $tw.Tiddler(fields);
		tiddlers.push(tiddler);
	}
	wiki.addTiddlers(tiddlers);
	wiki.addIndexersToWiki();
	var widgetNode = wiki.makeTranscludeWidget("Root",{document: $tw.fakeDocument, parseAsInline: true});
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return {
		wiki: wiki,
		widgetNode: widgetNode,
		contaienr: container,
		tiddler: tiddler,
	};
}

function generateTestConditions() {
	var conditions = [];

	$tw.utils.each([true, false], function(tiddlerArgumentIsPresent) {
		$tw.utils.each([true, false], function(targetTiddlerExists) {
			$tw.utils.each([true, false], function(targetFieldExists) {
				$tw.utils.each([true, false], function(fieldArgumentIsUsed) {
					$tw.utils.each([true, false], function(modifiedFieldExists) {
						$tw.utils.each(["", "yes", "no"], function(timestampArgument) {
							conditions.push({
								tiddlerArgumentIsPresent: tiddlerArgumentIsPresent,
								targetTiddlerExists: targetTiddlerExists,
								targetFieldExists: targetFieldExists,
								fieldArgumentIsUsed: fieldArgumentIsUsed,
								modifiedFieldExists: modifiedFieldExists,
								timestampArgument: timestampArgument,
							});
						});
					});
				});
			});
		});
	});

	return conditions;
}

function generateActionWikitext(condition, targetField) {
	var actionPieces = [
		"<$action-deletefield",
		(condition.tiddlerArgumentIsPresent ? "$tiddler='" + TEST_TIDDLER_TITLE + "'" : ""),
		(condition.fieldArgumentIsUsed ? "$field='" + targetField + "'" : targetField),
		(condition.timestampArgument !== "" ? "$timestamp='" + condition.timestampArgument + "'" : ""),
		"/>",
	];

	return actionPieces.join(" ");
}

function generateTestContext(action, tiddler) {
	var expectationContext = "action: " + action + "\ntiddler:\n\n";
	if(tiddler) {
		expectationContext += tiddler.getFieldStringBlock({exclude: ["text"]});
		if(tiddler.text) {
			expectationContext += "\n\n" + tiddler.text;
		}
		expectationContext += "\n\n";
	} else {
		expectationContext += "null";
	}

	return expectationContext;
}

it("should correctly delete fields", function() {
	var fields = ['caption', 'description', 'text'];

	var conditions = generateTestConditions();

	$tw.utils.each(conditions, function(condition) {
		$tw.utils.each(fields, function(field) {
			var info = setupWiki(condition, field);
			var originalTiddler = info.tiddler;

			var invokeActions = function(actions) {
				info.widgetNode.invokeActionString(actions,info.widgetNode,null,{
					currentTiddler: TEST_TIDDLER_TITLE,
				});
			};

			var action = generateActionWikitext(condition,field);

			invokeActions(action);

			var testContext = generateTestContext(action,originalTiddler);

			var tiddler = info.wiki.getTiddler(TEST_TIDDLER_TITLE);
			if(originalTiddler) {
				// assert that the tiddler doesn't have the target field anymore
				expect(tiddler.hasField(field)).withContext(testContext).toBeFalsy();

				var targetFieldWasPresent = originalTiddler.hasField(field);
				var updateTimestamps = condition.timestampArgument !== "no";

				// "created" should exist if it did beforehand, or if the tiddler changed and we asked the widget to update timestamps
				var createdFieldShouldExist = originalTiddler.hasField("created") || (targetFieldWasPresent && updateTimestamps);

				// "created" should change only if it didn't exist beforehand and the tiddler changed and we asked the widget to update timestamps
				var createdFieldShouldChange = !originalTiddler.hasField("created") && (targetFieldWasPresent && updateTimestamps);

				// "modified" should exist if it did beforehand, or if the tiddler changed and we asked the widget to update timestamps
				var modifiedFieldShouldExist = originalTiddler.hasField("modified") || (targetFieldWasPresent && updateTimestamps);

				// "modified" should change if the tiddler changed and we asked the widget to update timestamps
				var modifiedFieldShouldChange = targetFieldWasPresent && updateTimestamps;

				expect(tiddler.hasField("created")).withContext(testContext).toBe(createdFieldShouldExist);
				expect(tiddler.hasField("modified")).withContext(testContext).toBe(modifiedFieldShouldExist);

				if(createdFieldShouldChange) {
					expect(tiddler.fields.created).withContext(testContext).not.toEqual(originalTiddler.fields.created);
				} else {
					expect(tiddler.fields.created).withContext(testContext).toEqual(originalTiddler.fields.created);
				}

				if(modifiedFieldShouldChange) {
					expect(tiddler.fields.modified).withContext(testContext).not.toEqual(originalTiddler.fields.modified);
				} else {
					expect(tiddler.fields.modified).withContext(testContext).toEqual(originalTiddler.fields.modified);
				}
			} else {
				// assert that the tiddler didn't get created if it didn't exist already
				expect(tiddler).withContext(testContext).toBeUndefined();
			}
		});
	});
});

});
