import React from 'react';
import AuthShell from '../components/AuthShell';

export default function RegisterPage({ app }) {
  return (
    <AuthShell
      title="Create Account"
      subtitle="Set up CareerForge Pro and start building your job search system."
      footerCopy="Already have an account?"
      footerLink="/login"
      footerLabel="Login"
    >
      <form className="auth-form" onSubmit={app.handleRegister}>
        <label>
          Full Name
          <input
            type="text"
            name="name"
            value={app.registerForm.name}
            onChange={app.handleRegisterChange}
            placeholder="Prerana Pradeep"
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={app.registerForm.email}
            onChange={app.handleRegisterChange}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={app.registerForm.password}
            onChange={app.handleRegisterChange}
            placeholder="Create a password"
            required
            minLength={6}
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            name="confirmPassword"
            value={app.registerForm.confirmPassword}
            onChange={app.handleRegisterChange}
            placeholder="Confirm your password"
            required
          />
        </label>
        <button type="submit" className="primary-button primary-button--full" disabled={app.loading}>
          {app.loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </AuthShell>
  );
}
