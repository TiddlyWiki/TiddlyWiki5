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

	test("preserves block syntax in Stamp and extension dropdowns alongside the preview menu", async ({ page }, testInfo) => {
		const errors = [];
		page.on("pageerror",(error) => errors.push(error.message));
		const frame = await openEditor(page,null);
		await page.evaluate(() => {
			$tw.wiki.addTiddlers([
				{title: "Review snippet",tags: ["$:/tags/TextEditor/Snippet"],caption: "Review snippet",text: "Inserted snippet"},
				{title: "Review dropdown",text: "! Review heading\n\nReview paragraph\n\n* First item\n* Second item\n\n----"},
				{title: "Review toolbar",tags: ["$:/tags/EditorToolbar"],caption: "Review blocks",description: "Review block dropdown",
					condition: "[<targetTiddler>]",icon: "$:/core/images/more-button",dropdown: "Review dropdown",text: ""},
				{title: "$:/config/EditorToolbarButtons/Visibility/Review toolbar",text: "show"},
				{title: "$:/config/EditorToolbarButtons/Visibility/$:/core/ui/EditorToolbar/stamp",text: "show"}
			]);
		});
		const popup = frame.locator(".tc-drop-down:visible");
		await frame.getByRole("button",{name: "Review block dropdown",exact: true}).click();
		await expect(popup.getByRole("heading",{name: "Review heading",exact: true})).toBeVisible();
		await expect(popup.locator("ul > li")).toHaveText(["First item","Second item"]);
		await expect(popup.getByRole("separator")).toHaveCount(1);
		await frame.screenshot({path: testInfo.outputPath("block-dropdown.png")});
		await frame.getByRole("button",{name: "Review block dropdown",exact: true}).click();

		await frame.getByRole("button",{name: "Insert a preconfigured snippet of text",exact: false}).click();
		await expect(popup.getByRole("separator")).toHaveCount(1);
		await popup.getByRole("link",{name: "Review snippet",exact: true}).click();
		await expect(popup).toHaveCount(0);
		const draftTitle = await frame.getAttribute("data-tiddler-title");
		await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),draftTitle))
			.toContain("Inserted snippet");

		const preview = await openDropdown(frame);
		await expect(preview.locator("p")).toHaveCount(0);
		await expect(preview.getByText("Always caption",{exact: true})).toBeVisible();
		await preview.getByText("text/custom content preview",{exact: true}).click();
		await frame.getByRole("button",{name: "Show preview pane",exact: false}).click();
		await expect(frame.locator(".tc-tiddler-preview-preview")).toHaveText("Custom content-type preview content");
		await expect((await openDropdown(frame)).locator(".tc-preview-type-button")
			.filter({hasText: "text/custom content preview"}).locator(".tc-drop-down-checkmark")).toHaveText("✓");
		await frame.getByRole("button",{name: "Choose preview type",exact: true}).click();
		await frame.getByRole("button",{name: "Confirm changes to this tiddler",exact: true}).click();
		const downloading = page.waitForEvent("download");
		await page.getByRole("button",{name: /save changes/i}).first().click();
		const saved = testInfo.outputPath("saved-dropdowns.html");
		await (await downloading).saveAs(saved);
		await page.goto("about:blank");
		await page.goto(pathToFileURL(saved).href + "#Preview%20review",{waitUntil: "domcontentloaded"});
		await page.locator('.tc-tiddler-frame[data-tiddler-title="Preview review"]')
			.getByRole("button",{name: "Edit this tiddler",exact: true}).click();
		await expect(frame.frameLocator("iframe.tc-edit-texteditor-body").getByRole("textbox"))
			.toHaveValue(/Inserted snippet/);
		// Saved popup state may reopen with the draft; open it only if closed.
		const restoredPreview = frame.locator(".tc-drop-down").filter({has: page.locator(".tc-preview-type-button")});
		if(!await restoredPreview.isVisible()) {
			await frame.getByRole("button",{name: "Choose preview type",exact: true}).click();
		}
		const restoredOption = restoredPreview.locator(".tc-preview-type-button").filter({hasText: "text/custom content preview"});
		await expect(restoredOption).toBeVisible();
		await restoredOption.click();
		await frame.getByRole("button",{name: "Review block dropdown",exact: true}).click();
		await expect(popup.getByRole("heading",{name: "Review heading",exact: true})).toBeVisible();
		expect(errors).toEqual([]);
	});

	test("keeps the core Link, More and bitmap dropdowns usable", async ({ page }, testInfo) => {
		const frame = await openEditor(page,null);
		const draftTitle = await frame.getAttribute("data-tiddler-title");
		await page.evaluate((title) => $tw.wiki.setText(title,"type",null,"text/vnd.tiddlywiki"),draftTitle);
		await page.evaluate(() => {
			["link","more"].forEach((name) => $tw.wiki.addTiddler({
				title: "$:/config/EditorToolbarButtons/Visibility/$:/core/ui/EditorToolbar/" + name,text: "show"
			}));
			$tw.wiki.addTiddler({title: "$:/config/EditorToolbarButtons/Visibility/$:/core/ui/EditorToolbar/bold",text: "hide"});
		});
		await frame.getByRole("button",{name: "Create wikitext link",exact: false}).click();
		const popup = frame.locator(".tc-drop-down:visible");
		await expect(popup.locator('input[type="search"]')).toBeVisible();
		await popup.locator('input[type="search"]').pressSequentially("Preview review");
		await expect(popup.getByRole("link",{name: "Preview review",exact: true}).first()).toBeVisible();
		await frame.getByRole("button",{name: "Create wikitext link",exact: false}).click();
		await frame.locator(".tc-editor-toolbar").getByRole("button",{name: "More actions",exact: true}).click();
		await expect(popup.getByRole("button",{name: /Apply bold formatting/})).toBeVisible();
		await frame.locator(".tc-editor-toolbar").getByRole("button",{name: "More actions",exact: true}).click();
		await page.evaluate(() => {
			$tw.wiki.addTiddler({title: "Review bitmap",type: "image/png",
				text: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6sV8AAAAASUVORK5CYII="});
			["paint","size","opacity","line-width"].forEach((name) => $tw.wiki.addTiddler({
				title: "$:/config/EditorToolbarButtons/Visibility/$:/core/ui/EditorToolbar/" + name,text: "show"
			}));
			$tw.wiki.setText("$:/StoryList","list",null,["Review bitmap"]);
		});
		await page.locator('.tc-tiddler-frame[data-tiddler-title="Review bitmap"]').getByRole("button",{name: "Edit this tiddler",exact: true}).click();
		const bitmap = page.locator(".tc-tiddler-frame").filter({has: page.locator("canvas")});
		async function checkBitmapDropdown(name) {
			const button = bitmap.getByRole("button",{name,exact: false});
			await button.click();
			await expect(bitmap.locator(".tc-drop-down:visible").first()).toBeVisible();
			if(name === "Set image size") {
				await expect(bitmap.locator(".tc-drop-down:visible input")).toHaveCount(2);
			}
			await bitmap.screenshot({path: testInfo.outputPath(name.replace(/ /g,"-") + ".png")});
			await button.click();
		}
		await checkBitmapDropdown("Set painting colour");
		await checkBitmapDropdown("Set image size");
	});
});
