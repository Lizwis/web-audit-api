const cheerio = require("cheerio");

async function analyze(url, html) {
	const $ = cheerio.load(html);
	const htmlIssues = [];
	const cssIssues = [];
	const a11yIssues = [];

	if (!$("title").length)
		htmlIssues.push({ type: "HTML", msg: "Missing <title> tag" });
	if (!$("meta[name='description']").length)
		htmlIssues.push({ type: "HTML", msg: "Missing meta description" });

	$("[style]").each((i, el) => {
		cssIssues.push({
			type: "CSS",
			msg: `Inline style on <${el.tagName}>`,
			code: $(el).attr("style"),
		});
	});

	$("img:not([alt])").each(() =>
		a11yIssues.push({ type: "A11y", msg: "Image missing alt text" }),
	);
	$("a:empty").each(() =>
		a11yIssues.push({ type: "A11y", msg: "Empty link detected" }),
	);

	const performanceScore = Math.max(
		30,
		100 - htmlIssues.length * 5 - cssIssues.length * 2,
	);

	return {
		stats: {
			htmlIssues: htmlIssues.length,
			cssIssues: cssIssues.length,
			a11yIssues: a11yIssues.length,
			performance: performanceScore,
		},
		allIssues: [...htmlIssues, ...cssIssues, ...a11yIssues],
	};
}

module.exports = { analyzeDOM: analyze };
