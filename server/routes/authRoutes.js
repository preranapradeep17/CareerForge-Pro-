const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateBody, registerSchema, loginSchema } = require('../middleware/validationMiddleware');

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      plan: 'free',
      resumeCount: 0,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        planStatus: user.planStatus,
        planCurrentPeriodEnd: user.planCurrentPeriodEnd,
        resumeCount: user.resumeCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        planStatus: user.planStatus,
        planCurrentPeriodEnd: user.planCurrentPeriodEnd,
        resumeCount: user.resumeCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.post('/demo', async (req, res) => {
  try {
    const demoEmail = `demo_${Date.now()}_${Math.floor(Math.random() * 1000)}@careerforge.co`;
    const demoPassword = 'demopassword123';
    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    const user = await User.create({
      name: 'Demo Recruiter',
      email: demoEmail,
      password: hashedPassword,
      plan: 'pro',
      planStatus: 'active',
      resumeCount: 2,
    });

    const token = generateToken(user._id);

    const Resume = require('../models/Resume');
    const ResumeVersion = require('../models/ResumeVersion');

    // 1. Software Engineer Resume
    const resume1 = await Resume.create({
      user: user._id,
      personalInfo: {
        fullName: 'Alex Rivera',
        email: 'alex.rivera@example.com',
        phone: '+1 (555) 019-2834',
        location: 'San Francisco, CA',
        summary: 'Senior Frontend Engineer with 6+ years of experience building responsive, accessible web applications. Expert in React, Redux, and modern CSS frameworks, with a strong focus on web performance optimization.',
      },
      skills: ['React', 'TypeScript', 'Node.js', 'Redux', 'Tailwind CSS', 'GraphQL', 'Jest', 'Docker', 'CI/CD'],
      template: 'modern',
      targetJD: 'Senior Software Engineer',
      atsScore: 88,
      experience: [
        {
          company: 'TechForge Solutions',
          role: 'Senior Frontend Developer',
          location: 'San Francisco, CA',
          startDate: '2022-03',
          endDate: 'Present',
          currentlyWorking: true,
          description: 'Led development of a high-traffic React dashboard, improving initial load time by 35% through code splitting and tree shaking. Mentored 4 junior developers and established design system guidelines.',
        },
        {
          company: 'DevStream Inc',
          role: 'Software Engineer',
          location: 'Austin, TX',
          startDate: '2019-06',
          endDate: '2022-02',
          currentlyWorking: false,
          description: 'Developed and maintained clean, responsive web portals using Vue.js and Express. Collaborated closely with product designers to implement pixel-perfect, accessible user interfaces.',
        }
      ],
      education: [
        {
          institution: 'University of Texas at Austin',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2015-09',
          endDate: '2019-05',
          grade: '3.8 GPA',
        }
      ],
      projects: [
        {
          title: 'OpenSource UI Library',
          description: 'A lightweight, fully accessible component library designed with React and Tailwind CSS, receiving 1.2k+ stars on GitHub.',
          technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Rollup'],
          link: 'https://github.com/alexrivera/opensource-ui',
        }
      ]
    });

    // Create versions for Resume 1
    await ResumeVersion.create({
      resume: resume1._id,
      personalInfo: resume1.personalInfo,
      skills: resume1.skills,
      template: resume1.template,
      targetJD: resume1.targetJD,
      atsScore: 80,
      versionName: 'Original Draft',
      experience: resume1.experience,
      education: resume1.education,
      projects: resume1.projects,
    });

    await ResumeVersion.create({
      resume: resume1._id,
      personalInfo: {
        ...resume1.personalInfo,
        summary: 'Senior Frontend Engineer specializing in high-performance React applications. Expert in TypeScript and GraphQL.',
      },
      skills: resume1.skills,
      template: resume1.template,
      targetJD: resume1.targetJD,
      atsScore: 88,
      versionName: 'Auto-saved Version (10:15 AM)',
      experience: resume1.experience,
      education: resume1.education,
      projects: resume1.projects,
    });

    // 2. Product Manager Resume
    const resume2 = await Resume.create({
      user: user._id,
      personalInfo: {
        fullName: 'Taylor Morgan',
        email: 'taylor.morgan@example.com',
        phone: '+1 (555) 014-9988',
        location: 'New York, NY',
        summary: 'Data-driven Product Manager with a background in engineering. Skilled in driving lifecycle development of SaaS features, coordinating cross-functional teams, and interpreting user analytics to prioritize product roadmaps.',
      },
      skills: ['Product Strategy', 'Agile Roadmap', 'SQL', 'Google Analytics', 'A/B Testing', 'Jira', 'User Research', 'Wireframing'],
      template: 'minimal',
      targetJD: 'Technical Product Manager',
      atsScore: 79,
      experience: [
        {
          company: 'SaaSify Systems',
          role: 'Product Manager',
          location: 'New York, NY',
          startDate: '2023-01',
          endDate: 'Present',
          currentlyWorking: true,
          description: 'Defined roadmap and spearheaded launch of a new collaborative workspace feature, resulting in a 24% increase in user retention. Conducted over 40 customer interviews to inform target pain points.',
        },
        {
          company: 'DataSync Co',
          role: 'Associate Product Manager',
          location: 'Boston, MA',
          startDate: '2021-08',
          endDate: '2022-12',
          currentlyWorking: false,
          description: 'Collaborated with engineering to prioritize backlog for integrations platform. Formulated A/B tests that boosted user conversion rate by 12%.',
        }
      ],
      education: [
        {
          institution: 'Boston University',
          degree: 'Bachelor of Business Administration',
          fieldOfStudy: 'Information Systems',
          startDate: '2017-09',
          endDate: '2021-05',
          grade: '3.7 GPA',
        }
      ],
      projects: [
        {
          title: 'TaskFlow Mobile App',
          description: 'Conceived and launched a personal productivity side project, acquiring 5,000+ active users through organic search optimization.',
          technologies: ['Figma', 'Amplitude', 'Product Hunt'],
          link: 'https://producthunt.com/taskflow',
        }
      ]
    });

    await ResumeVersion.create({
      resume: resume2._id,
      personalInfo: resume2.personalInfo,
      skills: resume2.skills,
      template: resume2.template,
      targetJD: resume2.targetJD,
      atsScore: 79,
      versionName: 'Initial Draft',
      experience: resume2.experience,
      education: resume2.education,
      projects: resume2.projects,
    });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        planStatus: user.planStatus,
        resumeCount: user.resumeCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to initialize demo mode', error: error.message });
  }
});

module.exports = router;
