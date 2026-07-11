const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
	testDir: __dirname,
	testMatch: "playwright.spec.js",
	timeout: 60000,
	retries: 0,
	reporter: "html",
	use: {
		screenshot: {
			mode: "only-on-failure",
			fullPage: true
		},
		actionTimeout: 15000
	},
	expect: {
		timeout: 20000
	},
	projects: [
		{
			name: "chromium",
			use: Object.assign({},devices["Desktop Chrome"])
		}
	]
});
