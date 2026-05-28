/**
 * jdAnalysisPrompt.js
 *
 * Builds a Gemini prompt that extracts ATS-relevant keyword groups
 * from a job description for resume alignment.
 *
 * @param {string} jobDescription
 * @returns {string}
 */
const buildJdAnalysisPrompt = ({ jobDescription }) => `
You are an ATS keyword extraction expert.

Analyse the job description and extract high-signal keywords grouped into:
1) hardSkills
2) softSkills
3) actionVerbs
4) domain
5) seniorityLevel

Rules:
- Return concise tags (short phrases, typically 1-3 words).
- Avoid duplicates across all arrays.
- Keep only terms clearly supported by the job description text.
- seniorityLevel must contain only one best-fit value.

--- JOB DESCRIPTION ---
${jobDescription}

Respond ONLY with valid JSON in exactly this shape (no markdown, no extra text):
{
  "hardSkills": ["<skill>", "..."],
  "softSkills": ["<skill>", "..."],
  "actionVerbs": ["<verb>", "..."],
  "domain": ["<domain>", "..."],
  "seniorityLevel": ["<single level>"]
}
`.trim();

module.exports = { buildJdAnalysisPrompt };
