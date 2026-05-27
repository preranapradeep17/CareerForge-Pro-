/**
 * resumeSummaryPrompt.js
 *
 * Generates a Gemini prompt that rewrites and improves a professional
 * resume summary, returning structured JSON.
 *
 * @param {string} summary   - The user's current summary text.
 * @param {string} jobTitle  - The target job title / role.
 * @returns {string} Fully-formed prompt string.
 */
const buildResumeSummaryPrompt = ({ summary, jobTitle }) => `
You are an expert resume writer and career coach.

A user is applying for the role of "${jobTitle}".

Their current professional summary is:
"""
${summary}
"""

Your task:
1. Rewrite the summary to be compelling, concise (3-5 sentences), and tailored to the "${jobTitle}" role.
2. Use strong action verbs and quantifiable language where possible.
3. Provide 3 concrete improvement tips.

Respond ONLY with valid JSON in exactly this shape (no markdown, no extra text):
{
  "improvedSummary": "<rewritten summary text>",
  "tips": [
    "<tip 1>",
    "<tip 2>",
    "<tip 3>"
  ]
}
`.trim();

module.exports = { buildResumeSummaryPrompt };
