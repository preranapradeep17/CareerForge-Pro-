const buildResumeParsePrompt = ({ resumeText }) => `
You are a resume parser.
Convert the raw resume text into strict JSON.

Output JSON only with this exact shape:
{
  "fullName": "string",
  "title": "string",
  "summary": "string",
  "skills": ["string"]
}

Rules:
- Do not add markdown or extra keys.
- If a field is unknown, return an empty string.
- "skills" must be an array of unique, concise skill names.
- Keep summary under 90 words.

Raw resume text:
${resumeText}
`;

module.exports = { buildResumeParsePrompt };
