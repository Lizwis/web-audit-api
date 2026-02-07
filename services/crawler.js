const puppeteer = require("puppeteer");

async function crawlSite(url) {
	const browser = await puppeteer.launch({
		headless: "new",
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
		],
	});

	try {
		const page = await browser.newPage();

		page.setDefaultNavigationTimeout(20000);

		await page.setRequestInterception(true);
		page.on("request", (req) => {
			const whitelist = ["document", "script"];
			if (!whitelist.includes(req.resourceType())) {
				req.abort();
			} else {
				req.continue();
			}
		});

		const jsErrors = [];
		page.on("pageerror", (err) =>
			jsErrors.push({
				type: "JS",
				msg: "Runtime Error",
				code: err.message.slice(0, 100),
			}),
		);

		await page.goto(url, { waitUntil: "domcontentloaded" });

		const html = await page.content();
		const links = await page.$$eval("a", (as) =>
			as.map((a) => a.href).slice(0, 10),
		);

		await browser.close();
		return { html, links, jsErrors };
	} catch (err) {
		await browser.close();
		throw new Error("Site took too long to respond. Try a lighter URL.");
	}
}

module.exports = { crawlSite };
