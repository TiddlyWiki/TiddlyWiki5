"use strict";

const {test, expect} = require("@playwright/test");
const {resolve} = require("path");
const {pathToFileURL} = require("url");

test.setTimeout(90000);

async function openEditor(page, toolbar) {
	await page.route("http://**/*",(route) => route.abort());
	await page.route("https://**/*",(route) => route.abort());
	const url = pathToFileURL(resolve(__dirname,"output/test.html"));
	// Run the engine contract in this page; other specs intentionally mutate
	// global wiki state and should not race the native input fixtures below.
	url.searchParams.set("spec","Edit-text widget engine contract");
	await page.goto(url.href,{waitUntil: "domcontentloaded"});
	await expect(page.locator(".tc-site-title")).toHaveText("TiddlyWiki5");
	await expect(page.locator(".jasmine-overall-result.jasmine-passed")).toBeVisible({timeout: 60000});
	await page.evaluate((toolbar) => {
		$tw.wiki.addTiddler({title: "Engine hooks source", text: "initial"});
		$tw.wiki.addTiddler({
			title: "Engine hooks harness",
			text: '<$edit-text tiddler="Engine hooks source" class="hook-input">' +
				(toolbar ? '<$button class="hook-bold"><$action-sendmessage $message="tm-edit-text-operation" $param="wrap-selection" prefix="\'\'" suffix="\'\'"/>Bold</$button>' : "") +
				"</$edit-text>"
		});
		$tw.wiki.setText("$:/StoryList","list",null,["Engine hooks harness"]);
	},toolbar);
	return page.locator('.tc-tiddler-frame[data-tiddler-title="Engine hooks harness"]');
}

test("keeps simple-editor input and rerendering working without engine hooks", async ({page}) => {
	const frame = await openEditor(page,false);
	const input = frame.locator("textarea.hook-input");
	await input.fill("Simple editor text");
	await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("Engine hooks source"))).toBe("Simple editor text");
	await page.evaluate(() => $tw.wiki.setText("$:/StoryList","list",null,[]));
	await expect(frame).toHaveCount(0);
	await page.evaluate(() => $tw.wiki.setText("$:/StoryList","list",null,["Engine hooks harness"]));
	await expect(input).toHaveValue("Simple editor text");
});

test("keeps framed-editor typing and toolbar text operations working", async ({page}) => {
	const frame = await openEditor(page,true);
	const input = frame.frameLocator("iframe.hook-input").locator("textarea");
	await input.click();
	await input.press("ControlOrMeta+a");
	await input.pressSequentially("Framed editor text");
	await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("Engine hooks source"))).toBe("Framed editor text");
	await input.press("ControlOrMeta+a");
	await frame.locator(".hook-bold").click();
	await expect(input).toHaveValue("''Framed editor text''");
	await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("Engine hooks source"))).toBe("''Framed editor text''");
});
