const { z } = require('zod');

/**
 * Express middleware to validate request body against a Zod schema.
 * Replaces req.body with parsed/cleaned values from Zod.
 */
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    return res.status(400).json({
      message: `Validation failed: ${errorDetails}`,
      errors: result.error.errors,
    });
  }
  req.body = result.data;
  next();
};

// ─── AUTH SCHEMAS ─────────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ─── AI SCHEMAS ───────────────────────────────────────────────────────────────

const improveSummarySchema = z.object({
  summary: z.string().trim().min(1, 'Summary is required and cannot be empty'),
  jobTitle: z.string().trim().min(1, 'Job title is required and cannot be empty'),
});

const atsAnalysisSchema = z.object({
  resumeData: z.object({
    fullName: z.string().trim().optional().default(''),
    title: z.string().trim().optional().default(''),
    summary: z.string().trim().optional().default(''),
    skills: z.union([z.array(z.string()), z.string()]).optional().default([]),
  }),
  jobDescription: z.string().trim().min(1, 'Job description is required and cannot be empty'),
});

const suggestSkillsSchema = z.object({
  currentSkills: z.union([z.array(z.string()), z.string()]).optional().default([]),
  jobTitle: z.string().trim().min(1, 'Job title is required and cannot be empty'),
});

const analyzeJdSchema = z.object({
  jobDescription: z.string().trim().min(1, 'Job description is required and cannot be empty'),
});

const rewriteBulletSchema = z.object({
  originalBullet: z.string().trim().min(1, 'Original bullet is required and cannot be empty'),
  jobDescription: z.string().trim().optional().default(''),
  targetKeywords: z.union([z.array(z.string()), z.string()]).optional().default([]),
});

const generateCoverLetterSchema = z.object({
  resumeData: z.object({
    fullName: z.string().trim().optional().default(''),
    title: z.string().trim().optional().default(''),
    summary: z.string().trim().optional().default(''),
    skills: z.union([z.array(z.string()), z.string()]).optional().default([]),
  }),
  jobDescription: z.string().trim().min(1, 'Job description is required and cannot be empty'),
});

module.exports = {
  validateBody,
  registerSchema,
  loginSchema,
  improveSummarySchema,
  atsAnalysisSchema,
  suggestSkillsSchema,
  analyzeJdSchema,
  rewriteBulletSchema,
  generateCoverLetterSchema,
};
