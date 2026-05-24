import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import {
  TOKEN_KEY,
  clearCredentials,
  setCredentials,
  setUser,
} from './store/authSlice';
import { setTemplate, updateResumeField } from './store/resumeSlice';

const API_BASE = 'http://localhost:5000/api';
const AUTO_SAVE_DELAY_MS = 1500;

const initialRegister = { name: '', email: '', password: '' };
const initialLogin = { email: '', password: '' };

function App() {
  const dispatch = useDispatch();
  const { user, token, isLoggedIn } = useSelector((state) => state.auth);
  const { resumeData, atsScore, template } = useSelector((state) => state.resume);

  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [resumeId, setResumeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState('');

  const hasResumeContent = useMemo(
    () => Object.values(resumeData).some((value) => value.trim().length > 0),
    [resumeData]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchProfile(token);
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn || !token || !hasResumeContent) {
      return;
    }

    const timeoutId = setTimeout(() => {
      saveResume();
    }, AUTO_SAVE_DELAY_MS);

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
      const endpoint = resumeId ? `${API_BASE}/resume/${resumeId}` : `${API_BASE}/resume`;
      const method = resumeId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to auto-save resume');
      }

      if (!resumeId && data.resume?._id) {
        setResumeId(data.resume._id);
      }

      setLastSavedAt(new Date());
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('Registering...');

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

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

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('Logging in...');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

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
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load profile');
      }

      dispatch(setUser(data.user));
      setMessage('Protected route is accessible.');
    } catch (error) {
      setMessage(error.message);
      if (error.message.toLowerCase().includes('unauthorized')) {
        handleLogout();
      }
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

  const handleResumeChange = (event) => {
    const { name, value } = event.target;
    dispatch(updateResumeField({ field: name, value }));
  };

  return (
    <main className="app-shell">
      <header>
        <h1>Day 5: Split-Screen Editor</h1>
        <p>Live preview with Redux-driven updates and debounced auto-save.</p>
      </header>

      <section className="grid">
        <form className="card" onSubmit={handleRegister}>
          <h2>Register</h2>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={registerForm.name}
            onChange={handleRegisterChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={registerForm.email}
            onChange={handleRegisterChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={registerForm.password}
            onChange={handleRegisterChange}
            required
            minLength={6}
          />
          <button type="submit" disabled={loading}>Create account</button>
        </form>

        <form className="card" onSubmit={handleLogin}>
          <h2>Login</h2>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={handleLoginChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={handleLoginChange}
            required
          />
          <button type="submit" disabled={loading}>Login</button>
        </form>
      </section>

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

      <section className="split-editor">
        <form className="card editor-pane">
          <h2>Resume Builder Form</h2>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={resumeData.fullName}
            onChange={handleResumeChange}
          />
          <input
            type="text"
            name="title"
            placeholder="Professional Title"
            value={resumeData.title}
            onChange={handleResumeChange}
          />
          <textarea
            name="summary"
            placeholder="Summary"
            value={resumeData.summary}
            onChange={handleResumeChange}
            rows={5}
          />
          <input
            type="text"
            name="skills"
            placeholder="Skills (comma separated)"
            value={resumeData.skills}
            onChange={handleResumeChange}
          />
          <label htmlFor="template">Template</label>
          <select
            id="template"
            value={template}
            onChange={(event) => dispatch(setTemplate(event.target.value))}
          >
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

      <p className="message">{message}</p>
    </main>
  );
}

export default App;
