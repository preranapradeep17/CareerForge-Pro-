const express = require('express');
const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const User = require('../models/User');
const ResumeVersion = require('../models/ResumeVersion');
const { protect } = require('../middleware/authMiddleware');
const { requirePro } = require('../middleware/gateMiddleware');
const { generateResumePdfBuffer } = require('../services/pdfService');

const router = express.Router();

const isNonNullObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const validateResumePayload = (payload) => {
  if (!isNonNullObject(payload)) {
    return 'Request body must be a valid object';
  }

  if (!isNonNullObject(payload.personalInfo)) {
    return 'personalInfo is required and must be an object';
  }

  if (payload.experience !== undefined && !Array.isArray(payload.experience)) {
    return 'experience must be an array';
  }

  if (payload.education !== undefined && !Array.isArray(payload.education)) {
    return 'education must be an array';
  }

  if (payload.skills !== undefined && !Array.isArray(payload.skills)) {
    return 'skills must be an array';
  }

  if (payload.projects !== undefined && !Array.isArray(payload.projects)) {
    return 'projects must be an array';
  }

  if (payload.atsScore !== undefined) {
    const isNumber = typeof payload.atsScore === 'number' && Number.isFinite(payload.atsScore);
    if (!isNumber || payload.atsScore < 0 || payload.atsScore > 100) {
      return 'atsScore must be a number between 0 and 100';
    }
  }

  if (payload.template !== undefined && typeof payload.template !== 'string') {
    return 'template must be a string';
  }

  if (payload.targetJD !== undefined && typeof payload.targetJD !== 'string') {
    return 'targetJD must be a string';
  }

  if (payload.name !== undefined && typeof payload.name !== 'string') {
    return 'name must be a string';
  }

  return null;
};

const saveAutomaticVersion = async (resume) => {
  try {
    const latestVersion = await ResumeVersion.findOne({ resume: resume._id }).sort({ createdAt: -1 });
    const normalize = (val) => JSON.stringify(val || '');

    if (latestVersion) {
      const isDifferent =
        latestVersion.name !== resume.name ||
        normalize(latestVersion.personalInfo) !== normalize(resume.personalInfo) ||
        normalize(latestVersion.skills) !== normalize(resume.skills) ||
        latestVersion.template !== resume.template ||
        latestVersion.targetJD !== resume.targetJD;

      if (!isDifferent) {
        return;
      }

      const isAutoSaved = latestVersion.versionName.startsWith('Auto-saved');
      const timeDiffMs = Date.now() - new Date(latestVersion.createdAt).getTime();

      if (isAutoSaved && timeDiffMs < 2 * 60 * 1000) {
        latestVersion.name = resume.name;
        latestVersion.personalInfo = resume.personalInfo;
        latestVersion.experience = resume.experience;
        latestVersion.education = resume.education;
        latestVersion.skills = resume.skills;
        latestVersion.projects = resume.projects;
        latestVersion.atsScore = resume.atsScore;
        latestVersion.template = resume.template;
        latestVersion.targetJD = resume.targetJD;

        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        latestVersion.versionName = `Auto-saved Version (${timeString})`;
        await latestVersion.save();
        return;
      }
    }

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await ResumeVersion.create({
      resume: resume._id,
      name: resume.name,
      personalInfo: resume.personalInfo,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
      atsScore: resume.atsScore,
      template: resume.template,
      targetJD: resume.targetJD,
      versionName: `Auto-saved Version (${timeString})`,
    });
  } catch (err) {
    console.error('[Version History] Error saving automatic version snapshot:', err.message);
  }
};

