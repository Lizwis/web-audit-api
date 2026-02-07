const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");

async function crawlSite(url) {
	const isVercel = process.env.VERCEL === "1";
	let browser;

	try {
		//Dynamic configuration for Local vs. Vercel
		const options = {
			args: isVercel
				? chromium.args
				: [
						"--no-sandbox",
						"--disable-setuid-sandbox",
						"--disable-dev-shm-usage",
					],
			defaultViewport: chromium.defaultViewport,
			executablePath: isVercel
				? await chromium.executablePath(
						"https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.tar",
					)
				: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
			headless: isVercel ? chromium.headless : "new",
		};

		browser = await puppeteer.launch(options);
		const page = await browser.newPage();

		page.setDefaultNavigationTimeout(30000);

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

		// 🔍 Navigate to the target site
		await page.goto(url, { waitUntil: "domcontentloaded" });

		const html = await page.content();
		const links = await page.$$eval("a", (as) =>
			as
				.map((a) => a.href)
				.filter((href) => href.startsWith("http"))
				.slice(0, 10),
		);

		await browser.close();
		return { html, links, jsErrors };
	} catch (err) {
		if (browser) await browser.close();
		console.error("Crawl Error:", err.message);
		throw new Error(
			isVercel
				? `Vercel Error: ${err.message}`
				: "Site took too long to respond. Try a lighter URL.",
		);
	}
}

module.exports = { crawlSite };
