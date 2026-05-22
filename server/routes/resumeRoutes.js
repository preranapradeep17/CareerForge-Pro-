const express = require('express');
const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

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

  return null;
};

router.post('/', protect, async (req, res) => {
  try {
    const validationError = validateResumePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const resume = await Resume.create({
      user: req.user.id,
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

    return res.status(201).json({ resume });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create resume', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ updatedAt: -1 });
    return res.status(200).json({ resumes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch resumes', error: error.message });
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

module.exports = router;
