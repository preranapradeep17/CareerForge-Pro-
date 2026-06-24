import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumePreview from '../components/ResumePreview';
import AtsGauge, { AtsBadge } from '../components/AtsGauge';

const calculateCompleteness = (resume) => {
  if (!resume) return 0;
  const personalInfo = resume.personalInfo || {};
  
  let hasSkills = false;
  if (Array.isArray(resume.skills)) {
    hasSkills = resume.skills.length > 0;
  } else if (typeof resume.skills === 'string') {
    hasSkills = resume.skills.trim().length > 0;
  }

  return [
    personalInfo.fullName ? 15 : 0,
    resume.targetJD || personalInfo.title ? 15 : 0,
    personalInfo.summary ? 20 : 0,
    hasSkills ? 15 : 0,
    resume.experience && resume.experience.length > 0 ? 15 : 0,
    resume.education && resume.education.length > 0 ? 10 : 0,
    resume.projects && resume.projects.length > 0 ? 10 : 0,
  ].reduce((a, b) => a + b, 0);
};

function AtsComparisonChart({ resumes }) {
  if (!resumes || resumes.length === 0) return null;

  const data = [...resumes].slice(0, 5); // top 5 resumes
  const maxScore = 100;
  const chartHeight = 160;
  const barWidth = 36;
  const gap = 20;
  const paddingLeft = 35;
  const paddingBottom = 24;

  const width = data.length * (barWidth + gap) + paddingLeft + 10;

  return (
    <article className="surface-card" style={{ padding: '1.4rem' }}>
      <div className="surface-card__header" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.6rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>ATS Score Comparison</h3>
      </div>
      <div className="chart-container" style={{ width: '100%', overflowX: 'auto', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 0.5rem', borderRadius: '18px' }}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${Math.max(width, 240)} ${chartHeight}`} style={{ overflow: 'visible', margin: '0 auto' }}>
          {/* Y Guidelines */}
          <line x1={paddingLeft} y1={0} x2={Math.max(width, 240)} y2={0} stroke="rgba(255, 255, 255, 0.05)" />
          <line x1={paddingLeft} y1={(chartHeight - paddingBottom) * 0.5} x2={Math.max(width, 240)} y2={(chartHeight - paddingBottom) * 0.5} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4" />
          <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={Math.max(width, 240)} y2={chartHeight - paddingBottom} stroke="var(--line)" />
          <line x1={paddingLeft} y1={0} x2={paddingLeft} y2={chartHeight - paddingBottom} stroke="var(--line)" />

          {/* Y scale labels */}
          <text x={paddingLeft - 8} y={4} textAnchor="end" fill="var(--muted)" fontSize="8">100%</text>
          <text x={paddingLeft - 8} y={(chartHeight - paddingBottom) * 0.5 + 3} textAnchor="end" fill="var(--muted)" fontSize="8">50%</text>
          <text x={paddingLeft - 8} y={chartHeight - paddingBottom} textAnchor="end" fill="var(--muted)" fontSize="8">0%</text>

          {data.map((resume, index) => {
            const score = resume.atsScore || 0;
            const barHeight = ((chartHeight - paddingBottom) * score) / maxScore;
            const x = paddingLeft + gap + index * (barWidth + gap);
            const y = chartHeight - paddingBottom - barHeight;

            // Color gradient logic based on score
            const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#fb7185';

            return (
              <g key={resume._id}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  opacity="0.85"
                  rx="6"
                  style={{ transition: 'height 0.5s ease-in-out, y 0.5s ease-in-out' }}
                />
                {/* Score text */}
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  {score}%
                </text>
                {/* Name label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="9"
                  style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: barWidth }}
                >
                  {(resume.name || 'Untitled').length > 8 ? `${(resume.name || 'Untitled').slice(0, 6)}..` : (resume.name || 'Untitled')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </article>
  );
}

export default function DashboardPage({ app }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const resumesList = Array.isArray(app.resumes) ? app.resumes : [];

  const bestScore = resumesList.length > 0
    ? Math.max(...resumesList.map((r) => r.atsScore || 0))
    : 0;

  const avgCompleteness = resumesList.length > 0
    ? Math.round(resumesList.reduce((acc, r) => acc + calculateCompleteness(r), 0) / resumesList.length)
    : 0;

  const activeResume = resumesList[0];
  let atsTrendText = '—';
  let atsTrendNote = 'Create snapshots to see relative trend';
  if (activeResume) {
    const current = activeResume.atsScore || 0;
    const previous = activeResume.lastAtsScore;
    if (previous !== null && previous !== undefined) {
      const diff = current - previous;
      if (diff > 0) {
        atsTrendText = `+${diff}% 📈`;
        atsTrendNote = `Up from previous version (${previous}%)`;
      } else if (diff < 0) {
        atsTrendText = `${diff}% 📉`;
        atsTrendNote = `Down from previous version (${previous}%)`;
      } else {
        atsTrendText = `0% ➖`;
        atsTrendNote = `Matches previous version (${previous}%)`;
      }
    }
  }

  const metricCards = [
    { label: 'Best ATS Score', value: `${bestScore}%`, note: 'Highest profile score' },
    { label: 'Avg Completeness', value: `${avgCompleteness}%`, note: 'Overall resume progress' },
    { label: 'ATS Trend', value: atsTrendText, note: atsTrendNote },
    { label: 'Resumes Created', value: `${resumesList.length}`, note: 'Saved in your workspace' },
    { label: 'Templates Used', value: '3', note: 'Classic, Modern, Minimal' },
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

      <section className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '2rem' }}>
        {metricCards.map((card) => (
          <article key={card.label} className="metric-surface">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <div className="section-divider" style={{ borderTop: '1px solid var(--line)', margin: '2rem 0' }} />

      <div className="dashboard-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        {/* Left Side: My Resumes */}
        <section className="dashboard-resumes-section">
          <div className="surface-card__header" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch' }}>
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
          ) : resumesList.length === 0 ? (
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
            const filteredResumes = resumesList.filter((resume) => {
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
              <div className="dashboard-resume-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
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

                        <div className="resume-card__metadata" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--muted)', margin: '0.5rem 0' }}>
                          <span>🎨 {resume.template.toUpperCase()}</span>
                          <span>📅 {formattedDate}</span>
                        </div>

                        {/* Actions Grid */}
                        <div className="resume-card__actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '1rem' }}>
                          <button
                            type="button"
                            className="primary-button"
                            style={{ padding: '0.45rem 0.2rem', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: 0 }}
                            onClick={() => navigate(`/resume/${resume._id}`)}
                            title="Edit Resume"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '0.45rem 0.2rem', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: 0 }}
                            onClick={() => app.handleExportPdfDirectly(resume)}
                            title="Download PDF"
                          >
                            <span>⬇️</span>
                            <span>Download</span>
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '0.45rem 0.2rem', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: 0 }}
                            onClick={() => {
                              const newName = prompt('Enter a new name for this resume:', resume.name);
                              if (newName && newName.trim() && newName.trim() !== resume.name) {
                                app.handleRenameResume(resume._id, newName.trim());
                              }
                            }}
                            title="Rename Resume"
                          >
                            <span>✍️</span>
                            <span>Rename</span>
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '0.45rem 0.2rem', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: 0 }}
                            onClick={() => app.handleDuplicateResume(resume._id)}
                            title="Duplicate Resume"
                          >
                            <span>👯</span>
                            <span>Duplicate</span>
                          </button>
                          <button
                            type="button"
                            className={resume.isShared ? "primary-button" : "secondary-button"}
                            style={{ padding: '0.45rem 0.2rem', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: 0 }}
                            onClick={() => app.handleShareResume(resume)}
                            title={resume.isShared ? "Copy Share Link / Disable Share" : "Enable Share Link"}
                          >
                            <span>🔗</span>
                            <span>{resume.isShared ? 'Shared' : 'Share'}</span>
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            style={{ padding: '0.45rem 0.2rem', fontSize: '0.74rem', borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: 0 }}
                            onClick={() => app.handleDeleteResume(resume._id)}
                            title="Delete Resume"
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
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

        {/* Right Side: Charts, Recent Activity & AI Tips */}
        <section className="dashboard-sidebar-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Custom SVG Score comparison Chart */}
          <AtsComparisonChart resumes={resumesList} />

          <article className="surface-card">
            <div className="surface-card__header" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.6rem', marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Recent Activity</h3>
            </div>
            <ul className="insight-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {(() => {
                if (resumesList.length === 0) {
                  return <li>Create your first resume to track activity</li>;
                }

                const activities = resumesList.flatMap((resume) => {
                  const formattedDate = new Date(resume.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  
                  const list = [];
                  const createdDate = new Date(resume.createdAt).getTime();
                  const updatedDate = new Date(resume.updatedAt).getTime();
                  const isJustCreated = Math.abs(updatedDate - createdDate) < 5000;
                  const resName = resume.name || 'Untitled';

                  if (isJustCreated) {
                    list.push({
                      id: `create-${resume._id}`,
                      text: `➕ "${resName}" created on ${formattedDate}`,
                      time: createdDate,
                    });
                  } else {
                    list.push({
                      id: `update-${resume._id}`,
                      text: `✏️ "${resName}" updated on ${formattedDate}`,
                      time: updatedDate,
                    });
                  }

                  list.push({
                    id: `template-${resume._id}`,
                    text: `🎨 Set template: ${resume.template.toUpperCase()} for "${resName}"`,
                    time: updatedDate - 1000,
                  });

                  if (resume.atsScore > 0) {
                    list.push({
                      id: `ats-${resume._id}`,
                      text: `🎯 "${resName}" scored ${resume.atsScore}% ATS Match`,
                      time: updatedDate - 500,
                    });
                  }

                  return list;
                });

                const sorted = activities
                  .sort((a, b) => b.time - a.time)
                  .slice(0, 6);

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
