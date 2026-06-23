import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumePreview from '../components/ResumePreview';
import AtsGauge, { AtsBadge } from '../components/AtsGauge';

export default function DashboardPage({ app }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const bestScore = app.resumes.length > 0
    ? Math.max(...app.resumes.map((r) => r.atsScore || 0))
    : 0;

  const metricCards = [
    { label: 'Best ATS Score', value: `${bestScore}%`, note: 'Highest profile score' },
    { label: 'Resumes Created', value: `${app.resumes.length}`, note: 'Saved in your workspace' },
    { label: 'Templates Used', value: '3', note: 'Available template designs' },
    { label: 'Workspace Plan', value: app.user?.plan === 'pro' ? '✦ Pro' : 'Free', note: 'Current account tier' },
  ];

  return (
    <div className="page-shell">
      <header className="page-header" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <span className="eyebrow">Dashboard</span>
          <h2>Welcome back, {app.user?.name || 'User'} 👋</h2>
          <p>Track your resume performance, AI signals, and active designs from one place.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="primary-button"
            onClick={app.handleCreateNewResume}
          >
            + New Resume
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => app.fetchProfile()}
          >
            Refresh Profile
          </button>
        </div>
      </header>

      <section className="metric-grid" style={{ marginBottom: '2rem' }}>
        {metricCards.map((card) => (
          <article key={card.label} className="metric-surface">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <div className="section-divider" style={{ borderTop: '1px solid var(--line)', margin: '2rem 0' }} />

      <div className="dashboard-grid-layout">
        {/* Left Side: My Resumes */}
        <section className="dashboard-resumes-section">
          <div className="surface-card__header" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>My Resumes</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search resumes by label, candidate name, or template..."
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                background: 'rgba(7, 14, 28, 0.38)',
                color: 'var(--text)',
                fontSize: '0.88rem',
              }}
            />
          </div>

          {app.loadingResumes ? (
            <div className="dashboard-resume-grid">
              {[1, 2, 3].map((n) => (
                <article key={n} className="skeleton-card">
                  <div className="skeleton-thumbnail" />
                  <div className="skeleton-body">
                    <div className="skeleton-title" style={{ width: '75%', marginBottom: '0.5rem' }} />
                    <div className="skeleton-text" style={{ width: '90%' }} />
                    <div className="skeleton-text skeleton-text--short" style={{ width: '50%' }} />
                  </div>
                </article>
              ))}
            </div>
          ) : app.resumes.length === 0 ? (
            <div className="surface-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <p className="ai-helper" style={{ fontSize: '1.1rem', marginBottom: '1.2rem' }}>
                You haven't created any resumes yet. Click "+ New Resume" to begin.
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={app.handleCreateNewResume}
              >
                Create Your First Resume
              </button>
            </div>
          ) : (() => {
            const filteredResumes = app.resumes.filter((resume) => {
              const name = (resume.name || '').toLowerCase();
              const fullName = (resume.personalInfo?.fullName || '').toLowerCase();
              const title = (resume.targetJD || '').toLowerCase();
              const template = (resume.template || '').toLowerCase();
              const query = searchQuery.toLowerCase();
              return name.includes(query) || fullName.includes(query) || title.includes(query) || template.includes(query);
            });

            if (filteredResumes.length === 0) {
              return (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  No resumes match your search query.
                </div>
              );
            }

            return (
              <div className="dashboard-resume-grid">
                {filteredResumes.map((resume) => {
                  const formattedDate = new Date(resume.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <article key={resume._id} className="resume-card">
                      {/* Live scaled-down template preview thumbnail */}
                      <div className="resume-card__thumbnail">
                        <div className="resume-card__thumbnail-scale">
                          <ResumePreview
                            resumeData={{
                              name: resume.name,
                              fullName: resume.personalInfo?.fullName || 'Untitled',
                              title: resume.targetJD || 'General Role',
                              summary: resume.personalInfo?.summary || '',
                              skills: Array.isArray(resume.skills) ? resume.skills.join(', ') : '',
                            }}
                            experience={resume.experience}
                            education={resume.education}
                            projects={resume.projects}
                            template={resume.template}
                            atsScore={resume.atsScore}
                          />
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className="resume-card__body">
                        <div className="resume-card__title-row">
                          <h4 className="resume-card__title">
                            {resume.name || resume.personalInfo?.fullName || 'Untitled Resume'}
                          </h4>
                          <AtsBadge score={resume.atsScore} />
                        </div>

                        <p className="resume-card__role">
                          Target Role: <strong>{resume.targetJD || 'General Role'}</strong>
                        </p>

                        <div className="resume-card__metadata">
                          <span>🎨 {resume.template.toUpperCase()}</span>
                          <span>📅 {formattedDate}</span>
                        </div>

                        {/* Actions */}
                        <div className="resume-card__actions">
                          <button
                            type="button"
                            className="primary-button"
                            style={{ padding: '0.5rem', fontSize: '0.82rem', flex: 1 }}
                            onClick={() => navigate(`/resume/${resume._id}`)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '0.5rem', fontSize: '0.82rem', flex: 1 }}
                            onClick={() => app.handleExportPdfDirectly(resume)}
                          >
                            ⬇️ Download
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            style={{ padding: '0.5rem', fontSize: '0.82rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            onClick={() => app.handleDeleteResume(resume._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            );
          })()}
        </section>

        {/* Right Side: Recent Activity & AI Tips */}
        <section className="dashboard-sidebar-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <article className="surface-card">
            <div className="surface-card__header" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.6rem', marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Recent Activity</h3>
            </div>
            <ul className="insight-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {(() => {
                if (!app.resumes || app.resumes.length === 0) {
                  return <li>Create your first resume to track activity</li>;
                }

                const activities = app.resumes.flatMap((resume) => {
                  const formattedDate = new Date(resume.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  
                  const list = [];
                  list.push({
                    id: `update-${resume._id}`,
                    text: `✓ "${resume.name || resume.personalInfo?.fullName || 'Untitled'}" updated on ${formattedDate}`,
                    time: new Date(resume.updatedAt).getTime(),
                  });

                  if (resume.atsScore > 0) {
                    list.push({
                      id: `ats-${resume._id}`,
                      text: `🎯 "${resume.name || resume.personalInfo?.fullName || 'Untitled'}" scored ${resume.atsScore}% ATS Match`,
                      time: new Date(resume.updatedAt).getTime() - 1000,
                    });
                  }

                  return list;
                });

                const sorted = activities
                  .sort((a, b) => b.time - a.time)
                  .slice(0, 5);

                return sorted.map((act) => (
                  <li key={act.id}>{act.text}</li>
                ));
              })()}
            </ul>
          </article>

          <article className="surface-card">
            <div className="surface-card__header" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.6rem', marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>AI Optimization Tips</h3>
            </div>
            <ul className="insight-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>Use **JD Analyzer** to pull recruiter keywords directly from target descriptions.</li>
              <li>Apply suggested skills in builder to improve ATS alignment.</li>
            </ul>
          </article>
        </section>
      </div>

      {app.user?.plan !== 'pro' && (
        <section style={{ marginTop: '3rem' }}>
          <article className="upgrade-cta-card">
            <h3 className="upgrade-cta-card__title">✦ Unlock CareerForge Pro</h3>
            <p className="upgrade-cta-card__body">
              You're on the free Starter plan. Upgrade to Pro to unlock PDF exports, unlimited resumes, cover letter generation, and full AI optimization tools.
            </p>
            <ul className="upgrade-cta-card__features">
              <li className="upgrade-cta-card__feature">✓ Unlimited Resumes</li>
              <li className="upgrade-cta-card__feature">✓ A4 PDF Export</li>
              <li className="upgrade-cta-card__feature">✓ Cover Letter AI</li>
              <li className="upgrade-cta-card__feature">✓ JD Analyzer</li>
              <li className="upgrade-cta-card__feature">✓ Bullet Rewriter</li>
            </ul>
            <div>
              <button
                type="button"
                className="primary-button"
                onClick={app.handleUpgrade}
                disabled={app.loading}
                id="dashboard-upgrade-btn"
              >
                {app.loading ? 'Opening Stripe...' : 'Upgrade to Pro — $12/mo'}
              </button>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
