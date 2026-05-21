import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000/api';
const TOKEN_KEY = 'careerforge_token';

const initialRegister = { name: '', email: '', password: '' };
const initialLogin = { email: '', password: '' };

function App() {
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    fetchProfile(token);
  }, [token]);

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
      setToken(data.token);
      setUser(data.user);
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
      setToken(data.token);
      setUser(data.user);
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

      setUser(data.user);
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
    setToken('');
    setUser(null);
    setMessage('Logged out and token cleared.');
  };

  return (
    <main className="app-shell">
      <header>
        <h1>Day 2: Authentication System</h1>
        <p>Register, login, receive JWT, and access protected routes.</p>
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
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>Token in localStorage:</strong> {isAuthenticated ? 'Stored' : 'Not found'}</p>
        {user && (
          <div className="user-block">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Plan:</strong> {user.plan}</p>
            <p><strong>Resume Count:</strong> {user.resumeCount}</p>
          </div>
        )}
        <div className="actions">
          <button type="button" onClick={() => fetchProfile()} disabled={!isAuthenticated || loading}>
            Test Protected Route
          </button>
          <button type="button" onClick={handleLogout} disabled={!isAuthenticated || loading}>
            Logout
          </button>
        </div>
      </section>

      <p className="message">{message}</p>
    </main>
  );
}

export default App;
