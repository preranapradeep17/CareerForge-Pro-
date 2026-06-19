const mongoose = require('mongoose');

const personalInfoVersionSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    summary: { type: String, default: '' },
  },
  { _id: false }
);

const experienceVersionSchema = new mongoose.Schema(
  {
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    currentlyWorking: { type: Boolean, default: false },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const educationVersionSchema = new mongoose.Schema(
  {
    institution: { type: String, default: '' },
    degree: { type: String, default: '' },
    fieldOfStudy: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    grade: { type: String, default: '' },
  },
  { _id: false }
);

const projectVersionSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    technologies: [{ type: String }],
    link: { type: String, default: '' },
  },
  { _id: false }
);

const resumeVersionSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: 'Untitled Resume',
    },
    personalInfo: {
      type: personalInfoVersionSchema,
      required: true,
      default: () => ({}),
    },
    experience: {
      type: [experienceVersionSchema],
      default: [],
    },
    education: {
      type: [educationVersionSchema],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    projects: {
      type: [projectVersionSchema],
      default: [],
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    template: {
      type: String,
      default: 'classic',
    },
    targetJD: {
      type: String,
      default: '',
    },
    versionName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ResumeVersion', resumeVersionSchema);
