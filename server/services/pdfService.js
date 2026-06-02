const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeResume = (resume = {}) => {
  const personalInfo = resume.personalInfo || {};

  return {
    fullName: personalInfo.fullName || 'Your Name',
    title: resume.targetJD || personalInfo.title || 'Target Role',
    summary: personalInfo.summary || '',
    email: personalInfo.email || '',
    phone: personalInfo.phone || '',
    location: personalInfo.location || '',
    skills: Array.isArray(resume.skills) ? resume.skills.filter(Boolean) : [],
    template: resume.template || 'classic',
    atsScore: Number.isFinite(resume.atsScore) ? resume.atsScore : 0,
  };
};

const buildSkillMarkup = (skills, template) => {
  if (!skills.length) {
    return '<p class="empty-state">Add your key skills to highlight your strengths.</p>';
  }

  if (template === 'minimal') {
    return `<p class="skills-inline">${skills.map(escapeHtml).join(' • ')}</p>`;
  }

  return `
    <div class="skill-grid">
      ${skills.map((skill) => `<span class="skill-chip">${escapeHtml(skill)}</span>`).join('')}
    </div>
  `;
};

const buildTemplateClass = (template) => {
  if (['classic', 'modern', 'minimal', 'executive'].includes(template)) {
    return `template-${template}`;
  }

  return 'template-classic';
};

const buildResumeHtml = (resume) => {
  const normalized = normalizeResume(resume);
  const contactItems = [normalized.email, normalized.phone, normalized.location].filter(Boolean);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(normalized.fullName)} Resume</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #eef2ff;
            color: #0f172a;
            font-family: Inter, "Segoe UI", sans-serif;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 18mm 16mm;
            background:
              radial-gradient(circle at top right, rgba(96, 165, 250, 0.2), transparent 28%),
              linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          }

          .resume-shell {
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid #dbeafe;
            background: #ffffff;
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          }

          .hero {
            padding: 28px 30px 22px;
            background:
              linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%);
            color: #ffffff;
          }

          .eyebrow {
            margin: 0 0 10px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.78);
          }

          .hero h1 {
            margin: 0;
            font-size: 30px;
            line-height: 1.05;
          }

          .hero h2 {
            margin: 8px 0 0;
            font-size: 15px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.86);
          }

          .contact-row {
            margin-top: 16px;
            font-size: 11.5px;
            color: rgba(255, 255, 255, 0.74);
          }

          .content {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
          }

          .main-column,
          .side-column {
            padding: 26px 30px 30px;
          }

          .side-column {
            background: #f8fafc;
            border-left: 1px solid #e2e8f0;
          }

          .section + .section {
            margin-top: 26px;
          }

          .section-label {
            margin: 0 0 12px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #2563eb;
          }

          .summary {
            margin: 0;
            font-size: 13px;
            line-height: 1.7;
            color: #334155;
          }

          .metric-card {
            border-radius: 18px;
            padding: 18px;
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            border: 1px solid #bfdbfe;
          }

          .metric-label {
            margin: 0;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #1d4ed8;
          }

          .metric-value {
            margin: 8px 0 0;
            font-size: 32px;
            font-weight: 800;
            color: #0f172a;
          }

          .metric-note {
            margin: 6px 0 0;
            font-size: 11.5px;
            line-height: 1.5;
            color: #475569;
          }

          .skill-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .skill-chip {
            display: inline-flex;
            align-items: center;
            min-height: 30px;
            padding: 0 12px;
            border-radius: 999px;
            background: #dbeafe;
            color: #1e3a8a;
            font-size: 11.5px;
            font-weight: 700;
          }

          .skills-inline {
            margin: 0;
            font-size: 13px;
            line-height: 1.8;
            color: #334155;
          }

          .empty-state {
            margin: 0;
            font-size: 12px;
            line-height: 1.6;
            color: #94a3b8;
          }

          .template-classic .hero {
            background: linear-gradient(135deg, #111827 0%, #1d4ed8 100%);
          }

          .template-modern .hero {
            background: linear-gradient(120deg, #0f172a 0%, #0f766e 50%, #2dd4bf 100%);
          }

          .template-modern .skill-chip {
            background: #ccfbf1;
            color: #115e59;
          }

          .template-modern .metric-card {
            background: linear-gradient(135deg, #ccfbf1, #ecfeff);
            border-color: #99f6e4;
          }

          .template-minimal .page {
            background: #f8fafc;
          }

          .template-minimal .resume-shell {
            border-radius: 0;
            box-shadow: none;
            border: 1px solid #e2e8f0;
          }

          .template-minimal .hero {
            background: #ffffff;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
          }

          .template-minimal .eyebrow,
          .template-minimal .hero h2,
          .template-minimal .contact-row {
            color: #475569;
          }

          .template-minimal .content {
            grid-template-columns: 1fr;
          }

          .template-minimal .side-column {
            border-left: 0;
            border-top: 1px solid #e2e8f0;
            background: #ffffff;
          }

          .template-minimal .metric-card {
            background: #f8fafc;
            border-color: #e2e8f0;
          }

          .template-executive .hero {
            background: linear-gradient(135deg, #111827 0%, #334155 100%);
          }

          .template-executive .content {
            grid-template-columns: 1fr;
          }

          .template-executive .side-column {
            border-left: 0;
            border-top: 1px solid #e2e8f0;
            background: #ffffff;
          }

          .template-executive .metric-card {
            background: linear-gradient(135deg, #e2e8f0, #f8fafc);
            border-color: #cbd5e1;
          }
        </style>
      </head>
      <body>
        <div class="page ${buildTemplateClass(normalized.template)}">
          <div class="resume-shell">
            <header class="hero">
              <p class="eyebrow">CareerForge Pro Resume</p>
              <h1>${escapeHtml(normalized.fullName)}</h1>
              <h2>${escapeHtml(normalized.title)}</h2>
              <div class="contact-row">${contactItems.map(escapeHtml).join(' • ')}</div>
            </header>

            <div class="content">
              <section class="main-column">
                <div class="section">
                  <p class="section-label">Professional Summary</p>
                  ${
                    normalized.summary
                      ? `<p class="summary">${escapeHtml(normalized.summary)}</p>`
                      : '<p class="empty-state">Add a summary to introduce your experience and direction.</p>'
                  }
                </div>
              </section>

              <aside class="side-column">
                <div class="section">
                  <p class="section-label">ATS Snapshot</p>
                  <div class="metric-card">
                    <p class="metric-label">Current Score</p>
                    <p class="metric-value">${escapeHtml(normalized.atsScore)}%</p>
                    <p class="metric-note">Generated from the current resume fields and template selection.</p>
                  </div>
                </div>

                <div class="section">
                  <p class="section-label">Core Skills</p>
                  ${buildSkillMarkup(normalized.skills, normalized.template)}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateResumePdfBuffer = async (resume) => {
  let browser;

  try {
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(buildResumeHtml(resume), { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' || /Cannot find module 'puppeteer'/.test(error.message)) {
      const dependencyError = new Error('Puppeteer is not installed on the server');
      dependencyError.statusCode = 503;
      throw dependencyError;
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  buildResumeHtml,
  generateResumePdfBuffer,
};
