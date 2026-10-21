"use strict";

const { test, expect } = require("@playwright/test");
const { execFileSync } = require("child_process");
const { createServer } = require("http");
const { readFileSync } = require("fs");
const { resolve, sep } = require("path");
const { pathToFileURL } = require("url");

const repoRoot = resolve(__dirname,"../../../../..");
const pluginTitles = ["prosemirror","wikitext-serialize","hard-line-breaks","editor-command-menu"]
	.map((name) => "$:/plugins/tiddlywiki/" + name);

test.describe("ProseMirror plugin installation", () => {
	let server, baseUrl;

	test.beforeAll(async ({ browserName }, testInfo) => {
		testInfo.setTimeout(120000);
		const output = testInfo.outputPath("installation-" + browserName);
		function build(edition, commands) {
			execFileSync(process.execPath,["tiddlywiki.js",edition,"--output",output].concat(commands), {
				cwd: repoRoot,
				timeout: 90000,
				stdio: "pipe"
			});
		}
		// Use release packaging, not the test edition's unpacked shadow modules.
		build("editions/empty",["--render","$:/core/save/all","empty.html","text/plain"]);
		build("editions/pluginlibrary",[
			"--makelibrary","$:/UpgradeLibrary",
			"--savelibrarytiddlers","$:/UpgradeLibrary",
			pluginTitles.map((title) => "[[" + title + "]]").join(" "),
			"recipes/library/tiddlers/","$:/UpgradeLibrary/List",
			"--savetiddler","$:/UpgradeLibrary/List","recipes/library/tiddlers.json",
			"--rendertiddler","$:/plugins/tiddlywiki/pluginlibrary/library.template.html","index.html","text/plain"
		]);
		server = createServer((request,response) => {
			const filename = resolve(output,"." + decodeURIComponent(new URL(request.url,"http://localhost").pathname));
			if(!filename.startsWith(output + sep)) {
				response.writeHead(403).end();
				return;
			}
			try {
				response.setHeader("Content-Type",filename.endsWith(".json") ? "application/json" : "text/html; charset=utf-8");
				response.end(readFileSync(filename));
			} catch(e) {
				response.writeHead(404).end();
			}
		});
		await new Promise((resolve,reject) => {
			server.once("error",reject);
			server.listen(0,"127.0.0.1",resolve);
		});
		baseUrl = "http://127.0.0.1:" + server.address().port;
	});

	test.afterAll(async () => {
		if(server) {
			await new Promise((resolve) => { server.close(resolve); });
		}
	});

	test("installs dependencies from the library, reopens a saved wiki and supports reinstallation", async ({ page }, testInfo) => {
		const errors = [];
		page.on("pageerror",(error) => errors.push(error.message));
		await page.route("**/*",(route) => {
			const url = route.request().url();
			return url.startsWith(baseUrl + "/") || url.startsWith("file:") ? route.continue() : route.abort();
		});
		await page.goto(baseUrl + "/empty.html",{ waitUntil: "domcontentloaded" });
		await expect(page.locator(".tc-site-title")).toBeVisible();
		expect(await page.evaluate((titles) => titles.some((title) => $tw.wiki.tiddlerExists(title)),pluginTitles)).toBe(false);
		await page.evaluate((libraryUrl) => {
			// Only configure the library and fixture tiddlers. Installation itself
			// must go through the unmodified core dialog and iframe protocol.
			$tw.wiki.setText("$:/config/OfficialPluginLibrary","url",null,libraryUrl);
			$tw.wiki.addTiddler({title: "Install editor",text: "{{$:/core/ui/ControlPanel/Plugins/AddPlugins}}"});
			$tw.wiki.addTiddler({title: "Installation source",text: "Original source",type: "text/vnd.tiddlywiki"});
			$tw.wiki.addTiddler({title: "Installation editor",text: '<$edit-prosemirror tiddler="Installation source"/>'});
			$tw.wiki.setText("$:/StoryList","list",null,["Install editor"]);
		},baseUrl + "/index.html");
		await page.getByRole("button",{name: "Get more plugins",exact: true}).click();
		const modal = page.locator(".tc-modal");
		await modal.getByRole("button",{ name: "Open plugin library",exact: true }).click();
		const pluginRow = modal.locator(".tc-plugin-info").filter({has: page.locator("h2",{hasText: "$:/plugins/tiddlywiki/prosemirror"})});
		await pluginRow.locator("button.tc-install-plugin").click();
		await expect.poll(() => page.evaluate((titles) => titles.every((title) => $tw.wiki.tiddlerExists(title)),pluginTitles)).toBe(true);
		await expect(page.locator(".tc-plugin-reload-warning")).toBeVisible();
		await modal.locator(".tc-modal-footer").getByRole("button",{name: "close",exact: true}).click();
		await expect(modal).toBeHidden();

		async function saveAndReopen(filename) {
			const [download] = await Promise.all([
				page.waitForEvent("download"),
				page.locator(".tc-sidebar-header").getByRole("button",{name: "save changes",exact: true}).click()
			]);
			const savedPath = testInfo.outputPath(filename);
			await download.saveAs(savedPath);
			await page.goto(pathToFileURL(savedPath).href + "#" + encodeURIComponent("Installation editor"),{waitUntil: "domcontentloaded"});
			await expect(page.locator('[data-tiddler-title="Installation editor"] .ProseMirror')).toBeVisible();
		}
		await saveAndReopen("installed.html");
		const editor = page.locator('[data-tiddler-title="Installation editor"] .ProseMirror');
		await editor.press("ControlOrMeta+End");
		await editor.press("X");
		await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("Installation source"))).toBe("Original sourceX");
		await editor.press("Enter");
		await editor.press("Slash");
		const search = page.locator(".tc-editor-command-menu:visible input");
		await search.fill("heading 2");
		await search.press("Enter");
		await editor.press("H");
		await expect(editor.locator("h2")).toHaveText("H");
		await editor.locator("h2").hover();
		await page.locator(".tc-prosemirror-drag-handle:visible").click();
		const blockMenu = page.locator(".tc-editor-command-menu:visible");
		await blockMenu.locator("input").fill("duplicate");
		await blockMenu.locator(".tc-editor-command-menu-item",{hasText: "Duplicate"}).click();
		await expect(editor.locator("h2")).toHaveText(["H","H"]);
		const savedText = await page.evaluate(() => $tw.wiki.getTiddlerText("Installation source"));

		await page.evaluate(() => $tw.wiki.setText("$:/StoryList","list",null,["Install editor"]));
		await page.getByRole("button",{name: "Get more plugins",exact: true}).click();
		await modal.getByRole("button",{name: "Open plugin library",exact: true}).click();
		const pluginDownloads = pluginTitles.map((title) => page.waitForResponse((response) => response.url().endsWith("/" + encodeURIComponent(encodeURIComponent(title)) + ".json") && response.status() === 200));
		await Promise.all(pluginDownloads.concat([pluginRow.locator("button.tc-reinstall").click()]));
		await modal.locator(".tc-modal-footer").getByRole("button",{name: "close",exact: true}).click();
		await expect(modal).toBeHidden();
		await saveAndReopen("reinstalled.html");
		expect(await page.evaluate(() => $tw.wiki.getTiddlerText("Installation source"))).toBe(savedText);
		await expect(editor.locator("h2")).toHaveText(["H","H"]);
		expect(errors).toEqual([]);
	});
});
