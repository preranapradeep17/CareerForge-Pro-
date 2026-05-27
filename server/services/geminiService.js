const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Singleton ────────────────────────────────────────────────────────────────
let _model = null;

const getModel = () => {
  if (!_model) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        'GEMINI_API_KEY is not set. Add it to your .env file.'
      );
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    _model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return _model;
};

// ─── Core helper ──────────────────────────────────────────────────────────────

/**
 * Send a prompt to Gemini 1.5 Flash and return the plain-text response.
 *
 * @param {string} prompt   The fully-formed prompt string.
 * @returns {Promise<string>} Raw text from the model.
 */
const generateContent = async (prompt) => {
  const model = getModel();
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

/**
 * Parse Gemini's response as JSON.
 * Strips optional markdown code fences (```json … ```) before parsing.
 *
 * @param {string} prompt
 * @returns {Promise<object>}
 */
const generateJSON = async (prompt) => {
  const raw = await generateContent(prompt);
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
};

module.exports = { generateContent, generateJSON };
