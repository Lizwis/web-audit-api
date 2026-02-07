const { crawlSite } = require("../services/crawler");
const { checkLinks } = require("../services/linkChecker");
const { analyzeDOM } = require("../services/domAnalyzer");
const { getBatchAiFixes } = require("../services/aiFixer");

module.exports = async function (fastify) {
	fastify.post("/scan", async (request, reply) => {
		const { url } = request.body;
		try {
			const { html, links, buttons, jsErrors } = await crawlSite(url);
			const audit = await analyzeDOM(url, html);
			const brokenLinks = await checkLinks(links);

			const rawIssues = [
				...audit.allIssues,
				...jsErrors,
				...brokenLinks.map((l) => ({
					type: "Links",
					msg: `Broken link: ${l.url}`,
					code: `Status: ${l.status}`,
				})),
			];

			const aiFixes = await getBatchAiFixes(rawIssues);

			const allIssues = rawIssues.map((issue, index) => ({
				...issue,
				aiSuggestion: aiFixes[index] || "Review manually.",
			}));

			return {
				url,
				stats: {
					brokenLinks: brokenLinks.length,
					htmlIssues: audit.stats.htmlIssues,
					cssIssues: audit.stats.cssIssues,
					jsErrors: jsErrors.length,
					a11yIssues: audit.stats.a11yIssues,
					performance: audit.stats.performance,
				},
				allIssues,
				buttons,
			};
		} catch (err) {
			fastify.log.error(err);
			reply.code(500).send({ error: "Scan failed" });
		}
	});
};
