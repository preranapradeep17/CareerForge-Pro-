/**
 * coverLetterPrompt.js
 *
 * Generates a Gemini prompt that writes a professional, targeted cover letter
 * based on the user's resume data and the target job description.
 *
 * @param {object} resumeData      - Current resume data (fullName, title, summary, skills).
 * @param {string} jobDescription  - Target job description.
 * @returns {string} Fully-formed prompt string.
 */
const buildCoverLetterPrompt = ({ resumeData, jobDescription }) => {
  const name = resumeData.fullName || 'Job Applicant';
  const title = resumeData.title || 'Target Role';
  const summary = resumeData.summary || 'A skilled professional';
  const skills = Array.isArray(resumeData.skills)
    ? resumeData.skills.join(', ')
    : String(resumeData.skills || '');

  return `
You are an expert career consultant and copywriter.
Write a personalized, professional cover letter to apply for the role described in the Job Description.

Resume Information:
- Candidate Name: ${name}
- Candidate Title: ${title}
- Candidate Summary: ${summary}
- Candidate Key Skills: ${skills}

Target Job Description:
"""
${jobDescription.trim()}
"""

Instructions:
1. Write a formal, tailored cover letter of 3 to 4 paragraphs (200-300 words).
2. Avoid generic phrases; reference skills and qualities from the resume that align with the job description.
3. Keep the tone professional, persuasive, and confident.
4. Output the result in JSON format ONLY.

Respond ONLY with valid JSON in exactly this shape (no markdown, no extra text):
{
  "coverLetter": "<complete formatted cover letter text, with newlines represented as \\n>"
}
`.trim();
};

module.exports = { buildCoverLetterPrompt };
