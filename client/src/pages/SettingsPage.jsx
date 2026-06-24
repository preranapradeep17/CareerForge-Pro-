import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

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
      <div className="subscription-info-grid" style={{ marginBottom: '1.25rem' }}>
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

function ProfileSection({ app }) {
  const [name, setName] = useState(app.user?.name || '');
  const [email, setEmail] = useState(app.user?.email || '');
  const [photo, setPhoto] = useState(app.user?.profilePhoto || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setName(app.user?.name || '');
    setEmail(app.user?.email || '');
    setPhoto(app.user?.profilePhoto || '');
  }, [app.user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsUpdating(true);
    await app.handleUpdateProfile({
      name: name.trim(),
      email: email.trim(),
      profilePhoto: photo,
    });
    setIsUpdating(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--brand)', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
          {photo ? (
            <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--brand)', background: 'var(--brand-glow)' }}>
              {name.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <label style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.62rem', textAlign: 'center', padding: '0.2rem 0', cursor: 'pointer', fontWeight: 'bold' }}>
            UPLOAD
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <strong style={{ fontSize: '1.1rem' }}>{app.user?.name || 'User'}</strong>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{app.user?.email || 'email@example.com'}</span>
        </div>
      </div>

      <label>
        Name
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
      </label>
      <label>
        Email Address
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
      </label>
      <button type="submit" className="primary-button" disabled={isUpdating}>
        {isUpdating ? 'Saving...' : 'Save Profile Changes'}
      </button>
    </form>
  );
}

function PasswordSection({ app }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsUpdating(true);
    const success = await app.handleUpdatePassword({
      currentPassword,
      newPassword,
    });
    setIsUpdating(false);

    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
      <label>
        Current Password
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
        />
      </label>
      <label>
        New Password
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
        />
      </label>
      <label>
        Confirm New Password
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />
      </label>
      <button type="submit" className="primary-button" disabled={isUpdating}>
        {isUpdating ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}

function DeleteAccountSection({ app }) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setIsDeleting(true);
    await app.handleDeleteAccount();
    setIsDeleting(false);
    setIsOpen(false);
  };

  return (
    <>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          This action is permanent and cannot be undone. All your resumes, versions, and payment records will be completely deleted.
        </p>
        <button
          type="button"
          className="ghost-button"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', width: '100%' }}
          onClick={() => setIsOpen(true)}
        >
          🚨 Delete My Account
        </button>
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-surface" onClick={(e) => e.stopPropagation()} style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <div className="modal-header">
              <div>
                <span className="eyebrow" style={{ color: 'var(--danger)', marginBottom: '0.4rem', display: 'block' }}>Dangerous Action</span>
                <h3 style={{ margin: '0.2rem 0 0' }}>Delete Account permanently?</h3>
              </div>
              <button type="button" className="modal-close-button" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            
            <div className="modal-shimmer-line" style={{ background: 'var(--danger)' }} />
            
            <div style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                To confirm deletion, please type <strong style={{ color: 'white' }}>DELETE</strong> in the box below.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                style={{ borderColor: confirmText === 'DELETE' ? 'var(--danger)' : 'var(--line)' }}
              />
              
              <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: 'var(--danger)', borderColor: 'var(--danger)', flex: 1 }}
                  disabled={confirmText !== 'DELETE' || isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
                <button type="button" className="ghost-button" style={{ flex: 1 }} onClick={() => setIsOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
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

      <section className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', padding: '0 1.5rem 1.5rem' }}>
        <article className="surface-card">
          <h3>Profile Info</h3>
          <ProfileSection app={app} />
        </article>
        <article className="surface-card">
          <h3>Update Password</h3>
          <PasswordSection app={app} />
        </article>
        <article className="surface-card">
          <h3>Subscription</h3>
          <PlanStatusSection app={app} />
        </article>
        <article className="surface-card surface-card--danger">
          <h3>Delete Account</h3>
          <DeleteAccountSection app={app} />
        </article>
      </section>
    </div>
  );
}
