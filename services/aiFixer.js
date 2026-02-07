const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function getBatchAiFixes(issues) {
	if (!issues || issues.length === 0) return [];

	const limitedIssues = issues.slice(0, 10);
	const issuesList = limitedIssues
		.map((iss, i) => `${i + 1}. [${iss.type}] ${iss.msg}`)
		.join("\n");

	const prompt = `Return a JSON array of strings containing a 1-sentence fix for each: ${issuesList}`;

	try {
		const result = await model.generateContent(prompt);
		const text = result.response.text();

		const cleanJson = text.replace(/```json|```/g, "").trim();
		const parsed = JSON.parse(cleanJson);

		return issues.map((_, i) => parsed[i] || "Review source code.");
	} catch (error) {
		console.error("AI FIXER FAILED:", error.message);

		return issues.map(
			() =>
				"✨ AI suggestion currently unavailable. Check API Key permissions.",
		);
	}
}

module.exports = { getBatchAiFixes };
