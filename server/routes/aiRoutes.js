const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { protect } = require('../middleware/authMiddleware');
const { requirePro } = require('../middleware/gateMiddleware');
const {
  validateBody,
  improveSummarySchema,
  atsAnalysisSchema: atsAnalysisValidationSchema,
  suggestSkillsSchema,
  analyzeJdSchema,
  rewriteBulletSchema,
  generateCoverLetterSchema,
} = require('../middleware/validationMiddleware');
const {
  generateJSON,
  resumeSummarySchema,
  atsAnalysisSchema,
  skillsSuggestionSchema,
  jdAnalysisSchema,
  bulletRewriteSchema,
  resumeParseSchema,
  coverLetterSchema
} = require('../services/geminiService');
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

const RateLimit = require('../models/RateLimit');

const aiRateLimiter = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip;
    const plan = req.user?.plan || 'free';
    const limit = plan === 'pro' ? 100 : 10; // 100/hr for pro, 10/hr for free
    const windowMs = 60 * 60 * 1000; // 1 hour

    const now = new Date();
    
    // Find or create rate limit record
    let record = await RateLimit.findOne({ key: userId });
    
    if (!record) {
      record = new RateLimit({
        key: userId,
        count: 0,
        resetTime: new Date(now.getTime() + windowMs)
      });
    }

    // Reset window if expired
    if (now > record.resetTime) {
      record.resetTime = new Date(now.getTime() + windowMs);
      record.count = 0;
    }

    if (record.count >= limit) {
      const remainingMins = Math.ceil((record.resetTime.getTime() - now.getTime()) / 60000);
      return res.status(429).json({
        message: `Rate limit exceeded. Please try again in ${remainingMins} minutes. Upgrade to Pro for 10x higher limits.`,
      });
    }

    record.count++;
    await record.save();

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - record.count);
    res.setHeader('X-RateLimit-Reset', record.resetTime.toISOString());
    next();
  } catch (error) {
    console.error('[RateLimiter] Database check failed, falling back to non-limited:', error.message);
    // On db failure, fall back to letting request proceed to avoid downtime
    next();
  }
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
router.post('/improve-summary', protect, aiRateLimiter, validateBody(improveSummarySchema), async (req, res) => {
  try {
    const { summary, jobTitle } = req.body;

    const prompt = buildResumeSummaryPrompt({ summary: summary.trim(), jobTitle: jobTitle.trim() });
    const result = await generateJSON(prompt, resumeSummarySchema);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] improve-summary error:', error.message);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

// ─── POST /api/ai/ats-analysis ────────────────────────────────────────────────
// Body: { resumeData: { fullName, title, summary, skills }, jobDescription: string }
// Returns: { atsScore: number, missingKeywords: string[], suggestions: string[], overallFeedback: string }
router.post('/ats-analysis', protect, aiRateLimiter, validateBody(atsAnalysisValidationSchema), async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    const prompt = buildAtsAnalysisPrompt({ resumeData, jobDescription: jobDescription.trim() });
    const result = await generateJSON(prompt, atsAnalysisSchema);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] ats-analysis error:', error.message);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

// ─── POST /api/ai/suggest-skills ──────────────────────────────────────────────
// Body: { currentSkills: string[] | string, jobTitle: string }
// Returns: { suggestedSkills: { skill: string, why: string }[], reason: string }
router.post('/suggest-skills', protect, aiRateLimiter, validateBody(suggestSkillsSchema), async (req, res) => {
  try {
    const { currentSkills, jobTitle } = req.body;

    // Accept either an array or a comma-separated string
    let skillsArray = [];
    if (Array.isArray(currentSkills)) {
      skillsArray = currentSkills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof currentSkills === 'string') {
      skillsArray = currentSkills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const prompt = buildSkillsSuggestionPrompt({ currentSkills: skillsArray, jobTitle: jobTitle.trim() });
    const result = await generateJSON(prompt, skillsSuggestionSchema);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] suggest-skills error:', error.message);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

// ─── POST /api/ai/analyze-jd ────────────────────────────────────────────────
// Body: { jobDescription: string }
// Returns: { hardSkills: string[], softSkills: string[], actionVerbs: string[], domain: string[], seniorityLevel: string[] }
router.post('/analyze-jd', protect, requirePro, aiRateLimiter, validateBody(analyzeJdSchema), async (req, res) => {
  try {
    const { jobDescription } = req.body;

    const prompt = buildJdAnalysisPrompt({ jobDescription: jobDescription.trim() });
    const result = await generateJSON(prompt, jdAnalysisSchema);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] analyze-jd error:', error.message);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

// ─── POST /api/ai/rewrite-bullet ────────────────────────────────────────────
// Body: { originalBullet: string, jobDescription?: string, targetKeywords?: string[] | string }
// Returns: { rewrittenBullet: string, keywordsUsed: string[], improvementNotes: string[] }
router.post('/rewrite-bullet', protect, requirePro, aiRateLimiter, validateBody(rewriteBulletSchema), async (req, res) => {
  try {
    const { originalBullet, jobDescription, targetKeywords } = req.body;

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
    const result = await generateJSON(prompt, bulletRewriteSchema);

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
    const result = await generateJSON(prompt, resumeParseSchema);
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
router.post('/generate-cover-letter', protect, requirePro, aiRateLimiter, validateBody(generateCoverLetterSchema), async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    const prompt = buildCoverLetterPrompt({ resumeData, jobDescription });
    const result = await generateJSON(prompt, coverLetterSchema);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[AI] generate-cover-letter error:', error.message);
    return res.status(500).json({ message: 'AI cover letter request failed', error: error.message });
  }
});

module.exports = router;
