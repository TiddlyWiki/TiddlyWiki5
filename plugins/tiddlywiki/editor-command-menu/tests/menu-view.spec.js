"use strict";

const { test, expect } = require("@playwright/test");
const { resolve } = require("path");
const { pathToFileURL } = require("url");

test.beforeEach(async ({ page }) => {
	await page.route("http://**/*", (route) => route.abort());
	await page.route("https://**/*", (route) => route.abort());
	const url = pathToFileURL(resolve(__dirname,"../../../../editions/test/output/test.html"));
	url.searchParams.set("spec","Editor command menu registry");
	await page.goto(url.href,{waitUntil: "domcontentloaded"});
	await expect(page.locator(".tc-site-title")).toBeVisible();
	await expect(page.locator(".jasmine-overall-result.jasmine-passed")).toBeVisible({timeout: 60000});
});

test("a standalone adapter can filter, execute and close its own command menu", async ({page}, testInfo) => {
	await page.evaluate(() => {
		const {CommandMenuView} = $tw.modules.execute("$:/plugins/tiddlywiki/editor-command-menu/menu-view.js");
		window.__executedMenuCommands = [];
		const menu = new CommandMenuView({
			document: document,
			searchable: true,
			onExecute: (command) => { window.__executedMenuCommands.push(command.id); menu.hide(); },
			onRequestClose: () => menu.hide()
		});
		menu.setCommands([
			{id: "heading", label: "Heading 2", category: "block", searchText: "heading 2"},
			{id: "table", label: "Insert table", category: "insert", searchText: "insert table"}
		]);
		menu.show({left: 40, right: 60, top: 40, bottom: 60});
		window.__standaloneMenu = menu;
	});
	const menu = page.locator(".tc-editor-command-menu:visible");
	const search = menu.getByRole("combobox");
	await expect(search).toBeFocused();
	await search.pressSequentially("table");
	await expect(menu.getByRole("option")).toHaveCount(1);
	await expect(menu.locator(".tc-editor-command-menu-item-label")).toHaveText("Insert table");
	await menu.screenshot({path: testInfo.outputPath("standalone-command-menu.png")});
	await search.press("Enter");
	await expect(menu).toHaveCount(0);
	expect(await page.evaluate(() => window.__executedMenuCommands)).toEqual(["table"]);
	await page.evaluate(() => window.__standaloneMenu.show({left: 40, right: 60, top: 40, bottom: 60}));
	await menu.getByRole("combobox").press("Escape");
	await expect(menu).toHaveCount(0);
	await page.evaluate(() => window.__standaloneMenu.destroy());
	await expect(page.locator(".tc-editor-command-menu")).toHaveCount(0);
});

test("command menu follows an anchor inside a scrolling container", async ({ page }) => {
	await page.evaluate(() => {
		const { CommandMenuView } = $tw.modules.execute("$:/plugins/tiddlywiki/editor-command-menu/menu-view.js");
		const container = document.createElement("div");
		container.id = "menu-scroll-container";
		container.style.cssText = "position:fixed;top:20px;left:20px;width:200px;height:200px;overflow:auto;z-index:2000";
		const anchor = document.createElement("button");
		anchor.textContent = "Anchor";
		anchor.style.marginTop = "80px";
		const filler = document.createElement("div");
		filler.style.height = "1000px";
		container.append(anchor,filler);
		document.body.appendChild(container);
		const menu = new CommandMenuView({ document: document, searchable: true });
		menu.setCommands([{ id: "test", label: "Test command", category: "test" }]);
		menu.show(anchor.getBoundingClientRect(),() => anchor.getBoundingClientRect());
	});
	const menu = page.locator(".tc-editor-command-menu:visible");
	const before = await menu.boundingBox();
	await page.locator("#menu-scroll-container").evaluate((container) => { container.scrollTop = 40; });
	await expect.poll(async () => (await menu.boundingBox()).y).toBeCloseTo(before.y - 40,0);
	await expect(menu.locator("input")).toBeFocused();
});

