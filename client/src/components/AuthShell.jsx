import React from 'react';
import { NavLink } from 'react-router-dom';

export default function AuthShell({ title, subtitle, children, footerCopy, footerLink, footerLabel }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-lockup brand-lockup--center">
          <div className="brand-mark">CF</div>
          <div>
            <h1>CareerForge Pro</h1>
            <p>AI-Powered Resume Intelligence</p>
          </div>
        </div>
        <div className="auth-copy">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {children}
        <p className="auth-footer">
          {footerCopy} <NavLink to={footerLink}>{footerLabel}</NavLink>
        </p>
      </section>
    </main>
  );
}
