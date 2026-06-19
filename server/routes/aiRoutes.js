const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { protect } = require('../middleware/authMiddleware');
const { requirePro } = require('../middleware/gateMiddleware');
const { generateJSON } = require('../services/geminiService');
const { buildResumeSummaryPrompt } = require('../prompts/resumeSummaryPrompt');
const { buildAtsAnalysisPrompt } = require('../prompts/atsAnalysisPrompt');
const { buildSkillsSuggestionPrompt } = require('../prompts/skillsSuggestionPrompt');
const { buildJdAnalysisPrompt } = require('../prompts/jdAnalysisPrompt');
const { buildBulletRewritePrompt } = require('../prompts/bulletRewritePrompt');
const { buildResumeParsePrompt } = require('../prompts/resumeParsePrompt');
const { buildCoverLetterPrompt } = require('../prompts/coverLetterPrompt');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const MAX_RESUME_TEXT_CHARS = 15000;

const rateLimitStore = {};

const aiRateLimiter = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const plan = req.user?.plan || 'free';
  const limit = plan === 'pro' ? 100 : 10; // 100/hr for pro, 10/hr for free
  const windowMs = 60 * 60 * 1000; // 1 hour

  const now = Date.now();
  if (!rateLimitStore[userId]) {
    rateLimitStore[userId] = {
      resetTime: now + windowMs,
      count: 0,
    };
  }

  const record = rateLimitStore[userId];

  // Reset window if expired
  if (now > record.resetTime) {
    record.resetTime = now + windowMs;
    record.count = 0;
  }

  if (record.count >= limit) {
    const remainingMins = Math.ceil((record.resetTime - now) / 60000);
    return res.status(429).json({
      message: `Rate limit exceeded. Please try again in ${remainingMins} minutes. Upgrade to Pro for 10x higher limits.`,
    });
  }

  record.count++;
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', limit - record.count);
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
  next();
};

const normalizeSkill = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const extractSkillsFromText = (rawText) => {
  const lines = rawText.split('\n').map((line) => line.trim()).filter(Boolean);
  const skillLine = lines.find((line) => /^skills?\s*[:|-]/i.test(line));
  if (!skillLine) return [];
  const [, skillText = ''] = skillLine.split(/[:|-]/, 2);
  return [...new Set(skillText
    .split(/[;,|]/)
    .map(normalizeSkill)
    .filter(Boolean))].slice(0, 25);
};

const normalizeParsedResume = (result, rawText) => {
  const fullName = typeof result.fullName === 'string' ? result.fullName.trim() : '';
  const title = typeof result.title === 'string' ? result.title.trim() : '';
  const summary = typeof result.summary === 'string' ? result.summary.trim() : '';

  const aiSkills = Array.isArray(result.skills)
    ? result.skills.map(normalizeSkill).filter(Boolean)
    : [];
  const fallbackSkills = aiSkills.length > 0 ? [] : extractSkillsFromText(rawText);

  return {
    fullName,
    title,
    summary,
    skills: [...new Set([...aiSkills, ...fallbackSkills])],
  };
};

// ─── POST /api/ai/improve-summary ─────────────────────────────────────────────
// Body: { summary: string, jobTitle: string }
// Returns: { improvedSummary: string, tips: string[] }
router.post('/improve-summary', protect, aiRateLimiter, async (req, res) => {
  try {
    const { summary, jobTitle } = req.body;

    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      return res.status(400).json({ message: 'summary is required and must be a non-empty string' });
    }
    if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
      return res.status(400).json({ message: 'jobTitle is required and must be a non-empty string' });
    }

    const prompt = buildResumeSummaryPrompt({ summary: summary.trim(), jobTitle: jobTitle.trim() });
    const result = await generateJSON(prompt);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] improve-summary error:', error.message);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

// ─── POST /api/ai/ats-analysis ────────────────────────────────────────────────
// Body: { resumeData: { fullName, title, summary, skills }, jobDescription: string }
// Returns: { atsScore: number, missingKeywords: string[], suggestions: string[], overallFeedback: string }
router.post('/ats-analysis', protect, aiRateLimiter, async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData || typeof resumeData !== 'object') {
      return res.status(400).json({ message: 'resumeData is required and must be an object' });
    }
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      return res.status(400).json({ message: 'jobDescription is required and must be a non-empty string' });
    }

    const prompt = buildAtsAnalysisPrompt({ resumeData, jobDescription: jobDescription.trim() });
    const result = await generateJSON(prompt);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] ats-analysis error:', error.message);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

