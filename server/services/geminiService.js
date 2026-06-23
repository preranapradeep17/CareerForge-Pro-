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
    _model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return _model;
};

// ─── Core helper ──────────────────────────────────────────────────────────────

/**
 * Send a prompt to Gemini 2.5 Flash and return the plain-text response.
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
 * Natively supports structured schemas via responseSchema when provided.
 *
 * @param {string} prompt
 * @param {object} [schema] Optional schema definition for structured JSON outputs.
 * @returns {Promise<object>}
 */
const generateJSON = async (prompt, schema = null) => {
  const model = getModel();
  
  const options = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    }
  };

  if (schema) {
    options.generationConfig.responseSchema = schema;
  }

  const result = await model.generateContent(options);
  const response = await result.response;
  const raw = response.text().trim();

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[Gemini] JSON parsing failed, running fallback extraction on text:', raw);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (_error) {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error('Model response was not valid JSON');
      }
      const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSlice);
    }
  }
};

// ─── Schemas for Structured JSON Outputs ──────────────────────────────────────

const resumeSummarySchema = {
  type: 'object',
  properties: {
    improvedSummary: { type: 'string', description: 'The rewritten and optimized summary text.' },
    tips: {
      type: 'array',
      items: { type: 'string' },
      description: 'Three concrete improvement tips for the summary.'
    }
  },
  required: ['improvedSummary', 'tips']
};

const atsAnalysisSchema = {
  type: 'object',
  properties: {
    atsScore: { type: 'integer', description: 'ATS match score from 0 to 100.' },
    missingKeywords: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 8 missing keywords from the job description.'
    },
    suggestions: {
      type: 'array',
      items: { type: 'string' },
      description: '3 to 5 specific actionable recommendations.'
    },
    overallFeedback: { type: 'string', description: 'One-sentence summary feedback.' }
  },
  required: ['atsScore', 'missingKeywords', 'suggestions', 'overallFeedback']
};

const skillsSuggestionSchema = {
  type: 'object',
  properties: {
    suggestedSkills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skill: { type: 'string', description: 'Name of the recommended skill.' },
          why: { type: 'string', description: 'One-sentence explanation of why it matters.' }
        },
        required: ['skill', 'why']
      },
      description: 'List of 6 to 10 highly relevant skill suggestions.'
    },
    reason: { type: 'string', description: 'A one-sentence strategy summary.' }
  },
  required: ['suggestedSkills', 'reason']
};

const jdAnalysisSchema = {
  type: 'object',
  properties: {
    hardSkills: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of technical or hard skills extracted.'
    },
    softSkills: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of interpersonal or soft skills extracted.'
    },
    actionVerbs: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of action verbs extracted.'
    },
    domain: {
      type: 'array',
      items: { type: 'string' },
      description: 'Industry domains or business verticals extracted.'
    },
    seniorityLevel: {
      type: 'array',
      items: { type: 'string' },
      description: 'Determined seniority level or roles (e.g. Senior).'
    }
  },
  required: ['hardSkills', 'softSkills', 'actionVerbs', 'domain', 'seniorityLevel']
};

const bulletRewriteSchema = {
  type: 'object',
  properties: {
    rewrittenBullet: { type: 'string', description: 'The single optimized resume bullet point.' },
    keywordsUsed: {
      type: 'array',
      items: { type: 'string' },
      description: 'Keywords from the target list that were integrated.'
    },
    improvementNotes: {
      type: 'array',
      items: { type: 'string' },
      description: 'Brief improvement notes about the rewrite.'
    }
  },
  required: ['rewrittenBullet', 'keywordsUsed', 'improvementNotes']
};

const resumeParseSchema = {
  type: 'object',
  properties: {
    fullName: { type: 'string', description: 'Candidate full name.' },
    title: { type: 'string', description: 'Target job title.' },
    summary: { type: 'string', description: 'Candidate professional summary.' },
    skills: {
      type: 'array',
      items: { type: 'string' },
      description: 'Array of unique, concise skill names.'
    }
  },
  required: ['fullName', 'title', 'summary', 'skills']
};

const coverLetterSchema = {
  type: 'object',
  properties: {
    coverLetter: { type: 'string', description: 'Complete text of the tailored cover letter.' }
  },
  required: ['coverLetter']
};

module.exports = {
  generateContent,
  generateJSON,
  resumeSummarySchema,
  atsAnalysisSchema,
  skillsSuggestionSchema,
  jdAnalysisSchema,
  bulletRewriteSchema,
  resumeParseSchema,
  coverLetterSchema
};