router.post('/', protect, async (req, res) => {
  try {
    const validationError = validateResumePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Check user plan and resume count limit
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.plan === 'free' && user.resumeCount >= 1) {
      return res.status(403).json({
        message: 'Free plan limit reached. You can only create 1 resume on the Starter plan. Upgrade to Pro for unlimited resumes.',
        upgradeRequired: true,
      });
    }

    const resume = await Resume.create({
      user: req.user.id,
      name: req.body.name || 'Untitled Resume',
      personalInfo: req.body.personalInfo,
      experience: req.body.experience || [],
      education: req.body.education || [],
      skills: req.body.skills || [],
      projects: req.body.projects || [],
      atsScore: req.body.atsScore ?? 0,
      template: req.body.template || 'classic',
      targetJD: req.body.targetJD || '',
    });

    await User.findByIdAndUpdate(req.user.id, { $inc: { resumeCount: 1 } });

    await saveAutomaticVersion(resume);

    return res.status(201).json({ resume });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create resume', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ updatedAt: -1 }).lean();
    
    // Attach previous ATS score from version history
    const resumesWithTrend = await Promise.all(
      resumes.map(async (resume) => {
        const versions = await ResumeVersion.find({ resume: resume._id })
          .sort({ createdAt: -1 })
          .select('atsScore')
          .limit(2)
          .lean();

        let lastAtsScore = null;
        if (versions.length > 1) {
          lastAtsScore = versions[1].atsScore;
        } else if (versions.length === 1) {
          lastAtsScore = versions[0].atsScore;
        }

        return {
          ...resume,
          lastAtsScore,
        };
      })
    );

    return res.status(200).json({ resumes: resumesWithTrend });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch resumes', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume id' });
    }

    const resume = await Resume.findOne({ _id: id, user: req.user.id });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    return res.status(200).json({ resume });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch resume', error: error.message });
  }
});

router.post('/export/pdf', protect, requirePro, async (req, res) => {
  try {
    const validationError = validateResumePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const pdfBuffer = await generateResumePdfBuffer(req.body);
    const safeFileName = (req.body.personalInfo?.fullName || 'resume')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'resume';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: statusCode === 500 ? 'Failed to export resume PDF' : error.message,
      error: error.message,
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume id' });
    }

    const validationError = validateResumePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatedResume = await Resume.findOneAndUpdate(
      { _id: id, user: req.user.id },
      {
        name: req.body.name || 'Untitled Resume',
        personalInfo: req.body.personalInfo,
        experience: req.body.experience || [],
        education: req.body.education || [],
        skills: req.body.skills || [],
        projects: req.body.projects || [],
        atsScore: req.body.atsScore ?? 0,
        template: req.body.template || 'classic',
        targetJD: req.body.targetJD || '',
      },
      { new: true, runValidators: true }
    );

    if (!updatedResume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    await saveAutomaticVersion(updatedResume);

    return res.status(200).json({ resume: updatedResume });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update resume', error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume id' });
    }

    const deletedResume = await Resume.findOneAndDelete({ _id: id, user: req.user.id });

    if (!deletedResume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    await User.findByIdAndUpdate(req.user.id, { $inc: { resumeCount: -1 } });

    return res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete resume', error: error.message });
  }
});

// ─── POST /api/resumes/:id/versions ──────────────────────────────────────────
// Saves a snapshot version of the current resume state.
router.post('/:id/versions', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { versionName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume id' });
    }

    if (!versionName || typeof versionName !== 'string' || versionName.trim() === '') {
      return res.status(400).json({ message: 'versionName is required and must be a non-empty string' });
    }

    const resume = await Resume.findOne({ _id: id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const version = await ResumeVersion.create({
      resume: id,
      personalInfo: resume.personalInfo,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
      atsScore: resume.atsScore,
      template: resume.template,
      targetJD: resume.targetJD,
      versionName: versionName.trim(),
    });

    return res.status(201).json({ version });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create resume version', error: error.message });
  }
});

// ─── GET /api/resumes/:id/versions ───────────────────────────────────────────
// Fetches all saved versions for a specific resume.
router.get('/:id/versions', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume id' });
    }

    // Verify ownership
    const resume = await Resume.findOne({ _id: id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const versions = await ResumeVersion.find({ resume: id }).sort({ createdAt: -1 });
    return res.status(200).json({ versions });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch resume versions', error: error.message });
  }
});

