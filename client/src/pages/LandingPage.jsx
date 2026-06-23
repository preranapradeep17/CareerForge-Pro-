import React from 'react';
import { NavLink } from 'react-router-dom';

const landingFeatures = [
  {
    title: 'ATS Analysis',
    copy: 'See keyword match, formatting quality, and completion score before you apply.',
  },
  {
    title: 'JD Analyzer',
    copy: 'Extract hard skills, action verbs, and domain terms directly from a job description.',
  },
  {
    title: 'Resume Builder',
    copy: 'Write, preview, autosave, and export a polished A4 resume from one focused workspace.',
  },
  {
    title: 'Cover Letter Generator',
    copy: 'Turn resume signals and a target role into a tailored first-draft cover letter fast.',
  },
];

const pricingTiers = [
  { name: 'Starter', price: 'Free', detail: 'One resume, ATS scoring, and AI suggestions.' },
  { name: 'Pro', price: '$12/mo', detail: 'Multiple resumes, PDF export, cover letters, and AI tools.' },
  { name: 'Career+', price: '$24/mo', detail: 'Advanced templates, premium coaching insights, and analytics.' },
];

const testimonials = [
  {
    quote: 'CareerForge Pro helped me tighten my resume and explain my impact more clearly.',
    name: 'Aanya S.',
    role: 'Frontend Developer',
  },
  {
    quote: 'The ATS checks and JD analysis made each application feel much more intentional.',
    name: 'Rahul K.',
    role: 'Product Analyst',
  },
];

const TEMPLATE_OPTIONS = ['classic', 'modern', 'minimal'];

export default function LandingPage({ isLoggedIn }) {
  return (
    <main className="marketing-shell">
      <header className="marketing-nav">
        <div className="brand-lockup brand-lockup--marketing">
          <div className="brand-mark">CF</div>
          <div>
            <h1>CareerForge Pro</h1>
            <p>Build ATS-friendly resumes with AI</p>
          </div>
        </div>

        <nav className="marketing-nav__links">
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <a href="#pricing">Pricing</a>
          <NavLink to="/login">Login</NavLink>
          <NavLink to={isLoggedIn ? '/dashboard' : '/register'} className="primary-link">
            {isLoggedIn ? 'Go to App' : 'Sign Up'}
          </NavLink>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">CareerForge Pro</span>
          <h2>Build ATS-Friendly Resumes with AI</h2>
          <p>
            Create polished resumes, match them to job descriptions, improve bullet points,
            and export recruiter-ready PDFs from one focused platform.
          </p>
          <div className="hero-actions">
            <NavLink to={isLoggedIn ? '/dashboard' : '/register'} className="primary-button">
              Get Started
            </NavLink>
            <a href="#features" className="secondary-button">Watch Demo</a>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="stat-card">
            <span>ATS Score</span>
            <strong>82%</strong>
          </div>
          <div className="stat-card">
            <span>Keyword Match</span>
            <strong>76%</strong>
          </div>
          <div className="stat-card">
            <span>PDF Ready</span>
            <strong>A4 Export</strong>
          </div>
        </div>
      </section>

      <section id="features" className="marketing-section">
        <div className="section-heading">
          <span className="eyebrow">Features</span>
          <h3>Everything you need to go from draft to application-ready.</h3>
        </div>
        <div className="feature-grid">
          {landingFeatures.map((feature) => (
            <article key={feature.title} className="feature-card">
              <h4>{feature.title}</h4>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="templates" className="marketing-section">
        <div className="section-heading">
          <span className="eyebrow">Templates</span>
          <h3>Classic, modern, executive, and minimal layouts.</h3>
        </div>
        <div className="template-showcase">
          {TEMPLATE_OPTIONS.map((template) => (
            <div key={template} className={`template-card template-card--${template}`}>
              <span>{template}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="marketing-section">
        <div className="section-heading">
          <span className="eyebrow">Pricing</span>
          <h3>Start free, then scale your job search toolkit.</h3>
        </div>
        <div className="pricing-grid">
          {pricingTiers.map((tier) => (
            <article key={tier.name} className="pricing-card">
              <h4>{tier.name}</h4>
              <strong>{tier.price}</strong>
              <p>{tier.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <span className="eyebrow">Testimonials</span>
          <h3>Job seekers use CareerForge Pro to sound sharper and apply smarter.</h3>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <article key={item.name} className="testimonial-card">
              <p>"{item.quote}"</p>
              <strong>{item.name}</strong>
              <span>{item.role}</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="marketing-footer">
        <p>CareerForge Pro helps candidates present their best work with confidence.</p>
      </footer>
    </main>
  );
}
