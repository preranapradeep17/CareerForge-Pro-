import React from 'react';

function getPlanStatusClass(status) {
  if (!status || status === 'inactive') return 'inactive';
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trialing';
  if (status === 'past_due') return 'past_due';
  if (status === 'canceled' || status === 'unpaid') return 'inactive';
  return 'inactive';
}

function PlanStatusSection({ app }) {
  const { user, loading, handleUpgrade, handleManageBilling } = app;
  const isPro = user?.plan === 'pro';
  const statusKey = getPlanStatusClass(user?.planStatus);
  const renewalDate = user?.planCurrentPeriodEnd
    ? new Date(user.planCurrentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <>
      <div className="subscription-info-grid">
        <div className="subscription-info-item">
          <span className="subscription-info-item__label">Current Plan</span>
          <span className="subscription-info-item__value">
            {isPro ? 'Pro — $12/mo' : 'Starter — Free'}
          </span>
        </div>
        <div className="subscription-info-item">
          <span className="subscription-info-item__label">Status</span>
          <span className={`plan-status-badge plan-status-badge--${statusKey}`}>
            {statusKey === 'active' && '●'} {user?.planStatus || 'inactive'}
          </span>
        </div>
        <div className="subscription-info-item">
          <span className="subscription-info-item__label">Resumes Created</span>
          <span className="subscription-info-item__value">{user?.resumeCount ?? 0}</span>
        </div>
        {isPro && (
          <div className="subscription-info-item">
            <span className="subscription-info-item__label">
              {user?.planStatus === 'canceled' ? 'Access Until' : 'Renews On'}
            </span>
            <span className="subscription-info-item__value" style={{ fontSize: '0.82rem' }}>
              {renewalDate || '—'}
            </span>
          </div>
        )}
      </div>

      {!isPro ? (
        <button
          type="button"
          className="primary-button"
          style={{ width: '100%' }}
          onClick={handleUpgrade}
          disabled={loading}
          id="settings-upgrade-btn"
        >
          {loading ? 'Opening Stripe...' : '✦ Upgrade to Pro — $12/mo'}
        </button>
      ) : (
        <>
          <p style={{ color: 'var(--success)', fontWeight: '600', margin: '0 0 0.75rem' }}>
            ✓ Pro Plan is Active
          </p>
          <button
            type="button"
            className="secondary-button"
            style={{ width: '100%' }}
            onClick={handleManageBilling}
            disabled={loading}
            id="settings-billing-portal-btn"
          >
            {loading ? 'Opening Stripe...' : 'Manage Billing & Invoices'}
          </button>
        </>
      )}
    </>
  );
}

export default function SettingsPage({ app }) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Settings</span>
          <h2>Manage your account</h2>
          <p>Profile, password, subscription visibility, and account safety all live here.</p>
        </div>
      </header>

      <section className="settings-grid">
        <article className="surface-card">
          <h3>Profile</h3>
          <div className="subscription-info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="subscription-info-item">
              <span className="subscription-info-item__label">Name</span>
              <span className="subscription-info-item__value">{app.user?.name || '—'}</span>
            </div>
            <div className="subscription-info-item">
              <span className="subscription-info-item__label">Email</span>
              <span className="subscription-info-item__value" style={{ fontSize: '0.82rem', wordBreak: 'break-all' }}>{app.user?.email || '—'}</span>
            </div>
          </div>
        </article>
        <article className="surface-card">
          <h3>Password</h3>
          <p>Use a unique password and rotate it regularly when you are job searching actively.</p>
        </article>
        <article className="surface-card">
          <h3>Subscription</h3>
          <PlanStatusSection app={app} />
        </article>
        <article className="surface-card surface-card--danger">
          <h3>Delete Account</h3>
          <p>Keep destructive account actions here so users always know where to find them.</p>
        </article>
      </section>
    </div>
  );
}
