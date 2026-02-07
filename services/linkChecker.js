const puppeteer = require("puppeteer");

async function checkLinks(links) {
	const broken = [];
	const uniqueLinks = [...new Set(links)].slice(0, 10);

	const browser = await puppeteer.launch({
		headless: "new",
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-blink-features=AutomationControlled",
			"--window-size=1920,1080",
		],
	});

	try {
		const page = await browser.newPage();

		// Emulate a real desktop browser
		await page.setUserAgent(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
		);

		await page.setRequestInterception(true);
		page.on("request", (req) => {
			if (
				["image", "stylesheet", "font", "media"].includes(req.resourceType())
			) {
				req.abort();
			} else {
				req.continue();
			}
		});

		for (const link of uniqueLinks) {
			try {
				await new Promise((r) => setTimeout(r, Math.random() * 1000 + 1000));

				const response = await page.goto(link, {
					waitUntil: "domcontentloaded",
					timeout: 30000, // 30 seconds
				});

				const status = response.status();

				if (status >= 400) {
					broken.push({ url: link, status });
				}
			} catch (err) {
				console.error(`Timeout/Error on ${link}:`, err.message);
				broken.push({ url: link, status: "timeout_or_blocked" });
			}
		}
	} finally {
		await browser.close();
	}

	return broken;
}

module.exports = { checkLinks };
