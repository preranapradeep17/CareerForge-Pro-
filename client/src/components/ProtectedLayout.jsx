import React from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import UpgradeModal from './UpgradeModal';

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/resume-builder', label: 'Resumes' },
  { to: '/ai', label: 'AI Assistant' },
  { to: '/templates', label: 'Templates' },
  { to: '/cover-letter', label: 'Cover Letters' },
  { to: '/settings', label: 'Settings' },
];

export function ProtectedRoute({ isLoggedIn }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function ProtectedLayout({ app }) {
  const { user, loading, handleLogout, isUpgradeModalOpen, setIsUpgradeModalOpen, handleUpgrade } = app;
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">CF</div>
          <div>
            <h1>CareerForge Pro</h1>
            <p>AI-Powered Resume Intelligence</p>
          </div>
        </div>

        <nav className="workspace-nav">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'workspace-nav__link workspace-nav__link--active' : 'workspace-nav__link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="workspace-sidebar__footer">
          <div className="user-badge">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{user?.name || 'CareerForge User'}</strong>
              {user?.plan === 'pro'
                ? <span className="pro-badge">✦ Pro</span>
                : <span className="free-badge">Free</span>
              }
            </div>
            <span>{user?.email || 'No email loaded yet'}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginBottom: '0.65rem' }}>
            <button
              type="button"
              className="ghost-button"
              onClick={app.toggleTheme}
              style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
            >
              {app.theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => handleLogout()}
              style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="workspace-main">
        <Outlet />
      </div>
      {isUpgradeModalOpen && (
        <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} onUpgrade={handleUpgrade} isLoading={loading} />
      )}
    </div>
  );
}
