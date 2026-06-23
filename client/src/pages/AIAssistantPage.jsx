import React from 'react';

function ChipRow({ title, items, className }) {
  return (
    <div className="ai-keywords ai-keywords--section">
      <div className="surface-card__header">
        <h3>{title}</h3>
      </div>
      <div className="chip-row">
        {Array.isArray(items) && items.length > 0 ? (
          items.map((item, index) => (
            <span key={`${title}-${index}`} className={className}>{item}</span>
          ))
        ) : (
          <span className="chip chip--empty">No clear tags found</span>
        )}
      </div>
    </div>
  );
}

export default function AIAssistantPage({ app }) {
  const tabs = [
    ['summary', 'Improve Summary'],
    ['ats', 'ATS Optimizer'],
    ['skills', 'Suggest Skills'],
    ['jd', 'JD Analyzer'],
    ['bullet', 'Bullet Rewriter'],
  ];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">AI Career Assistant</span>
          <h2>Optimize your resume against real job targets</h2>
          <p>Use focused tools to sharpen positioning, surface keywords, and improve outcomes.</p>
        </div>
      </header>

      <section className="surface-card ai-shell">
        <div className="ai-tabs" role="tablist">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={app.activeAiTab === value}
              className={app.activeAiTab === value ? 'ai-tab ai-tab--active' : 'ai-tab'}
              onClick={() => app.setActiveAiTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {app.activeAiTab === 'summary' && (
          <div className="ai-panel-body">
            <p className="ai-helper">Refine your summary so it sounds more targeted and recruiter-friendly.</p>
            <button type="button" className="primary-button" onClick={app.handleImproveSummary} disabled={app.ai.loading}>
              {app.ai.loading ? 'Improving...' : 'Improve Summary'}
            </button>
            {app.ai.loading ? (
              <div className="skeleton-card" style={{ marginTop: '1.5rem' }}>
                <div className="skeleton-title" style={{ width: '40%', marginBottom: '0.5rem' }} />
                <div className="skeleton-text" style={{ width: '95%' }} />
                <div className="skeleton-text" style={{ width: '90%' }} />
                <div className="skeleton-text skeleton-text--short" style={{ width: '60%' }} />
              </div>
            ) : app.ai.summaryResult && (
              <div className="ai-result-card">
                <div className="surface-card__header">
                  <h3>Improved Summary</h3>
                  <button type="button" className="ghost-button" onClick={app.handleApplyImprovedSummary}>
                    Apply to Resume
                  </button>
                </div>
                <p className="ai-improved-text">{app.ai.summaryResult.improvedSummary}</p>
                {app.ai.summaryResult.tips?.length > 0 && (
                  <ul className="insight-list">
                    {app.ai.summaryResult.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {app.activeAiTab === 'ats' && (
          <div className="ai-panel-body">
            <textarea
              className="ai-jd-textarea"
              rows={6}
              value={app.jobDescription}
              onChange={(event) => app.setJobDescription(event.target.value)}
              placeholder="Paste a job description to score your resume."
            />
            <button type="button" className="primary-button" onClick={app.handleAtsAnalysis}>
              Run ATS Analysis
            </button>
            {app.ai.loading ? (
              <div className="skeleton-card" style={{ marginTop: '1.5rem' }}>
                <div className="skeleton-title" style={{ width: '30%', marginBottom: '0.5rem' }} />
                <div className="skeleton-text" style={{ width: '90%' }} />
                <div className="skeleton-text skeleton-text--short" style={{ width: '45%' }} />
              </div>
            ) : app.ai.atsResult && (
              <div className="ai-result-card">
                <div className="metric-grid metric-grid--compact">
                  <article className="metric-surface">
                    <span>ATS Score</span>
                    <strong>{app.ai.atsResult.atsScore}%</strong>
                    <p>{app.ai.atsResult.overallFeedback}</p>
                  </article>
                  <article className="metric-surface">
                    <span>Keyword Match</span>
                    <strong>{app.ai.atsResult.breakdown?.keywordMatch ?? 0}%</strong>
                    <p>Most important weighting in this scoring model.</p>
                  </article>
                </div>
                {app.ai.atsResult.missingKeywords?.length > 0 && (
                  <ChipRow title="Missing Keywords" items={app.ai.atsResult.missingKeywords} className="chip chip--missing" />
                )}
                {app.ai.atsResult.suggestions?.length > 0 && (
                  <ul className="insight-list">
                    {app.ai.atsResult.suggestions.map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {app.activeAiTab === 'skills' && (
          <div className="ai-panel-body">
            <p className="ai-helper">Generate missing skill ideas based on your target role and current stack.</p>
            <button type="button" className="primary-button" onClick={app.handleSuggestSkills} disabled={app.ai.loading}>
              {app.ai.loading ? 'Thinking...' : 'Suggest Skills'}
            </button>
            {app.ai.loading ? (
              <div className="skeleton-card" style={{ marginTop: '1.5rem' }}>
                <div className="skeleton-title" style={{ width: '35%', marginBottom: '0.5rem' }} />
                <div className="skeleton-text" style={{ width: '85%' }} />
                <div className="skeleton-text" style={{ width: '70%' }} />
              </div>
            ) : app.ai.skillsResult && (
              <div className="ai-result-card">
                {app.ai.skillsResult.reason && <p className="ai-helper">{app.ai.skillsResult.reason}</p>}
                <div className="skill-suggestions">
                  {app.ai.skillsResult.suggestedSkills?.map((item) => (
                    <div key={item.skill} className="skill-suggestion-item">
                      <button type="button" className="chip chip--add" onClick={() => app.handleAddSuggestedSkill(item.skill)}>
                        + {item.skill}
                      </button>
                      <span className="skill-why">{item.why}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {app.activeAiTab === 'jd' && (
          <div className="ai-panel-body">
            <textarea
              className="ai-jd-textarea"
              rows={6}
              value={app.jobDescription}
              onChange={(event) => app.setJobDescription(event.target.value)}
              placeholder="Paste a job description to extract recruiter keywords."
            />
            <button type="button" className="primary-button" onClick={app.handleAnalyzeJD} disabled={app.ai.loading}>
              {app.ai.loading ? 'Analyzing...' : 'Analyze Job Description'}
            </button>
            {app.ai.loading ? (
              <div className="skeleton-card" style={{ marginTop: '1.5rem' }}>
                <div className="skeleton-title" style={{ width: '45%', marginBottom: '0.5rem' }} />
                <div className="skeleton-text" style={{ width: '90%' }} />
                <div className="skeleton-text skeleton-text--short" style={{ width: '50%' }} />
              </div>
            ) : app.ai.jdResult && (
              <div className="ai-result-card">
                <ChipRow title="Hard Skills" items={app.ai.jdResult.hardSkills} className="chip chip--hard" />
                <ChipRow title="Soft Skills" items={app.ai.jdResult.softSkills} className="chip chip--soft" />
                <ChipRow title="Action Verbs" items={app.ai.jdResult.actionVerbs} className="chip chip--verb" />
                <ChipRow title="Domain" items={app.ai.jdResult.domain} className="chip chip--domain" />
                <ChipRow title="Seniority Level" items={app.ai.jdResult.seniorityLevel} className="chip chip--level" />
              </div>
            )}
          </div>
        )}

        {app.activeAiTab === 'bullet' && (
          <div className="ai-panel-body">
            <textarea
              className="ai-jd-textarea"
              rows={3}
              value={app.originalBullet}
              onChange={(event) => app.setOriginalBullet(event.target.value)}
              placeholder="Original bullet point"
            />
            <input
              type="text"
              value={app.targetKeywords}
              onChange={(event) => app.setTargetKeywords(event.target.value)}
              placeholder="Target keywords (comma separated)"
            />
            <textarea
              className="ai-jd-textarea"
              rows={5}
              value={app.jobDescription}
              onChange={(event) => app.setJobDescription(event.target.value)}
              placeholder="Optional job description context"
            />
            <button type="button" className="primary-button" onClick={app.handleRewriteBullet} disabled={app.ai.loading}>
              {app.ai.loading ? 'Rewriting...' : 'Rewrite Bullet'}
            </button>
            {app.ai.loading ? (
              <div className="skeleton-card" style={{ marginTop: '1.5rem' }}>
                <div className="skeleton-title" style={{ width: '40%', marginBottom: '0.5rem' }} />
                <div className="skeleton-text" style={{ width: '95%' }} />
                <div className="skeleton-text" style={{ width: '80%' }} />
              </div>
            ) : app.ai.bulletResult && (
              <div className="ai-result-card">
                <p className="ai-improved-text">{app.ai.bulletResult.rewrittenBullet}</p>
                {app.ai.bulletResult.keywordsUsed?.length > 0 && (
                  <ChipRow title="Keywords Used" items={app.ai.bulletResult.keywordsUsed} className="chip chip--hard" />
                )}
                {app.ai.bulletResult.improvementNotes?.length > 0 && (
                  <ul className="insight-list">
                    {app.ai.bulletResult.improvementNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {app.ai.error && <div className="ai-error">{app.ai.error}</div>}
      </section>
    </div>
  );
}