test("command menu releases viewport listeners and queued positioning on hide and destroy", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { CommandMenuView } = $tw.modules.execute("$:/plugins/tiddlywiki/editor-command-menu/menu-view.js");
		const menu = new CommandMenuView({ document: document, searchable: true });
		const anchor = { left: 20, right: 40, top: 20, bottom: 40 };
		const targets = [window,document,window.visualViewport].filter(Boolean);
		const listeners = [];
		const originalAdd = EventTarget.prototype.addEventListener;
		const originalRemove = EventTarget.prototype.removeEventListener;
		EventTarget.prototype.addEventListener = function(type,listener,capture) {
			if(listener === menu.onViewportChange && targets.indexOf(this) !== -1) {
				listeners.push({ target: this, type, capture });
			}
			return originalAdd.call(this,type,listener,capture);
		};
		EventTarget.prototype.removeEventListener = function(type,listener,capture) {
			if(listener === menu.onViewportChange) {
				const index = listeners.findIndex((entry) => entry.target === this && entry.type === type && entry.capture === capture);
				if(index !== -1) listeners.splice(index,1);
			}
			return originalRemove.call(this,type,listener,capture);
		};
		try {
			let calls = 0;
			const position = menu.position.bind(menu);
			menu.position = (rect) => { calls++; position(rect); };
			menu.show(anchor);
			const registered = listeners.length >= 2;
			calls = 0;
			window.dispatchEvent(new Event("resize"));
			const scheduled = menu.positionFrame !== null;
			menu.hide();
			const cancelled = menu.positionFrame === null;
			const hiddenListeners = listeners.length;
			window.dispatchEvent(new Event("resize"));
			if(window.visualViewport) window.visualViewport.dispatchEvent(new Event("resize"));
			await new Promise((done) => { requestAnimationFrame(done); });
			const hiddenCalls = calls;
			menu.show(anchor);
			calls = 0;
			window.dispatchEvent(new Event("resize"));
			menu.destroy();
			window.dispatchEvent(new Event("resize"));
			await new Promise((done) => { requestAnimationFrame(done); });
			return { registered, scheduled, cancelled, hiddenListeners, hiddenCalls,
				destroyedListeners: listeners.length, destroyedCalls: calls, connected: menu.root.isConnected };
		} finally{
			EventTarget.prototype.addEventListener = originalAdd;
			EventTarget.prototype.removeEventListener = originalRemove;
		}
	});
	expect(result).toEqual({ registered: true, scheduled: true, cancelled: true,
		hiddenListeners: 0, hiddenCalls: 0, destroyedListeners: 0, destroyedCalls: 0, connected: false });
});

test("scrolling command options keeps the user's browsing position", async ({ page }) => {
	await page.evaluate(() => {
		const { CommandMenuView } = $tw.modules.execute("$:/plugins/tiddlywiki/editor-command-menu/menu-view.js");
		const menu = new CommandMenuView({ document: document, searchable: true });
		menu.setCommands(Array.from({ length: 30 },(_,index) => ({ id: String(index), label: "Command " + index, category: "test" })));
		menu.show({ left: 20, right: 40, top: 20, bottom: 40 });
		window.__menuViewTest = menu;
	});
	const list = page.locator(".tc-editor-command-menu:visible .tc-editor-command-menu-content");
	await list.evaluate((element) => { element.scrollTop = 160; });
	await page.evaluate(() => new Promise((done) => { requestAnimationFrame(done); }));
	expect(await list.evaluate((element) => element.scrollTop)).toBe(160);
	expect(await page.evaluate(() => window.__menuViewTest.positionFrame)).toBe(null);
});

test("command menu clamps to visual viewport offsets and follows its resize events", async ({ page }) => {
	await page.evaluate(() => {
		const { CommandMenuView } = $tw.modules.execute("$:/plugins/tiddlywiki/editor-command-menu/menu-view.js");
		// Model the visual viewport API separately from layout viewport size;
		// this checks event handling, not a real operating-system keyboard.
		const viewport = new EventTarget();
		Object.assign(viewport,{ offsetLeft: 40, offsetTop: 30, width: 240, height: 180 });
		Object.defineProperty(window,"visualViewport",{ configurable: true, value: viewport });
		const menu = new CommandMenuView({ document: document, searchable: true });
		menu.setCommands(Array.from({ length: 20 },(_,index) => ({ id: String(index), label: "Command " + index, category: "test" })));
		menu.show({ left: 1000, right: 1020, top: 500, bottom: 520 });
	});
	const menu = page.locator(".tc-editor-command-menu:visible");
	async function expectWithin(left,top,width,height) {
		await expect.poll(async () => {
			const box = await menu.boundingBox();
			return box.x >= left && box.y >= top && box.x + box.width <= left + width && box.y + box.height <= top + height;
		}).toBe(true);
	}
	await expectWithin(40,30,240,180);
	await page.evaluate(() => {
		Object.assign(window.visualViewport,{ offsetLeft: 60, offsetTop: 40, width: 200, height: 150 });
		window.visualViewport.dispatchEvent(new Event("resize"));
	});
	await expectWithin(60,40,200,150);
});

test("command menu falls back to the layout viewport when visualViewport is unavailable", async ({ page }) => {
	await page.evaluate(() => {
		Object.defineProperty(window,"visualViewport",{ configurable: true, value: null });
		const { CommandMenuView } = $tw.modules.execute("$:/plugins/tiddlywiki/editor-command-menu/menu-view.js");
		const menu = new CommandMenuView({ document: document, searchable: true });
		menu.setCommands(Array.from({ length: 20 },(_,index) => ({ id: String(index), label: "Command " + index, category: "test" })));
		menu.show({ left: 1000, right: 1020, top: 500, bottom: 520 });
	});
	await page.setViewportSize({ width: 390, height: 250 });
	const menu = page.locator(".tc-editor-command-menu:visible");
	await expect.poll(async () => {
		const box = await menu.boundingBox();
		return box.x >= 0 && box.y >= 0 && box.x + box.width <= 390 && box.y + box.height <= 250;
	}).toBe(true);
});
