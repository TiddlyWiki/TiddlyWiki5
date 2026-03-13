/*\
title: test-core-api-schema.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for core-api-schema, core-api-attributes, and core-api-docs plugins.

These tests are data-driven: they discover all relevant tiddlers via filters and
schema lookups, so adding new operator or widget docs is automatically validated
without changing the tests.

\*/
"use strict";

describe("Core API Schema", function() {
	function getSchemaTitles() {
		return $tw.wiki.filterTiddlers("[all[shadows+tiddlers]prefix[$:/schemas/]tag[$:/tags/Schema]]");
	}

	function getSchemaTiddler(schemaTitle) {
		return $tw.wiki.getTiddler(schemaTitle);
	}

	function getSchemaFieldNames(schemaTitle) {
		var schemaTiddler = getSchemaTiddler(schemaTitle);
		if(!schemaTiddler) {
			return [];
		}
		return $tw.utils.parseStringArray(schemaTiddler.fields.fields || "");
	}

	function getFieldSchemaTiddler(schemaTitle,fieldName) {
		return $tw.wiki.getTiddler(schemaTitle + "/" + fieldName);
	}

	function makeValidFieldValue(fieldSchemaTiddler) {
		var fieldType = fieldSchemaTiddler.fields["field-type"] || "string";
		if(fieldType === "enum") {
			var allowedValues = $tw.utils.parseStringArray(fieldSchemaTiddler.fields["enum-values"] || "");
			return allowedValues[0] || "yes";
		}
		if(fieldType === "number") {
			return "1";
		}
		if(fieldType === "boolean" || fieldType === "yes-no") {
			return "yes";
		}
		if(fieldType === "list") {
			return "a b";
		}
		return "x";
	}

	function getSchemaWithRequiredField() {
		var schemaTitles = getSchemaTitles();
		for(var s = 0; s < schemaTitles.length; s++) {
			var schemaTitle = schemaTitles[s],
				fieldNames = getSchemaFieldNames(schemaTitle);
			for(var f = 0; f < fieldNames.length; f++) {
				var fieldName = fieldNames[f],
					fieldSchemaTiddler = getFieldSchemaTiddler(schemaTitle,fieldName);
				if(fieldSchemaTiddler && fieldSchemaTiddler.fields.required === "yes") {
					return {
						schemaTitle: schemaTitle,
						fieldName: fieldName,
						fieldNames: fieldNames
					};
				}
			}
		}
		return null;
	}

	function getSchemaWithEnumField() {
		var schemaTitles = getSchemaTitles();
		for(var s = 0; s < schemaTitles.length; s++) {
			var schemaTitle = schemaTitles[s],
				fieldNames = getSchemaFieldNames(schemaTitle);
			for(var f = 0; f < fieldNames.length; f++) {
				var fieldName = fieldNames[f],
					fieldSchemaTiddler = getFieldSchemaTiddler(schemaTitle,fieldName);
				if(fieldSchemaTiddler && fieldSchemaTiddler.fields["field-type"] === "enum" && fieldSchemaTiddler.fields["enum-values"]) {
					return {
						schemaTitle: schemaTitle,
						fieldName: fieldName,
						fieldNames: fieldNames,
						fieldSchemaTiddler: fieldSchemaTiddler
					};
				}
			}
		}
		return null;
	}

	function getSchemaAppliedResults(schemaTitle) {
		return $tw.utils.validateAllBySchema($tw.wiki,schemaTitle);
	}

	function getProseTitleFromDocsTitle(docsTitle) {
		if(docsTitle.indexOf("$:/docs/filter-operators/") === 0) {
			return docsTitle.replace("$:/docs/filter-operators/","") + " Operator";
		}
		if(docsTitle.indexOf("$:/docs/widgets/") === 0 && docsTitle.indexOf("/attributes/") === -1) {
			return docsTitle.replace("$:/docs/widgets/","");
		}
		return null;
	}

	// ─── utilities ──────────────────────────────────────────────────────────────

	describe("utilities", function() {

		it("should expose validateTiddlerSchema", function() {
			expect(typeof $tw.utils.validateTiddlerSchema).toBe("function");
		});

		it("should expose validateAllBySchema", function() {
			expect(typeof $tw.utils.validateAllBySchema).toBe("function");
		});

		it("should expose getAllSchemas", function() {
			expect(typeof $tw.utils.getAllSchemas).toBe("function");
		});

		it("should support schema-driven non-dollar widget attributes end-to-end", function() {
			var schemaField = $tw.wiki.getTiddler("$:/schemas/WidgetDocs/any-attributes-not-starting-with-$");
			expect(schemaField).toBeDefined();
			expect(schemaField.fields["field-type"]).toBe("enum");
			expect(schemaField.fields["enum-values"]).toContain("yes");

			var actionCreateDoc = $tw.wiki.getTiddler("$:/docs/widgets/ActionCreateTiddlerWidget");
			expect(actionCreateDoc).toBeDefined();
			expect(actionCreateDoc.fields["any-attributes-not-starting-with-$"]).toBe("yes");
		});

	});

	// ─── schema self-consistency ─────────────────────────────────────────────────
	// For each registered schema, every field named in its `fields` list must have
	// a sub-tiddler definition.  This catches typos and missing field definitions
	// without needing per-schema hardcoded checks.

	describe("schema self-consistency", function() {

		it("should discover schema root tiddlers under $:/schemas/", function() {
			var schemas = getSchemaTitles();
			expect(schemas.length).toBeGreaterThan(0);
		});

		it("every field declared in every schema should have a sub-tiddler definition", function() {
			var schemas = getSchemaTitles();
			expect(schemas.length).toBeGreaterThan(0);
			$tw.utils.each(schemas, function(schemaTitle) {
				var schema = getSchemaTiddler(schemaTitle);
				expect(schema).withContext("Schema tiddler not found: " + schemaTitle).toBeDefined();
				var declaredFields = getSchemaFieldNames(schemaTitle);
				expect(declaredFields.length)
					.withContext("Schema " + schemaTitle + " has no 'fields' list")
					.toBeGreaterThan(0);
				$tw.utils.each(declaredFields, function(fieldName) {
					var subTitle = schemaTitle + "/" + fieldName;
					expect($tw.wiki.getTiddler(subTitle))
						.withContext("Missing field definition sub-tiddler: " + subTitle)
						.toBeDefined();
				});
			});
		});

		it("all tiddlers that apply each schema should pass validation", function() {
			var schemas = getSchemaTitles();
			$tw.utils.each(schemas, function(schemaTitle) {
				var results = getSchemaAppliedResults(schemaTitle);
				expect(results.length)
					.withContext("No tiddlers found applying schema " + schemaTitle)
					.toBeGreaterThanOrEqual(1);
				$tw.utils.each(results, function(result) {
					expect(result.valid)
						.withContext("[" + result.tiddlerTitle + "] " + result.errors.join("; "))
						.toBe(true);
				});
			});
		});

	});

	// ─── separation of prose and structured data (schema-driven) ─────────────────

	describe("separation of prose and structured data", function() {

		it("paired prose docs should not duplicate any fields declared by their structured schema", function() {
			var docsTiddlers = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]prefix[$:/docs/]has[schema]]");
			expect(docsTiddlers.length).toBeGreaterThanOrEqual(1);
			$tw.utils.each(docsTiddlers, function(docsTitle) {
				var docsTiddler = $tw.wiki.getTiddler(docsTitle);
				if(!docsTiddler || !docsTiddler.fields.schema) {
					return;
				}
				var proseTitle = getProseTitleFromDocsTitle(docsTitle),
					proseTiddler = proseTitle ? $tw.wiki.getTiddler(proseTitle) : null;
				if(!proseTiddler) {
					return;
				}
				var schemaFields = getSchemaFieldNames(docsTiddler.fields.schema);
				$tw.utils.each(schemaFields, function(fieldName) {
					expect(proseTiddler.fields[fieldName])
						.withContext("Prose tiddler '" + proseTitle + "' duplicates schema field '" + fieldName + "' from " + docsTitle)
						.toBeUndefined();
				});
			});
		});

		it("when a schema declares a 'caption' field, its applied tiddlers should provide caption", function() {
			var schemas = getSchemaTitles();
			$tw.utils.each(schemas, function(schemaTitle) {
				var schemaFields = getSchemaFieldNames(schemaTitle);
				if(schemaFields.indexOf("caption") === -1) {
					return;
				}
				var results = getSchemaAppliedResults(schemaTitle);
				$tw.utils.each(results, function(result) {
					var tiddler = $tw.wiki.getTiddler(result.tiddlerTitle),
						caption = tiddler && tiddler.fields ? tiddler.fields.caption : "";
					expect(!!caption)
						.withContext("Schema " + schemaTitle + " declares caption, but missing on " + result.tiddlerTitle)
						.toBe(true);
				});
			});
		});

	});

	// ─── schema violation detection ──────────────────────────────────────────────
	// These tests exercise the validator's own logic using synthetic tiddlers,
	// ensuring it correctly catches schema violations.

	describe("schema violation detection", function() {

		it("should report missing required field", function() {
			var schemaWithRequired = getSchemaWithRequiredField();
			expect(schemaWithRequired).not.toBeNull();
			var fields = {
				title: "$:/test/schema/missing-required",
				schema: schemaWithRequired.schemaTitle
			};
			$tw.utils.each(schemaWithRequired.fieldNames, function(fieldName) {
				var fieldSchemaTiddler = getFieldSchemaTiddler(schemaWithRequired.schemaTitle,fieldName);
				if(fieldSchemaTiddler && fieldSchemaTiddler.fields.required === "yes" && fieldName !== schemaWithRequired.fieldName) {
					fields[fieldName] = makeValidFieldValue(fieldSchemaTiddler);
				}
			});
			$tw.wiki.addTiddler(new $tw.Tiddler(fields));
			var result = $tw.utils.validateTiddlerSchema($tw.wiki, "$:/test/schema/missing-required");
			expect(result.valid).toBe(false);
			expect(result.errors.some(function(e) {
				return e.indexOf(schemaWithRequired.fieldName) !== -1;
			})).toBe(true);
			$tw.wiki.deleteTiddler("$:/test/schema/missing-required");
		});

		it("should report invalid enum value", function() {
			var schemaWithEnum = getSchemaWithEnumField();
			expect(schemaWithEnum).not.toBeNull();
			var fields = {
				title: "$:/test/schema/bad-enum",
				schema: schemaWithEnum.schemaTitle
			};
			$tw.utils.each(schemaWithEnum.fieldNames, function(fieldName) {
				var fieldSchemaTiddler = getFieldSchemaTiddler(schemaWithEnum.schemaTitle,fieldName);
				if(fieldSchemaTiddler && fieldSchemaTiddler.fields.required === "yes") {
					fields[fieldName] = makeValidFieldValue(fieldSchemaTiddler);
				}
			});
			fields[schemaWithEnum.fieldName] = "__invalid_enum_value__";
			$tw.wiki.addTiddler(new $tw.Tiddler(fields));
			var result = $tw.utils.validateTiddlerSchema($tw.wiki, "$:/test/schema/bad-enum");
			expect(result.valid).toBe(false);
			expect(result.errors.some(function(e) {
				return e.indexOf(schemaWithEnum.fieldName) !== -1;
			})).toBe(true);
			$tw.wiki.deleteTiddler("$:/test/schema/bad-enum");
		});

		// schema can be inherited from a tag tiddler that carries a `schema` field
		it("should validate via tag-inherited schema", function() {
			var schemaWithRequired = getSchemaWithRequiredField();
			expect(schemaWithRequired).not.toBeNull();
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/tag-with-schema",
				schema: schemaWithRequired.schemaTitle
			}));
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/tagged-no-op-purpose",
				tags: ["$:/test/schema/tag-with-schema"]
				// One required field in schema is intentionally absent
			}));
			var result = $tw.utils.validateTiddlerSchema($tw.wiki, "$:/test/schema/tagged-no-op-purpose");
			expect(result.valid).toBe(false);
			expect(result.schemaTitle).toBe(schemaWithRequired.schemaTitle);
			expect(result.errors.some(function(e) {
				return e.indexOf(schemaWithRequired.fieldName) !== -1;
			})).toBe(true);
			$tw.wiki.deleteTiddler("$:/test/schema/tag-with-schema");
			$tw.wiki.deleteTiddler("$:/test/schema/tagged-no-op-purpose");
		});

		it("should pass for a tiddler without a schema declaration", function() {
			var result = $tw.utils.validateTiddlerSchema($tw.wiki, "$:/core");
			expect(result.valid).toBe(true);
			expect(result.schemaTitle).toBeNull();
		});

		it("should enforce number field-type", function() {
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/NumberType",
				tags: ["$:/tags/Schema"],
				fields: "amount"
			}));
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/NumberType/amount",
				"field-type": "number",
				required: "yes"
			}));
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/number-invalid",
				schema: "$:/test/schema/NumberType",
				amount: "not-a-number"
			}));
			var invalidResult = $tw.utils.validateTiddlerSchema($tw.wiki, "$:/test/schema/number-invalid");
			expect(invalidResult.valid).toBe(false);
			expect(invalidResult.errors.some(function(e) { return e.indexOf("valid 'number'") !== -1; })).toBe(true);

			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/number-valid",
				schema: "$:/test/schema/NumberType",
				amount: "42.5"
			}));
			var validResult = $tw.utils.validateTiddlerSchema($tw.wiki, "$:/test/schema/number-valid");
			expect(validResult.valid).toBe(true);

			$tw.wiki.deleteTiddler("$:/test/schema/number-invalid");
			$tw.wiki.deleteTiddler("$:/test/schema/number-valid");
			$tw.wiki.deleteTiddler("$:/test/schema/NumberType/amount");
			$tw.wiki.deleteTiddler("$:/test/schema/NumberType");
		});

		it("should enforce yes-no field-type", function() {
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/YesNoType",
				tags: ["$:/tags/Schema"],
				fields: "flag"
			}));
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/YesNoType/flag",
				"field-type": "yes-no",
				required: "yes"
			}));
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/yesno-invalid",
				schema: "$:/test/schema/YesNoType",
				flag: "maybe"
			}));
			var invalidResult = $tw.utils.validateTiddlerSchema($tw.wiki, "$:/test/schema/yesno-invalid");
			expect(invalidResult.valid).toBe(false);
			expect(invalidResult.errors.some(function(e) { return e.indexOf("valid 'yes-no'") !== -1; })).toBe(true);

			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/test/schema/yesno-valid",
				schema: "$:/test/schema/YesNoType",
				flag: "yes"
			}));
			var validResult = $tw.utils.validateTiddlerSchema($tw.wiki, "$:/test/schema/yesno-valid");
			expect(validResult.valid).toBe(true);

			$tw.wiki.deleteTiddler("$:/test/schema/yesno-invalid");
			$tw.wiki.deleteTiddler("$:/test/schema/yesno-valid");
			$tw.wiki.deleteTiddler("$:/test/schema/YesNoType/flag");
			$tw.wiki.deleteTiddler("$:/test/schema/YesNoType");
		});

	});

});
