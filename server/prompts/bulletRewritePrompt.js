/**
 * bulletRewritePrompt.js
 *
 * Builds a Gemini prompt that rewrites a resume bullet to be
 * ATS-friendly, impact-focused, and keyword-aligned.
 *
 * @param {string} originalBullet
 * @param {string} jobDescription
 * @param {string[]} targetKeywords
 * @returns {string}
 */
const buildBulletRewritePrompt = ({ originalBullet, jobDescription, targetKeywords }) => `
You are an expert resume writer and ATS optimization specialist.

Rewrite the resume bullet below to make it:
- clear and professional
- impact-focused with measurable outcomes where realistic
- aligned with ATS keywords from the job description

Rules:
- Return one rewritten bullet only.
- Keep it concise (max 28 words).
- Start with a strong action verb.
- Keep claims realistic and avoid fabricated numbers unless framed reasonably.
- If targetKeywords are provided, naturally include up to 2 of them.

--- ORIGINAL BULLET ---
${originalBullet}

--- JOB DESCRIPTION CONTEXT ---
${jobDescription || 'N/A'}

--- TARGET KEYWORDS ---
${targetKeywords.length ? targetKeywords.join(', ') : 'N/A'}

Respond ONLY with valid JSON in exactly this shape (no markdown, no extra text):
{
  "rewrittenBullet": "<single improved bullet>",
  "keywordsUsed": ["<keyword>", "..."],
  "improvementNotes": ["<short note>", "..."]
}
`.trim();

module.exports = { buildBulletRewritePrompt };
