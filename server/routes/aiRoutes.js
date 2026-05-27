const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { generateJSON } = require('../services/geminiService');
const { buildResumeSummaryPrompt } = require('../prompts/resumeSummaryPrompt');
const { buildAtsAnalysisPrompt } = require('../prompts/atsAnalysisPrompt');
const { buildSkillsSuggestionPrompt } = require('../prompts/skillsSuggestionPrompt');

const router = express.Router();

// ─── POST /api/ai/improve-summary ─────────────────────────────────────────────
// Body: { summary: string, jobTitle: string }
// Returns: { improvedSummary: string, tips: string[] }
router.post('/improve-summary', protect, async (req, res) => {
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
router.post('/ats-analysis', protect, async (req, res) => {
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
router.post('/suggest-skills', protect, async (req, res) => {
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

module.exports = router;
