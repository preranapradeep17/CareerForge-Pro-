/**
 * skillsSuggestionPrompt.js
 *
 * Generates a Gemini prompt that recommends additional skills a candidate
 * should add to their resume based on their current skills and target role.
 *
 * @param {string[]} currentSkills - Array of skills the user already has.
 * @param {string}   jobTitle      - The target job title / role.
 * @returns {string} Fully-formed prompt string.
 */
const buildSkillsSuggestionPrompt = ({ currentSkills, jobTitle }) => `
You are a career coach specializing in tech and professional skills development.

A candidate is targeting the role of "${jobTitle}".

Their current skills are:
${currentSkills.length > 0 ? currentSkills.map((s) => `- ${s}`).join('\n') : '- (none listed)'}

Your task:
1. Suggest 6–10 highly relevant skills they should add to stand out for "${jobTitle}".
2. Do NOT repeat skills they already have.
3. For each suggestion, briefly explain (1 sentence) why it matters for this role.
4. Provide a one-sentence reason summarising the overall suggestion strategy.

Respond ONLY with valid JSON in exactly this shape (no markdown, no extra text):
{
  "suggestedSkills": [
    { "skill": "<skill name>", "why": "<one sentence explanation>" },
    "..."
  ],
  "reason": "<one sentence strategy summary>"
}
`.trim();

module.exports = { buildSkillsSuggestionPrompt };
