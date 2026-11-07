"use strict";

const {test,expect} = require("@playwright/test");
const {setupProseMirrorTest} = require("../helpers.js");

test("matching core keeps the visual editor and structured toolbar undo", async ({page}) => {
	const title = "SupportedCoreToolbar",
		editor = await setupProseMirrorTest(page,title,{useReadmeTiddler: false, initialText: "Alpha Beta"});
	await page.evaluate((title) => $tw.wiki.addTiddler({title: "Harness_" + title,
		text: '<$edit-prosemirror tiddler="' + title + '"><$button class="core-compatible-bold"><$action-sendmessage $message="tm-edit-text-operation" $param="wrap-selection" prefix="\'\'" suffix="\'\'" trimSelection="yes"/>Bold</$button></$edit-prosemirror>'
	}),title);
	await expect(page.locator(".core-compatible-bold")).toBeVisible();
	await expect(page.locator(".tc-prosemirror-core-warning")).toHaveCount(0);
	await editor.press("ControlOrMeta+Home");
	await editor.press("ControlOrMeta+Shift+ArrowRight");
	await expect.poll(() => editor.evaluate(() => window.getSelection().toString().trim())).toBe("Alpha");
	await page.locator(".core-compatible-bold").click();
	await expect(editor.locator("strong")).toHaveText("Alpha");
	await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe("''Alpha'' Beta");
	await editor.press("ControlOrMeta+z");
	await expect.poll(() => page.evaluate((title) => $tw.wiki.getTiddlerText(title),title)).toBe("Alpha Beta");
});

test("source fallback uses native WikiText offsets and keeps unsupported syntax", async ({page}) => {
	await setupProseMirrorTest(page,"CoreFallbackPage",{useReadmeTiddler: false, initialText: "Keep visual editor"});
	await page.evaluate(() => {
		const compatibility = $tw.modules.execute("$:/plugins/tiddlywiki/prosemirror/core/compatibility.js"),
			factory = $tw.modules.execute("$:/core/modules/editor/factory.js").editTextWidgetFactory,
			SimpleEngine = $tw.modules.execute("$:/core/modules/editor/engines/simple.js").SimpleEngine,
			FramedEngine = $tw.modules.execute("$:/core/modules/editor/engines/framed.js").FramedEngine,
			SourceEditor = compatibility.createSourceEditor(factory,FramedEngine,SimpleEngine),
			host = document.createElement("div"),
			toolbar = $tw.wiki.parseText("text/vnd.tiddlywiki",'<$button class="core-fallback-bold"><$action-sendmessage $message="tm-edit-text-operation" $param="wrap-selection" prefix="\'\'" suffix="\'\'" trimSelection="yes"/>Bold</$button>',{parseAsInline: true});
		host.className = "core-fallback-fixture";
		document.body.appendChild(host);
		$tw.wiki.addTiddler({title: "CoreFallbackSource", text: "Alpha Beta\n\n<<now>>\n\n|Keep|Table|"});
		const widget = new SourceEditor({type: "edit-prosemirror",attributes: {
			tiddler: {type: "string",value: "CoreFallbackSource"},
			tag: {type: "string",value: "textarea"}
		},children: toolbar.tree},{wiki: $tw.wiki,document: document,parentWidget: $tw.rootWidget});
		$tw.rootWidget.children.push(widget);
		widget.render(host,null);
	});
	const fixture = page.locator(".core-fallback-fixture"),
		editor = fixture.frameLocator("iframe").locator("textarea");
	await expect(fixture.getByRole("status")).toContainText("#10075");
	await expect(fixture.locator(".ProseMirror")).toHaveCount(0);
	await editor.focus();
	await editor.press("ControlOrMeta+Home");
	await editor.press("ControlOrMeta+Shift+ArrowRight");
	await fixture.getByRole("button",{name: "Bold",exact: true}).click();
	await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("CoreFallbackSource"))).toBe("''Alpha'' Beta\n\n<<now>>\n\n|Keep|Table|");
	await editor.press("ControlOrMeta+End");
	await editor.press("X");
	await expect.poll(() => page.evaluate(() => $tw.wiki.getTiddlerText("CoreFallbackSource"))).toBe("''Alpha'' Beta\n\n<<now>>\n\n|Keep|Table|X");
});
