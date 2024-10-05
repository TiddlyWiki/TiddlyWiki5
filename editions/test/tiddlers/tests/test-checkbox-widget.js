/*\
title: testcheckbox-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the checkbox widget thoroughly.

\*/
(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";
    
    describe("Checkbox widget", function() {
    
        var widget = require("$:/core/modules/widgets/widget.js");
    
        function createWidgetNode(parseTreeNode,wiki) {
            return new widget.widget(parseTreeNode,{
                    wiki: wiki,
                    document: $tw.fakeDocument
                });
        }
    
        function parseText(text,wiki,options) {
            var parser = wiki.parseText("text/vnd.tiddlywiki",text,options);
            return parser ? {type: "widget", children: parser.tree} : undefined;
        }
    
        function renderWidgetNode(widgetNode) {
            $tw.fakeDocument.setSequenceNumber(0);
            var wrapper = $tw.fakeDocument.createElement("div");
            widgetNode.render(wrapper,null);
            return wrapper;
        }

        // Find a particular type of node from inside the widget tree
        // Less brittle than wrapper.children[0].children[0] if the parse
        // tree ever changes in the future
        function findNodeOfType(targetType, currentNode) {
            if(currentNode.parseTreeNode && currentNode.parseTreeNode.type === targetType) {
                return currentNode;
            } else if(currentNode.children && currentNode.children.length) {
                var child, result, i;
                for (i = 0; i < currentNode.children.length; i++) {
                    child = currentNode.children[i];
                    result = findNodeOfType(targetType, child);
                    if(result) return result;
                }
            }
            return undefined;
        }

        /*
         * Test data for checkbox widget tests
         */
    
        var fieldModeTests = [
            {
                testName: "field mode checked",
                tiddlers: [{title: "TiddlerOne", text: "Jolly Old World", expand: "yes"}],
                widgetText: "<$checkbox tiddler='TiddlerOne' field='expand' checked='yes' />",
                startsOutChecked: true,
                expectedChange: { "TiddlerOne": { expand: undefined } }
            },
            {
                testName: "field mode unchecked",
                tiddlers: [{title: "TiddlerOne", text: "Jolly Old World", expand: "no"}],
                widgetText: "<$checkbox tiddler='TiddlerOne' field='expand' unchecked='no' />",
                startsOutChecked: false,
                expectedChange: { "TiddlerOne": { expand: undefined } }
            },
            {
                testName: "field mode toggle",
                tiddlers: [{title: "TiddlerOne", text: "Jolly Old World", expand: "no"}],
                widgetText: "<$checkbox tiddler='TiddlerOne' field='expand' checked='yes' unchecked='no' />",
                startsOutChecked: false,
                expectedChange: { "TiddlerOne": { expand: "yes" } }
            },
            {
                testName: "field mode indeterminate -> true",
                tiddlers: [{title: "TiddlerOne", text: "Jolly Old World", expand: "some other value"}],
                widgetText: "<$checkbox tiddler='TiddlerOne' field='expand' indeterminate='yes' checked='yes' unchecked='no' />",
                startsOutChecked: undefined,
                expectedChange: { "TiddlerOne": { expand: "yes" } }
            },
            // true -> indeterminate cannot happen in field mode
            {
                testName: "field mode not indeterminate",
                tiddlers: [{title: "TiddlerOne", text: "Jolly Old World", expand: "some other value"}],
                widgetText: "<$checkbox tiddler='TiddlerOne' field='expand' indeterminate='' checked='yes' unchecked='no' />",
                startsOutChecked: false,
                expectedChange: { "TiddlerOne": { expand: "yes" } }
            },
        ];

        var indexModeTests = fieldModeTests.map(data => {
            var newData = {...data};
            var newName = data.testName.replace('field mode', 'index mode');
            var newTiddlers = data.tiddlers.map(tiddler => {
                return {title: tiddler.title, type: "application/x-tiddler-dictionary", text: `one: a\nexpand: ${tiddler.expand}\ntwo: b`}
            });
            var newWidgetText = data.widgetText.replace("field='expand'", "index='expand'");
            var newChange = {};
            for (var key of Object.keys(data.expectedChange)) {
                var oldChange = data.expectedChange[key];
                if (oldChange.expand) {
                    newChange[key] = { text: `one: a\nexpand: ${oldChange.expand}\ntwo: b` }
                } else {
                    // In index tiddlers, the "expand" field gets completely removed, not turned into "expand: (undefined)"
                    newChange[key] = { text: `one: a\ntwo: b` }
                }
            }
            newData.testName = newName;
            newData.tiddlers = newTiddlers;
            newData.widgetText = newWidgetText;
            newData.expectedChange = newChange;
            return newData;
        });

        var listModeTestsForDateFields = [
            {
                testName: "list mode created date field",
                tiddlers: [{title: "Colors", created: "201304152222", modified: "202301022222"}],
                widgetText: "<$checkbox tiddler='Colors' listField='created' checked='green' />",
                startsOutChecked: false,
                finalValue: false,
                expectedChange: { "Colors": { created: new Date("2013-04-15T22:22:00Z")}} // created field should *not* be touched by a listField checkbox
            },
            {
                testName: "list mode modified date field",
                tiddlers: [{title: "Colors", created: "201304152222", modified: "202301022222"}],
                widgetText: "<$checkbox tiddler='Colors' listField='modified' checked='green' />",
                startsOutChecked: false,
                finalValue: false,
                expectedChange: { "Colors": { modified: new Date("2023-01-02T22:22:00Z")}} // modified field should *not* be touched by a listField checkbox
            },
        ]

        var listModeTests = [
            {
                testName: "list mode add",
                tiddlers: [{title: "Colors", colors: "orange yellow"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' checked='green' />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "list mode remove",
                tiddlers: [{title: "Colors", colors: "green orange yellow"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' checked='green' />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "orange yellow" } }
            },
            {
                testName: "list mode remove inverted",
                tiddlers: [{title: "Colors", colors: "red orange yellow"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' unchecked='red' />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow" } }
            },
            {
                testName: "list mode remove in middle position",
                tiddlers: [{title: "Colors", colors: "orange green yellow"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' checked='green' />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "orange yellow" } }
            },
            {
                testName: "list mode remove in middle position inverted",
                tiddlers: [{title: "Colors", colors: "orange red yellow"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' unchecked='red' />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow" } }
            },
            {
                testName: "list mode remove in final position",
                tiddlers: [{title: "Colors", colors: "orange yellow green"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' checked='green' />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "orange yellow" } }
            },
            {
                testName: "list mode remove in final position inverted",
                tiddlers: [{title: "Colors", colors: "orange yellow red"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' unchecked='red' />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow" } }
            },
            {
                testName: "list mode toggle",
                tiddlers: [{title: "Colors", colors: "red orange yellow"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' unchecked='red' checked='green' />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "green orange yellow" } }
            },
            {
                testName: "list mode toggle in middle position",
                tiddlers: [{title: "Colors", colors: "orange red yellow"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' unchecked='red' checked='green' />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange green yellow" } }
            },
            {
                testName: "list mode remove in final position",
                tiddlers: [{title: "Colors", colors: "orange yellow red"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' unchecked='red' checked='green' />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "list mode neither checked nor unchecked specified: field value remains unchanged",
                tiddlers: [{title: "Colors", colors: "orange yellow red"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' />",
                startsOutChecked: true,
                finalValue: true,
                expectedChange: { "Colors": { colors: "orange yellow red" } }
            },
            {
                testName: "list mode neither checked nor unchecked specified, but actions specified to change field value",
                tiddlers: [{title: "ExampleTiddler", someField: "yes"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='ExampleTiddler' $field='someField' $filter='yes'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='ExampleTiddler' $field='someField' $filter='-yes'/>\n" +
                            "<$checkbox tiddler='ExampleTiddler' listField='someField' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                expectedChange: { "ExampleTiddler": { someField: "" } }
            },
            {
                testName: "list mode neither checked nor unchecked specified, means field value is treated as empty=false, nonempty=true",
                tiddlers: [{title: "ExampleTiddler", someField: "yes"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='ExampleTiddler' $field='someField' $filter='yes -no'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='ExampleTiddler' $field='someField' $filter='-yes no'/>\n" +
                            "<$checkbox tiddler='ExampleTiddler' listField='someField' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                finalValue: true, // "no" is considered true when neither `checked` nor `unchecked` is specified
                expectedChange: { "ExampleTiddler": { someField: "no" } }
            },
            {
                testName: "list mode indeterminate -> true",
                tiddlers: [{title: "Colors", colors: "orange"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' indeterminate='yes' unchecked='red' checked='green' />",
                startsOutChecked: undefined,
                expectedChange: { "Colors": { colors: "orange green" } }
            },
            // true -> indeterminate cannot happen in list mode
            {
                testName: "list mode not indeterminate",
                tiddlers: [{title: "Colors", colors: "orange"}],
                widgetText: "<$checkbox tiddler='Colors' listField='colors' unchecked='red' checked='green' />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange green" } }
            },
        ];

        // https://github.com/TiddlyWiki/TiddlyWiki5/issues/6871
        var listModeTestsWithListField = (
            listModeTests
            .filter(data => data.widgetText.includes("listField='colors'"))
            .map(data => {
                var newData = {
                    ...data,
                    tiddlers: data.tiddlers.map(tiddler => ({...tiddler, list: tiddler.colors, colors: undefined})),
                    widgetText: data.widgetText.replace("listField='colors'", "listField='list'"),
                    expectedChange: {
                        "Colors": { list: data.expectedChange.Colors.colors.split(' ') }
                    },
                }
                return newData;
            })
        );
        var listModeTestsWithTagsField = (
            listModeTests
            .filter(data => data.widgetText.includes("listField='colors'"))
            .map(data => {
                var newData = {
                    ...data,
                    tiddlers: data.tiddlers.map(tiddler => ({...tiddler, tags: tiddler.colors, colors: undefined})),
                    widgetText: data.widgetText.replace("listField='colors'", "listField='tags'"),
                    expectedChange: {
                        "Colors": { tags: data.expectedChange.Colors.colors.split(' ') }
                    },
                }
                return newData;
            })
        );

        var indexListModeTests = listModeTests.map(data => {
            var newData = {...data};
            var newName = data.testName.replace('list mode', 'index list mode');
            var newTiddlers = data.tiddlers.map(tiddler => {
                if (tiddler.hasOwnProperty('colors')) {
                    return {title: tiddler.title, type: "application/x-tiddler-dictionary", text: `one: a\ncolors: ${tiddler.colors}\ntwo: b`}
                } else if (tiddler.hasOwnProperty('someField')) {
                    return {title: tiddler.title, type: "application/x-tiddler-dictionary", text: `one: a\nsomeField: ${tiddler.someField}\ntwo: b`}
                }
            });
            var newWidgetText = data.widgetText.replace("listField='colors'", "listIndex='colors'").replace(/\$field/g, '$index').replace("listField='someField'", "listIndex='someField'");
            var newChange = {};
            for (var key of Object.keys(data.expectedChange)) {
                var oldChange = data.expectedChange[key];
                if (oldChange.colors) {
                    newChange[key] = { text: `one: a\ncolors: ${oldChange.colors}\ntwo: b` }
                } else if (oldChange.someField !== undefined) {
                    newChange[key] = { text: `one: a\nsomeField: ${oldChange.someField}\ntwo: b` }
                } else {
                    // In index tiddlers, fields with value undefined get completely removed
                    newChange[key] = { text: `one: a\ntwo: b` }
                }
            }
            newData.testName = newName;
            newData.tiddlers = newTiddlers;
            newData.widgetText = newWidgetText;
            newData.expectedChange = newChange;
            return newData;
        });

        var filterModeTests = [
            {
                testName: "filter mode false -> true",
                tiddlers: [{title: "Colors", colors: "red orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' unchecked='red' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "filter mode true -> false",
                tiddlers: [{title: "Colors", colors: "green orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' unchecked='red' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "orange yellow red" } }
            },
            {
                testName: "filter mode no default false -> true",
                tiddlers: [{title: "Colors", colors: "red orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' unchecked='red' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "filter mode no default true -> false",
                tiddlers: [{title: "Colors", colors: "green orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' unchecked='red' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "orange yellow red" } }
            },
            {
                testName: "filter mode only checked specified false -> true",
                tiddlers: [{title: "Colors", colors: "red orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "filter mode only checked specified true -> false",
                tiddlers: [{title: "Colors", colors: "green orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "orange yellow red" } }
            },
            {
                testName: "filter mode only checked specified no default false -> true",
                tiddlers: [{title: "Colors", colors: "red orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "filter mode only checked specified no default true -> false",
                tiddlers: [{title: "Colors", colors: "green orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "orange yellow red" } }
            },
            {
                testName: "filter mode only unchecked specified false -> true",
                tiddlers: [{title: "Colors", colors: "red orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' unchecked='red' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "filter mode only unchecked specified true -> false",
                tiddlers: [{title: "Colors", colors: "green orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' unchecked='red' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "orange yellow red" } }
            },
            {
                testName: "filter mode only unchecked specified no default false -> true",
                tiddlers: [{title: "Colors", colors: "red orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' unchecked='red' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "filter mode only unchecked specified no default true -> false",
                tiddlers: [{title: "Colors", colors: "green orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-red green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='red -green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' unchecked='red' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "orange yellow red" } }
            },
            {
                testName: "filter mode neither checked nor unchecked specified false -> true",
                tiddlers: [{title: "Colors"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "green" } }
            },
            {
                testName: "filter mode neither checked nor unchecked specified true -> false",
                tiddlers: [{title: "Colors", colors: "green"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "" } }
            },
            {
                testName: "filter mode neither checked nor unchecked no default specified false -> true",
                tiddlers: [{title: "Colors", colors: ""}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "green" } }
            },
            {
                testName: "filter mode neither checked nor unchecked no default specified true -> false",
                tiddlers: [{title: "Colors", colors: "green"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                expectedChange: { "Colors": { colors: "" } }
            },

            {
                testName: "filter mode indeterminate -> true",
                tiddlers: [{title: "Colors", colors: "orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' indeterminate='yes' checked='green' unchecked='red' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: undefined,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "filter mode true -> indeterminate",
                tiddlers: [{title: "Colors", colors: "green orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' indeterminate='yes' checked='green' unchecked='red' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                finalValue: undefined,
                expectedChange: { "Colors": { colors: "orange yellow" } }
            },
            {
                testName: "filter mode not indeterminate -> true",
                tiddlers: [{title: "Colors", colors: "orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' unchecked='red' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: false,
                expectedChange: { "Colors": { colors: "orange yellow green" } }
            },
            {
                testName: "filter mode true -> not indeterminate",
                tiddlers: [{title: "Colors", colors: "green orange yellow"}],
                widgetText: "\\define checkActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='green'/>\n" +
                            "\\define uncheckActions() <$action-listops $tiddler='Colors' $field='colors' $subfilter='-green'/>\n" +
                            "<$checkbox filter='[list[Colors!!colors]]' checked='green' unchecked='red' default='green' checkactions=<<checkActions>> uncheckactions=<<uncheckActions>> />",
                startsOutChecked: true,
                finalValue: false,
                expectedChange: { "Colors": { colors: "orange yellow" } }
            },
        ];

        var checkboxTestData = fieldModeTests.concat(
            indexModeTests,
            listModeTests,
            listModeTestsForDateFields,
            listModeTestsWithListField,
            listModeTestsWithTagsField,
            indexListModeTests,
            filterModeTests,
        );
    
        /*
         * Checkbox widget tests using the test data above
         */
        for (var data of checkboxTestData) {
            it('checkbox widget test: ' + data.testName, function() {
                // Setup
    
                var wiki = new $tw.Wiki();
                wiki.addTiddlers(data.tiddlers);
                var widgetNode = createWidgetNode(parseText(data.widgetText,wiki),wiki);
                var wrapper = renderWidgetNode(widgetNode);
    
                // Check initial state
    
                var widget = findNodeOfType('checkbox', widgetNode);
                // Verify that the widget is or is not checked as expected
                expect(widget.getValue()).toBe(data.startsOutChecked);
    
                // Fake an event that toggles the checkbox
    
                // fakedom elmenets don't have a "checked" property. so we fake it because
                // Checkbox.prototype.handleChangeEvent looks at the "checked" DOM property
                widget.inputDomNode.checked = !!widget.inputDomNode.attributes.checked;
                // Now simulate checking the box
                widget.inputDomNode.checked = !widget.inputDomNode.checked;
                widget.handleChangeEvent(null);
    
                // Check state again: in most tests, checkbox should be inverse of what it was
                var finalValue = data.hasOwnProperty('finalValue') ? data.finalValue : !data.startsOutChecked;
                expect(widget.getValue()).toBe(finalValue);
    
                // Check that tiddler(s) has/have gone through expected change(s)
                for (var key of Object.keys(data.expectedChange)) {
                    var tiddler = wiki.getTiddler(key);
                    var change = data.expectedChange[key];
                    for (var fieldName of Object.keys(change)) {
                        var expectedValue = change[fieldName];
                        var fieldValue = tiddler.fields[fieldName];
                        expect(fieldValue).toEqual(expectedValue);
                    }
                }
            })
        }
    
    });
    
})();
    