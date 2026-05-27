/**
 * atsAnalysisPrompt.js
 *
 * Generates a Gemini prompt that scores a resume against a job description,
 * identifies keyword gaps, and suggests improvements.
 *
 * @param {object} resumeData       - Key resume fields (fullName, title, summary, skills).
 * @param {string} jobDescription   - The raw job description text.
 * @returns {string} Fully-formed prompt string.
 */
const buildAtsAnalysisPrompt = ({ resumeData, jobDescription }) => `
You are an ATS (Applicant Tracking System) expert and professional resume consultant.

Analyse the following resume against the provided job description and score how well it matches.

--- RESUME ---
Name: ${resumeData.fullName || 'N/A'}
Target Role / Title: ${resumeData.title || 'N/A'}
Professional Summary: ${resumeData.summary || 'N/A'}
Skills: ${resumeData.skills || 'N/A'}

--- JOB DESCRIPTION ---
${jobDescription}

Your tasks:
1. Give an ATS match score from 0–100 (integer).
2. List up to 8 important keywords from the JD that are MISSING from the resume.
3. Provide 3–5 specific, actionable suggestions to improve the match.
4. Write one sentence of overall feedback.

Respond ONLY with valid JSON in exactly this shape (no markdown, no extra text):
{
  "atsScore": <integer 0-100>,
  "missingKeywords": ["<keyword>", "..."],
  "suggestions": ["<suggestion>", "..."],
  "overallFeedback": "<one sentence>"
}
`.trim();

module.exports = { buildAtsAnalysisPrompt };
