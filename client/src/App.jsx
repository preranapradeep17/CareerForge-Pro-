import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import {
  TOKEN_KEY,
  clearCredentials,
  setCredentials,
  setUser,
} from './store/authSlice';
import {
  setTemplate,
  updateResumeField,
  setAiLoading,
  setAiError,
  setSummaryResult,
  setAtsResult,
  setSkillsResult,
  setJdResult,
} from './store/resumeSlice';

const API_BASE = 'http://localhost:5000/api';
const AUTO_SAVE_DELAY_MS = 1500;

const initialRegister = { name: '', email: '', password: '' };
const initialLogin = { email: '', password: '' };

// ─── AI fetch helper ────────────────────────────────────────────────────────
const aiPost = async (endpoint, body, token) => {
  const response = await fetch(`${API_BASE}/ai/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'AI request failed');
  return data;
};

function App() {
  const dispatch = useDispatch();
  const { user, token, isLoggedIn } = useSelector((state) => state.auth);
  const { resumeData, atsScore, template, ai } = useSelector((state) => state.resume);

  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [resumeId, setResumeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState('');

  // AI panel state
  const [jobDescription, setJobDescription] = useState('');
  const [activeAiTab, setActiveAiTab] = useState('summary'); // 'summary' | 'ats' | 'skills' | 'jd'

  const hasResumeContent = useMemo(
    () => Object.values(resumeData).some((value) => value.trim().length > 0),
    [resumeData]
  );

  useEffect(() => {
    if (!token) return;
    fetchProfile(token);
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn || !token || !hasResumeContent) return;
    const timeoutId = setTimeout(() => { saveResume(); }, AUTO_SAVE_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [resumeData, template, atsScore, isLoggedIn, token, hasResumeContent]);

  const mapResumePayload = () => ({
    personalInfo: {
      fullName: resumeData.fullName,
      summary: resumeData.summary,
      email: '',
      phone: '',
      location: '',
    },
    experience: [],
    education: [],
    skills: resumeData.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
    projects: [],
    atsScore,
    template,
    targetJD: resumeData.title,
  });

  const saveResume = async () => {
    const payload = mapResumePayload();
    setIsSaving(true);
    setSaveError('');
    try {
      const endpoint = resumeId ? `${API_BASE}/resumes/${resumeId}` : `${API_BASE}/resumes`;
      const method = resumeId ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to auto-save resume');
      if (!resumeId && data.resume?._id) setResumeId(data.resume._id);
      setLastSavedAt(new Date());
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Registering...');
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      localStorage.setItem(TOKEN_KEY, data.token);
      dispatch(setCredentials({ token: data.token, user: data.user }));
      setRegisterForm(initialRegister);
      setMessage('Registration successful. You are now logged in.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Logging in...');
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem(TOKEN_KEY, data.token);
      dispatch(setCredentials({ token: data.token, user: data.user }));
      setLoginForm(initialLogin);
      setMessage('Login successful. Token stored in localStorage.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (activeToken = token) => {
    setLoading(true);
    setMessage('Checking protected route...');
    try {
      const response = await fetch(`${API_BASE}/protected/me`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load profile');
      dispatch(setUser(data.user));
      setMessage('Protected route is accessible.');
    } catch (error) {
      setMessage(error.message);
      if (error.message.toLowerCase().includes('unauthorized')) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    dispatch(clearCredentials());
    setResumeId(null);
    setLastSavedAt(null);
    setSaveError('');
    setMessage('Logged out and token cleared.');
  };

  const handleResumeChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateResumeField({ field: name, value }));
  };

  // ─── AI Handlers ───────────────────────────────────────────────────────────
  const handleImproveSummary = async () => {
    if (!resumeData.summary.trim()) return setMessage('Add a summary first.');
    if (!resumeData.title.trim()) return setMessage('Add your target job title first.');
    dispatch(setAiLoading(true));
    try {
      const result = await aiPost('improve-summary', {
        summary: resumeData.summary,
        jobTitle: resumeData.title,
      }, token);
      dispatch(setSummaryResult(result));
    } catch (err) {
      dispatch(setAiError(err.message));
    }
  };

  const handleAtsAnalysis = async () => {
    if (!jobDescription.trim()) return setMessage('Paste a job description first.');
    dispatch(setAiLoading(true));
    try {
      const result = await aiPost('ats-analysis', {
        resumeData,
        jobDescription,
      }, token);
      dispatch(setAtsResult(result));
    } catch (err) {
      dispatch(setAiError(err.message));
    }
  };

  const handleSuggestSkills = async () => {
    if (!resumeData.title.trim()) return setMessage('Add your target job title first.');
    dispatch(setAiLoading(true));
    try {
      const skillsArray = resumeData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await aiPost('suggest-skills', {
        currentSkills: skillsArray,
        jobTitle: resumeData.title,
      }, token);
      dispatch(setSkillsResult(result));
    } catch (err) {
      dispatch(setAiError(err.message));
    }
  };

  const handleAnalyzeJD = async () => {
    if (!jobDescription.trim()) return setMessage('Paste a job description first.');
    dispatch(setAiLoading(true));
    try {
      const result = await aiPost('analyze-jd', { jobDescription }, token);
      dispatch(setJdResult(result));
    } catch (err) {
      dispatch(setAiError(err.message));
    }
  };

  // Apply an AI-suggested skill to the skills field
  const handleAddSuggestedSkill = (skill) => {
    const current = resumeData.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!current.includes(skill)) {
      const updated = [...current, skill].join(', ');
      dispatch(updateResumeField({ field: 'skills', value: updated }));
    }
  };

  // Apply AI-improved summary
  const handleApplyImprovedSummary = () => {
    if (ai.summaryResult?.improvedSummary) {
      dispatch(updateResumeField({ field: 'summary', value: ai.summaryResult.improvedSummary }));
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="header-badge">DAY 7</div>
        <h1>Gemini AI Integration</h1>
        <p>ATS Analysis + JD Keyword Extraction · Gemini 1.5 Flash · Structured JSON responses</p>
      </header>

      {/* Auth Grid */}
      <section className="grid">
        <form className="card" onSubmit={handleRegister}>
          <h2>Register</h2>
          <input type="text" name="name" placeholder="Name" value={registerForm.name}
            onChange={handleRegisterChange} required />
          <input type="email" name="email" placeholder="Email" value={registerForm.email}
            onChange={handleRegisterChange} required />
          <input type="password" name="password" placeholder="Password" value={registerForm.password}
            onChange={handleRegisterChange} required minLength={6} />
          <button type="submit" disabled={loading}>Create account</button>
        </form>

        <form className="card" onSubmit={handleLogin}>
          <h2>Login</h2>
          <input type="email" name="email" placeholder="Email" value={loginForm.email}
            onChange={handleLoginChange} required />
          <input type="password" name="password" placeholder="Password" value={loginForm.password}
            onChange={handleLoginChange} required />
          <button type="submit" disabled={loading}>Login</button>
        </form>
      </section>

      {/* Session Status */}
      <section className="card status">
        <h2>Session</h2>
        <p><strong>Authenticated:</strong> {isLoggedIn ? 'Yes' : 'No'}</p>
        <p><strong>Token in localStorage:</strong> {isLoggedIn ? 'Stored' : 'Not found'}</p>
        {user && (
          <div className="user-block">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Plan:</strong> {user.plan}</p>
            <p><strong>Resume Count:</strong> {user.resumeCount}</p>
          </div>
        )}
        <div className="actions">
          <button type="button" onClick={() => fetchProfile()} disabled={!isLoggedIn || loading}>
            Test Protected Route
          </button>
          <button type="button" onClick={handleLogout} disabled={!isLoggedIn || loading}>
            Logout
          </button>
        </div>
      </section>

      {/* Split Editor */}
      <section className="split-editor">
        <form className="card editor-pane">
          <h2>Resume Builder Form</h2>
          <input type="text" name="fullName" placeholder="Full Name"
            value={resumeData.fullName} onChange={handleResumeChange} />
          <input type="text" name="title" placeholder="Target Job Title"
            value={resumeData.title} onChange={handleResumeChange} />
          <textarea name="summary" placeholder="Professional Summary"
            value={resumeData.summary} onChange={handleResumeChange} rows={5} />
          <input type="text" name="skills" placeholder="Skills (comma separated)"
            value={resumeData.skills} onChange={handleResumeChange} />
          <label htmlFor="template">Template</label>
          <select id="template" value={template}
            onChange={(e) => dispatch(setTemplate(e.target.value))}>
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="minimal">Minimal</option>
          </select>
          <p className="autosave-state">
            {isLoggedIn
              ? isSaving
                ? 'Auto-saving...'
                : saveError
                  ? `Auto-save failed: ${saveError}`
                  : lastSavedAt
                    ? `Saved at ${lastSavedAt.toLocaleTimeString()}`
                    : 'Start typing to auto-save'
              : 'Login to enable auto-save'}
          </p>
        </form>

        <article className="card preview-pane">
          <h2>Live Preview</h2>
          <p><strong>Name:</strong> {resumeData.fullName || 'Your name'}</p>
          <p><strong>Title:</strong> {resumeData.title || 'Your title'}</p>
          <p><strong>Summary:</strong> {resumeData.summary || 'Your summary appears here'}</p>
          <p><strong>Skills:</strong> {resumeData.skills || 'Your skills appear here'}</p>
          <p><strong>Template:</strong> {template}</p>
          <p><strong>ATS Score:</strong> {atsScore}%</p>
        </article>
      </section>

      {/* ── AI ASSISTANT PANEL ─────────────────────────────────────────────── */}
      <section className="ai-panel">
        <div className="ai-panel-header">
          <span className="ai-badge">✦ Gemini 1.5 Flash</span>
          <h2>AI Resume Assistant</h2>
          <p className="ai-subtitle">Powered by Google Gemini · Centralized Prompt Templates</p>
        </div>

        {!isLoggedIn ? (
          <div className="ai-locked">
            <span className="lock-icon">🔒</span>
            <p>Login to unlock AI-powered resume features</p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="ai-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeAiTab === 'summary'}
                className={`ai-tab ${activeAiTab === 'summary' ? 'ai-tab--active' : ''}`}
                onClick={() => setActiveAiTab('summary')}
              >
                ✍️ Improve Summary
              </button>
              <button
                role="tab"
                aria-selected={activeAiTab === 'ats'}
                className={`ai-tab ${activeAiTab === 'ats' ? 'ai-tab--active' : ''}`}
                onClick={() => setActiveAiTab('ats')}
              >
                📊 ATS Analysis
              </button>
              <button
                role="tab"
                aria-selected={activeAiTab === 'skills'}
                className={`ai-tab ${activeAiTab === 'skills' ? 'ai-tab--active' : ''}`}
                onClick={() => setActiveAiTab('skills')}
              >
                💡 Suggest Skills
              </button>
              <button
                role="tab"
                aria-selected={activeAiTab === 'jd'}
                className={`ai-tab ${activeAiTab === 'jd' ? 'ai-tab--active' : ''}`}
                onClick={() => setActiveAiTab('jd')}
              >
                🧠 JD Analyzer
              </button>
            </div>

            {/* ─── Tab: Improve Summary ─────────────────────────────── */}
            {activeAiTab === 'summary' && (
              <div className="ai-tab-content" role="tabpanel">
                <p className="ai-helper">
                  Gemini will rewrite your summary to be compelling and tailored to your target role.
                </p>
                <button
                  id="btn-improve-summary"
                  className="ai-action-btn"
                  onClick={handleImproveSummary}
                  disabled={ai.loading}
                >
                  {ai.loading ? <span className="spinner" /> : '✦'} Improve My Summary
                </button>

                {ai.summaryResult && (
                  <div className="ai-result-card">
                    <div className="ai-result-label">✦ Improved Summary</div>
                    <p className="ai-improved-text">{ai.summaryResult.improvedSummary}</p>
                    <button
                      id="btn-apply-summary"
                      className="ai-apply-btn"
                      onClick={handleApplyImprovedSummary}
                    >
                      ↑ Apply to Resume
                    </button>

                    {ai.summaryResult.tips?.length > 0 && (
                      <div className="ai-tips">
                        <div className="ai-tips-label">💡 Tips</div>
                        <ul>
                          {ai.summaryResult.tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── Tab: ATS Analysis ───────────────────────────────── */}
            {activeAiTab === 'ats' && (
              <div className="ai-tab-content" role="tabpanel">
                <p className="ai-helper">
                  Paste a job description to get your ATS match score, missing keywords, and suggestions.
                </p>
                <textarea
                  id="job-description"
                  className="ai-jd-textarea"
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                />
                <button
                  id="btn-ats-analysis"
                  className="ai-action-btn"
                  onClick={handleAtsAnalysis}
                  disabled={ai.loading}
                >
                  {ai.loading ? <span className="spinner" /> : '📊'} Analyse ATS Score
                </button>

                {ai.atsResult && (
                  <div className="ai-result-card">
                    <div className="ats-score-row">
                      <div className="ats-score-ring">
                        <svg viewBox="0 0 36 36" className="ats-ring-svg">
                          <path className="ats-ring-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="ats-ring-fill"
                            strokeDasharray={`${ai.atsResult.atsScore}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <text x="18" y="20.35" className="ats-ring-text">
                            {ai.atsResult.atsScore}%
                          </text>
                        </svg>
                      </div>
                      <div className="ats-feedback">
                        <div className="ai-result-label">ATS Match Score</div>
                        <p>{ai.atsResult.overallFeedback}</p>
                      </div>
                    </div>

                    {ai.atsResult.missingKeywords?.length > 0 && (
                      <div className="ai-keywords">
                        <div className="ai-result-label">⚠ Missing Keywords</div>
                        <div className="chip-row">
                          {ai.atsResult.missingKeywords.map((kw, i) => (
                            <span key={i} className="chip chip--missing">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {ai.atsResult.suggestions?.length > 0 && (
                      <div className="ai-tips">
                        <div className="ai-tips-label">✦ Suggestions</div>
                        <ul>
                          {ai.atsResult.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── Tab: Suggest Skills ─────────────────────────────── */}
            {activeAiTab === 'skills' && (
              <div className="ai-tab-content" role="tabpanel">
                <p className="ai-helper">
                  Gemini suggests high-impact skills to add for your target role. Click any chip to add it.
                </p>
                <button
                  id="btn-suggest-skills"
                  className="ai-action-btn"
                  onClick={handleSuggestSkills}
                  disabled={ai.loading}
                >
                  {ai.loading ? <span className="spinner" /> : '💡'} Suggest Skills
                </button>

                {ai.skillsResult && (
                  <div className="ai-result-card">
                    <div className="ai-result-label">✦ Recommended Skills</div>
                    {ai.skillsResult.reason && (
                      <p className="ai-reason">{ai.skillsResult.reason}</p>
                    )}
                    <div className="skill-suggestions">
                      {ai.skillsResult.suggestedSkills?.map((item, i) => (
                        <div key={i} className="skill-suggestion-item">
                          <button
                            className="chip chip--add"
                            onClick={() => handleAddSuggestedSkill(item.skill)}
                            title={`Click to add "${item.skill}"`}
                          >
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

            {/* ─── Tab: JD Analyzer ──────────────────────────────────── */}
            {activeAiTab === 'jd' && (
              <div className="ai-tab-content" role="tabpanel">
                <p className="ai-helper">
                  Extract ATS-focused keywords from a job description and map them into resume-ready tag groups.
                </p>
                <textarea
                  className="ai-jd-textarea"
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                />
                <button
                  className="ai-action-btn"
                  onClick={handleAnalyzeJD}
                  disabled={ai.loading}
                >
                  {ai.loading ? <span className="spinner" /> : '🧠'} Extract Keywords
                </button>

                {ai.jdResult && (
                  <div className="ai-result-card">
                    {[
                      ['Hard Skills', ai.jdResult.hardSkills, 'chip--hard'],
                      ['Soft Skills', ai.jdResult.softSkills, 'chip--soft'],
                      ['Action Verbs', ai.jdResult.actionVerbs, 'chip--verb'],
                      ['Domain', ai.jdResult.domain, 'chip--domain'],
                      ['Seniority Level', ai.jdResult.seniorityLevel, 'chip--level'],
                    ].map(([label, tags, className]) => (
                      <div key={label} className="ai-keywords ai-keywords--section">
                        <div className="ai-result-label">{label}</div>
                        <div className="chip-row">
                          {Array.isArray(tags) && tags.length > 0 ? (
                            tags.map((tag, i) => (
                              <span key={`${label}-${i}`} className={`chip ${className}`}>{tag}</span>
                            ))
                          ) : (
                            <span className="chip chip--empty">No clear tags found</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Error */}
            {ai.error && (
              <div className="ai-error">
                <span>⚠ {ai.error}</span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Pipeline Diagram */}
      <section className="pipeline-section">
        <h3>AI Pipeline</h3>
        <div className="pipeline">
          {['Frontend Request', 'Backend Prompt Creation', 'Gemini API', 'AI Response', 'Structured JSON'].map(
            (step, i, arr) => (
              <div key={i} className="pipeline-step-wrapper">
                <div className="pipeline-step">{step}</div>
                {i < arr.length - 1 && <div className="pipeline-arrow">↓</div>}
              </div>
            )
          )}
        </div>
      </section>

      <p className="message">{message}</p>
    </main>
  );
}

export default App;