// ─── POST /api/ai/suggest-skills ──────────────────────────────────────────────
// Body: { currentSkills: string[] | string, jobTitle: string }
// Returns: { suggestedSkills: { skill: string, why: string }[], reason: string }
router.post('/suggest-skills', protect, aiRateLimiter, async (req, res) => {
  try {
    const { currentSkills, jobTitle } = req.body;

    if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
      return res.status(400).json({ message: 'jobTitle is required and must be a non-empty string' });
    }

    // Accept either an array or a comma-separated string
    let skillsArray = [];
    if (Array.isArray(currentSkills)) {
      skillsArray = currentSkills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof currentSkills === 'string') {
      skillsArray = currentSkills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const prompt = buildSkillsSuggestionPrompt({ currentSkills: skillsArray, jobTitle: jobTitle.trim() });
    const result = await generateJSON(prompt);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] suggest-skills error:', error.message);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

// ─── POST /api/ai/analyze-jd ────────────────────────────────────────────────
// Body: { jobDescription: string }
// Returns: { hardSkills: string[], softSkills: string[], actionVerbs: string[], domain: string[], seniorityLevel: string[] }
router.post('/analyze-jd', protect, requirePro, aiRateLimiter, async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      return res.status(400).json({ message: 'jobDescription is required and must be a non-empty string' });
    }

    const prompt = buildJdAnalysisPrompt({ jobDescription: jobDescription.trim() });
    const result = await generateJSON(prompt);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] analyze-jd error:', error.message);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

// ─── POST /api/ai/rewrite-bullet ────────────────────────────────────────────
// Body: { originalBullet: string, jobDescription?: string, targetKeywords?: string[] | string }
// Returns: { rewrittenBullet: string, keywordsUsed: string[], improvementNotes: string[] }
router.post('/rewrite-bullet', protect, requirePro, aiRateLimiter, async (req, res) => {
  try {
    const { originalBullet, jobDescription, targetKeywords } = req.body;

    if (!originalBullet || typeof originalBullet !== 'string' || originalBullet.trim().length === 0) {
      return res.status(400).json({ message: 'originalBullet is required and must be a non-empty string' });
    }

    let keywordsArray = [];
    if (Array.isArray(targetKeywords)) {
      keywordsArray = targetKeywords.map((k) => String(k).trim()).filter(Boolean);
    } else if (typeof targetKeywords === 'string') {
      keywordsArray = targetKeywords.split(',').map((k) => k.trim()).filter(Boolean);
    }

    const prompt = buildBulletRewritePrompt({
      originalBullet: originalBullet.trim(),
      jobDescription: typeof jobDescription === 'string' ? jobDescription.trim() : '',
      targetKeywords: keywordsArray,
    });
    const result = await generateJSON(prompt);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] rewrite-bullet error:', error.message);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

// ─── POST /api/ai/parse-resume ───────────────────────────────────────────────
// multipart/form-data: { resume: PDF file }
// Returns: { fullName, title, summary, skills[] }
router.post('/parse-resume', protect, upload.single('resume'), aiRateLimiter, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'resume PDF file is required' });
    }
    const isPdfByMime = req.file.mimetype === 'application/pdf';
    const isPdfByName = /\.pdf$/i.test(req.file.originalname || '');
    if (!isPdfByMime && !isPdfByName) {
      return res.status(400).json({ message: 'Only PDF files are supported' });
    }

    const pdf = await pdfParse(req.file.buffer);
    const rawText = String(pdf.text || '').trim();
    if (!rawText) {
      return res.status(400).json({ message: 'No readable text found in PDF' });
    }

    const prompt = buildResumeParsePrompt({ resumeText: rawText.slice(0, MAX_RESUME_TEXT_CHARS) });
    const result = await generateJSON(prompt);
    const normalized = normalizeParsedResume(result, rawText);

    return res.status(200).json(normalized);
  } catch (error) {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'PDF too large. Max size is 5MB.' });
    }
    console.error('[AI] parse-resume error:', error.message);
    return res.status(500).json({ message: 'Resume parsing failed', error: error.message });
  }
});

// ─── POST /api/ai/generate-cover-letter ─────────────────────────────────────
// Body: { resumeData: { fullName, title, summary, skills }, jobDescription: string }
// Returns: { coverLetter: string }
router.post('/generate-cover-letter', protect, requirePro, aiRateLimiter, async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData || typeof resumeData !== 'object') {
      return res.status(400).json({ message: 'resumeData is required and must be an object' });
    }
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      return res.status(400).json({ message: 'jobDescription is required and must be a non-empty string' });
    }

    const prompt = buildCoverLetterPrompt({ resumeData, jobDescription });
    const result = await generateJSON(prompt);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] generate-cover-letter error:', error.message);
    return res.status(500).json({ message: 'AI cover letter request failed', error: error.message });
  }
});

module.exports = router;
