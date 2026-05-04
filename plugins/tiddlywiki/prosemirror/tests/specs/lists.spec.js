"use strict";

const { test, expect } = require("@playwright/test");
const { setupProseMirrorTest, clearEditor, loadTestPage } = require("../helpers.js");

test.describe("ProseMirror Editor - Lists", () => {
	test("should create bulleted list", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("* Item 1");
		const list = editor.locator(".prosemirror-flat-list").first();
		await expect(list).toBeVisible();
		await expect(list.locator(".list-content")).toContainText("Item 1");
	});

	test("should toggle bullet list via prefix-lines operation", async ({ page }) => {
		const editor = await setupProseMirrorTest(page, null, { initialText: "Item 1" });
		await editor.click();

		const toggleBulletList = (el) => {
			const viewEl = el.closest(".ProseMirror") || el;
			function findAllEngines(widget) {
				const results = [];
				if(widget && widget.engine && widget.engine.view) results.push(widget.engine);
				if(widget && widget.children) {
					for(const child of widget.children) results.push.apply(results, findAllEngines(child));
				}
				return results;
			}
			const engine = findAllEngines($tw.rootWidget).find((e) => e.view && e.view.dom === viewEl);
			if(!engine) throw new Error("ProseMirror engine not found");
			engine.handleTextOperationNatively({ param: "prefix-lines", paramObject: { character: "*" } });
		};

		await editor.evaluate(toggleBulletList);
		await expect(editor.locator(".prosemirror-flat-list")).toHaveCount(1);

		await editor.evaluate(toggleBulletList);
		await expect(editor.locator(".prosemirror-flat-list")).toHaveCount(0);
		await expect(editor.locator("p").first()).toContainText("Item 1");
	});

	test("should not add extra paragraph margins inside list items", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("* Item 1");
		const list = editor.locator(".prosemirror-flat-list").first();
		const p = list.locator(".list-content > p").first();
		await expect(p).toBeVisible();
		await expect(p).toHaveCSS("margin-top", "0px");
		await expect(p).toHaveCSS("margin-bottom", "0px");
	});

	test("should match rendered list indentation and line spacing", async ({ page }) => {
		await loadTestPage(page);
		const demoTitle = "$:/plugins/tiddlywiki/prosemirror";
		const exampleTitle = "$:/plugins/tiddlywiki/prosemirror/example";

		await page.evaluate(({ demoTitle, exampleTitle }) => {
			["Compose ballad", "Get the Ring", "Go to Mordor", "Kill the Dragon", "Make the beds"].forEach((t) => {
				$tw.wiki.addTiddler({ title: t, tags: "task", text: "" });
			});
			$tw.wiki.addTiddler({
				title: exampleTitle,
				type: "text/vnd.tiddlywiki",
				text: [
					"# asdf", "# asdf", "",
					"* This is an unordered list", "* It has two items", "",
					"# This is a numbered list", "## With a subitem", "## With second subitem",
					"# And a third item", "", "<<list-links \"[tag[task]sort[title]]\">>"
				].join("\n")
			});
			const storyList = $tw.wiki.getTiddlerList("$:/StoryList");
			if(storyList.indexOf(demoTitle) === -1) {
				storyList.unshift(demoTitle);
				$tw.wiki.addTiddler({ title: "$:/StoryList", list: storyList });
			}
			window.location.hash = "#" + encodeURIComponent(demoTitle);
		}, { demoTitle, exampleTitle });

		const frame = page.locator(`.tc-tiddler-frame[data-tiddler-title="${demoTitle}"]`).first();
		await expect(frame).toBeVisible({ timeout: 10000 });
		await expect(frame.locator(".tc-prosemirror-container .ProseMirror").first()).toBeVisible({ timeout: 10000 });
		await frame.locator('xpath=.//a[normalize-space(.)="Compose ballad" and not(ancestor::*[contains(@class,"tc-prosemirror-container")])]')
			.first().waitFor({ timeout: 10000 });

		const metrics = await page.evaluate(({ demoTitle }) => {
			const frame = document.querySelector(`.tc-tiddler-frame[data-tiddler-title="${demoTitle}"]`);
			const body = frame && frame.querySelector(".tc-tiddler-body");
			const editorRoot = frame && frame.querySelector(".tc-prosemirror-container .ProseMirror");
			if(!frame || !body || !editorRoot) return { ok: false };

			const findTextMatch = (root, needle, excludeSelector) => {
				const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
				let n;
				while((n = walker.nextNode())) {
					const el = n.parentElement;
					if(excludeSelector && el && el.closest(excludeSelector)) continue;
					const idx = (n.nodeValue || "").indexOf(needle);
					if(idx !== -1) return { node: n, idx };
				}
				return null;
			};
			const rangeLeft = (match) => {
				if(!match) return null;
				const r = document.createRange();
				r.setStart(match.node, match.idx);
				r.setEnd(match.node, Math.min(match.node.nodeValue.length, match.idx + 1));
				const rect = r.getClientRects()[0];
				return rect ? rect.left : null;
			};
			const itemTop = (match, selector) => {
				if(!match) return null;
				const item = match.node.parentElement && match.node.parentElement.closest(selector);
				return item ? item.getBoundingClientRect().top : null;
			};
			const itemBottom = (match, selector) => {
				if(!match) return null;
				const item = match.node.parentElement && match.node.parentElement.closest(selector);
				return item ? item.getBoundingClientRect().bottom : null;
			};

			const sampleTexts = { ul1: "This is an unordered list", ul2: "It has two items", ol1: "This is a numbered list", ol2: "And a third item" };
			const out = { ok: true, textStart: {}, gaps: {} };
			for(const [key, text] of Object.entries(sampleTexts)) {
				out.textStart[key] = {
					editorX: rangeLeft(findTextMatch(editorRoot, text)),
					renderedX: rangeLeft(findTextMatch(body, text, ".tc-prosemirror-container,textarea"))
				};
			}
			const eUl1 = findTextMatch(editorRoot, sampleTexts.ul1);
			const eUl2 = findTextMatch(editorRoot, sampleTexts.ul2);
			const eOl1 = findTextMatch(editorRoot, sampleTexts.ol1);
			const rUl1 = findTextMatch(body, sampleTexts.ul1, ".tc-prosemirror-container,textarea");
			const rUl2 = findTextMatch(body, sampleTexts.ul2, ".tc-prosemirror-container,textarea");
			const rOl1 = findTextMatch(body, sampleTexts.ol1, ".tc-prosemirror-container,textarea");
			out.gaps.ul = {
				editor: itemTop(eUl2, ".prosemirror-flat-list") - itemTop(eUl1, ".prosemirror-flat-list"),
				rendered: itemTop(rUl2, "li") - itemTop(rUl1, "li")
			};
			out.gaps.listSwitch = {
				editor: itemTop(eOl1, ".prosemirror-flat-list") - itemBottom(eUl2, ".prosemirror-flat-list"),
				rendered: itemTop(rOl1, "li") - itemBottom(rUl2, "li")
			};
			return out;
		}, { demoTitle });

		expect(metrics.ok).toBeTruthy();
		for(const key of Object.keys(metrics.textStart)) {
			const { editorX, renderedX } = metrics.textStart[key];
			expect(editorX, `${key}: editorX`).not.toBeNull();
			expect(renderedX, `${key}: renderedX`).not.toBeNull();
			expect(Math.abs(editorX - renderedX), `${key}: |editorX-renderedX|`).toBeLessThanOrEqual(1);
		}
		expect(Math.abs(metrics.gaps.ul.editor - metrics.gaps.ul.rendered)).toBeLessThanOrEqual(1);
		expect(Math.abs(metrics.gaps.listSwitch.editor - metrics.gaps.listSwitch.rendered)).toBeLessThanOrEqual(1);
	});

	test("should support list indentation with Tab", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("* Item 1");
		await page.keyboard.press("Enter");
		await page.keyboard.type("Item 2");
		await editor.press("Tab");
		await expect(editor.locator(".prosemirror-flat-list .prosemirror-flat-list")).toHaveCount(1);
	});

	test("should support list dedentation with Shift+Tab", async ({ page }) => {
		const editor = await setupProseMirrorTest(page);
		await clearEditor(editor);
		await page.keyboard.type("* Item 1");
		await page.keyboard.press("Enter");
		await page.keyboard.type("Item 2");
		await editor.press("Tab");
		await editor.press("Shift+Tab");
		const lists = editor.locator(".prosemirror-flat-list");
		await expect(lists).toHaveCount(2);
		await expect(editor.locator(".prosemirror-flat-list .prosemirror-flat-list")).toHaveCount(0);
		await expect(lists.nth(0).locator(".list-content")).toContainText("Item 1");
		await expect(lists.nth(1).locator(".list-content")).toContainText("Item 2");
	});
});
