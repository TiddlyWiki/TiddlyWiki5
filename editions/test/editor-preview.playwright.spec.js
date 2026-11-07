"use strict";

const { test, expect } = require("@playwright/test");
const { execFileSync } = require("child_process");
const { resolve } = require("path");
const { pathToFileURL } = require("url");

const repoRoot = resolve(__dirname,"../..");

test.describe("Editor preview dropdown in the edit template", () => {
	let wikiUrl;

	test.beforeAll(({ browserName }, testInfo) => {
		const output = testInfo.outputPath(browserName + "-preview-wiki");
		execFileSync(process.execPath,["tiddlywiki.js","editions/empty","--output",output,
			"--render","$:/core/save/all","empty.html","text/plain"],{cwd: repoRoot});
		wikiUrl = pathToFileURL(resolve(output,"empty.html")).href;
	});

	async function openEditor(page, mapping) {
		// Use the ordinary story, EditTemplate, toolbar button and popup. Do not
		// set tv-editor-type or render the dropdown in an artificial variable scope.
		await page.route(/^https?:/,(route) => route.abort());
		await page.goto(wikiUrl,{waitUntil: "domcontentloaded"});
		await page.waitForFunction(() => window.$tw && $tw.rootWidget);
		await page.evaluate((editorMapping) => {
			// A test-only editor using the real core text engine. This avoids
			// depending on an optional editor plugin just to exercise the mapping.
			const Widget = $tw.modules.execute("$:/core/modules/widgets/widget.js").widget;
			Widget.prototype.widgetClasses["edit-custom"] = Widget.prototype.widgetClasses["edit-text"];
			$tw.wiki.addTiddlers([
				{title: "Preview review",type: "text/custom",text: "Edit this custom content-type example."},
				{title: "AlwaysPreview",tags: ["$:/tags/EditPreview"],caption: "Always caption",text: "Always preview content"},
				{title: "CustomEditorPreview",tags: ["$:/tags/EditPreview"],caption: "Custom editor preview",
					condition: "[<tv-editor-type>match[custom]]",text: "Custom editor preview content"},
				{title: "CustomContentPreview",tags: ["$:/tags/EditPreview"],caption: "text/custom content preview",
					condition: "[<targetTiddler>type[text/custom]]",text: "Custom content-type preview content"},
				{title: "$:/StoryList",list: ["Preview review"]}
			]);
			if(editorMapping !== null) {
				$tw.wiki.addTiddler({title: "$:/config/EditorTypeMappings/text/custom",text: editorMapping});
			}
		},mapping);
		await page.waitForFunction(() => $tw.wiki.getSizeOfTiddlerEventQueue() === 0);
		const frame = page.locator('.tc-tiddler-frame[data-tiddler-title="Preview review"]');
		await frame.getByRole("button",{name: "Edit this tiddler"}).click();
		await page.waitForFunction(() => $tw.wiki.getSizeOfTiddlerEventQueue() === 0);
		return page.locator(".tc-tiddler-frame").filter({has: page.locator(".tc-edit-texteditor-body")});
	}

	async function openDropdown(frame) {
		await frame.getByRole("button",{name: "Choose preview type",exact: true}).click();
		const popup = frame.locator(".tc-drop-down").filter({has: frame.page().locator(".tc-preview-type-button")});
		await expect(popup).toBeVisible();
		return popup;
	}

	test("distinguishes a content type from the selected editor name", async ({ page }, testInfo) => {
		const frame = await openEditor(page,null);
		const popup = await openDropdown(frame);
		await expect(popup.getByText("Always caption",{exact: true})).toBeVisible();
		await expect(popup.getByText("text/custom content preview",{exact: true})).toBeVisible();
		await expect(popup.getByText("Custom editor preview",{exact: true})).toHaveCount(0);
		await expect(popup.locator("p")).toHaveCount(0);
		await popup.getByText("text/custom content preview",{exact: true}).click();
		await frame.getByRole("button",{name: "Show preview pane",exact: false}).click();
		await expect(frame.locator(".tc-tiddler-preview-preview")).toHaveText("Custom content-type preview content");
		await openDropdown(frame);
		await frame.screenshot({path: testInfo.outputPath("content-type-preview.png")});
	});

	test("accepts a configured editor name with a trailing newline", async ({ page }, testInfo) => {
		const frame = await openEditor(page,"custom\n");
		const popup = await openDropdown(frame);
		const custom = popup.getByText("Custom editor preview",{exact: true});
		await expect(custom).toBeVisible();
		await expect(popup.getByText("Always caption",{exact: true})).toBeVisible();
		await custom.click();
		await frame.getByRole("button",{name: "Show preview pane",exact: false}).click();
		await expect(frame.locator(".tc-tiddler-preview-preview")).toHaveText("Custom editor preview content");
		const selectedPopup = await openDropdown(frame);
		await expect(selectedPopup.locator(".tc-preview-type-button").filter({hasText: "Custom editor preview"})
			.locator(".tc-drop-down-checkmark")).toHaveText("✓");
		await frame.screenshot({path: testInfo.outputPath("custom-editor-preview.png")});
	});

	test("refreshes a real toolbar when its editor mapping changes", async ({ page }, testInfo) => {
		const frame = await openEditor(page,"custom");
		const input = frame.frameLocator("iframe.tc-edit-texteditor-body").getByRole("textbox");
		await input.press("ControlOrMeta+A");
		await input.pressSequentially("Keep this edit when changing editor.");
		const draftTitle = await frame.getAttribute("data-tiddler-title");
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),draftTitle))
			.toBe("Keep this edit when changing editor.");
		let popup = await openDropdown(frame);
		await expect(popup.getByText("Custom editor preview",{exact: true})).toBeVisible();
		await page.evaluate(() => $tw.wiki.addTiddler({title: "$:/config/EditorTypeMappings/text/custom",text: "text\n"}));
		await page.waitForFunction(() => $tw.wiki.getSizeOfTiddlerEventQueue() === 0);
		// The replacement toolbar may retain the popup state. Toggle it only
		// when necessary; do not hide a failed first click with another click.
		popup = frame.locator(".tc-drop-down").filter({has: page.locator(".tc-preview-type-button")});
		if(!await popup.isVisible()) {
			popup = await openDropdown(frame);
		}
		await expect(popup.getByText("Custom editor preview",{exact: true})).toHaveCount(0);
		await expect(popup.getByText("Always caption",{exact: true})).toBeVisible();
		await expect(popup.getByText("text/custom content preview",{exact: true})).toBeVisible();
		await expect(frame.frameLocator("iframe.tc-edit-texteditor-body").getByRole("textbox"))
			.toHaveValue("Keep this edit when changing editor.");
		await frame.screenshot({path: testInfo.outputPath("switched-text-editor-preview.png")});
	});
});