// ─── POST /api/resumes/:id/versions/:versionId/restore ────────────────────────
// Restores the resume state to a snapshot version.
router.post('/:id/versions/:versionId/restore', protect, async (req, res) => {
  try {
    const { id, versionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(versionId)) {
      return res.status(400).json({ message: 'Invalid resume or version id' });
    }

    // Verify ownership
    const resume = await Resume.findOne({ _id: id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const version = await ResumeVersion.findOne({ _id: versionId, resume: id });
    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' });
    }

    // Restore fields
    resume.name = version.name || 'Untitled Resume';
    resume.personalInfo = version.personalInfo;
    resume.experience = version.experience;
    resume.education = version.education;
    resume.skills = version.skills;
    resume.projects = version.projects;
    resume.atsScore = version.atsScore;
    resume.template = version.template;
    resume.targetJD = version.targetJD;

    await resume.save();

    return res.status(200).json({ resume });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to restore resume version', error: error.message });
  }
});

// ─── DELETE /api/resumes/:id/versions/:versionId ──────────────────────────────
// Deletes a specific version snapshot.
router.delete('/:id/versions/:versionId', protect, async (req, res) => {
  try {
    const { id, versionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(versionId)) {
      return res.status(400).json({ message: 'Invalid resume or version id' });
    }

    // Verify ownership of the resume
    const resume = await Resume.findOne({ _id: id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const deletedVersion = await ResumeVersion.findOneAndDelete({ _id: versionId, resume: id });
    if (!deletedVersion) {
      return res.status(404).json({ message: 'Version not found' });
    }

    return res.status(200).json({ message: 'Version snapshot deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete resume version', error: error.message });
  }
});

// ─── PATCH /api/resumes/:id ──────────────────────────────────────────────────
// Allows partial updates to a resume (e.g. rename, toggling share status, etc.)
router.patch('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume id' });
    }

    const resume = await Resume.findOne({ _id: id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const allowedUpdates = [
      'name',
      'isShared',
      'shareId',
      'personalInfo',
      'experience',
      'education',
      'skills',
      'projects',
      'atsScore',
      'template',
      'targetJD',
    ];

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        resume[key] = req.body[key];
      }
    }

    await resume.save();
    await saveAutomaticVersion(resume);

    return res.status(200).json({ resume });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update resume properties', error: error.message });
  }
});

// ─── POST /api/resumes/:id/duplicate ──────────────────────────────────────────
// Clones a resume and saves it as a new copy
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume id' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.plan === 'free' && user.resumeCount >= 1) {
      return res.status(403).json({
        message: 'Free plan limit reached. You can only create 1 resume on the Starter plan. Upgrade to Pro for unlimited resumes.',
        upgradeRequired: true,
      });
    }

    const sourceResume = await Resume.findOne({ _id: id, user: req.user.id });
    if (!sourceResume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const duplicatedResume = await Resume.create({
      user: req.user.id,
      name: `${sourceResume.name || 'Untitled Resume'} (Copy)`,
      personalInfo: sourceResume.personalInfo,
      experience: sourceResume.experience || [],
      education: sourceResume.education || [],
      skills: sourceResume.skills || [],
      projects: sourceResume.projects || [],
      atsScore: sourceResume.atsScore ?? 0,
      template: sourceResume.template || 'classic',
      targetJD: sourceResume.targetJD || '',
    });

    await User.findByIdAndUpdate(req.user.id, { $inc: { resumeCount: 1 } });
    await saveAutomaticVersion(duplicatedResume);

    return res.status(201).json({ resume: duplicatedResume });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to duplicate resume', error: error.message });
  }
});

// ─── GET /api/resumes/share/:shareId ──────────────────────────────────────────
// Public endpoint to retrieve a shared resume (completely unprotected)
router.get('/share/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    if (!shareId) {
      return res.status(400).json({ message: 'shareId is required' });
    }

    const resume = await Resume.findOne({ shareId, isShared: true });
    if (!resume) {
      return res.status(404).json({ message: 'Shared resume not found or sharing disabled' });
    }

    return res.status(200).json({ resume });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch shared resume', error: error.message });
  }
});

module.exports = router;
