import React from 'react';
import AuthShell from '../components/AuthShell';

export default function LoginPage({ app }) {
  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Login to continue building stronger applications."
      footerCopy="Don't have an account?"
      footerLink="/register"
      footerLabel="Create Account"
    >
      <form className="auth-form" onSubmit={app.handleLogin}>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={app.loginForm.email}
            onChange={app.handleLoginChange}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={app.loginForm.password}
            onChange={app.handleLoginChange}
            placeholder="Enter your password"
            required
          />
        </label>
        <button type="submit" className="primary-button primary-button--full" disabled={app.loading}>
          {app.loading ? 'Logging in...' : 'Login'}
        </button>
        <span className="auth-muted">Forgot Password?</span>
      </form>
      <div className="auth-divider">
        <span>or</span>
      </div>
      <button
        type="button"
        onClick={app.handleDemoLogin}
        className="demo-button"
        disabled={app.loading}
      >
        ⚡ Try Demo Mode (Instant Access)
      </button>
    </AuthShell>
  );
}
