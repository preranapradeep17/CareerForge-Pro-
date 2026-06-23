import React from 'react';

export default function VersionHistorySection({ app }) {
  if (!app.resumeId) {
    return (
      <article className="surface-card" style={{ transition: 'all 0.3s ease' }}>
        <div className="surface-card__header">
          <h3>Version History</h3>
        </div>
        <p className="ai-helper" style={{ margin: '1rem 0 0' }}>Save your resume first to activate version history snapshots.</p>
      </article>
    );
  }

  return (
    <article className="surface-card" style={{ transition: 'all 0.3s ease' }}>
      <div className="surface-card__header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h3>Version History</h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
            Google Docs-style autosaves and manual snapshots
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
          onClick={app.handleSaveVersion}
        >
          Save Snapshot
        </button>
      </div>

      <div style={{ display: 'grid', gap: '0.7rem' }}>
        {app.loadingVersions ? (
          <p className="ai-helper">Loading snapshots...</p>
        ) : app.versions.length > 0 ? (
          <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {app.versions.map((ver) => {
              const isAutoSaved = ver.versionName.startsWith('Auto-saved');
              const cleanName = isAutoSaved ? 'Auto-saved Revision' : ver.versionName;

              return (
                <div
                  key={ver._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem 1rem',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.04) 100%)',
                    borderRadius: '14px',
                    border: '1px solid rgba(151, 182, 255, 0.1)',
                    borderLeft: isAutoSaved ? '4px solid var(--muted)' : '4px solid var(--brand)',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(101, 184, 255, 0.3)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(151, 182, 255, 0.1)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.04) 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'grid', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#e5eefc', fontWeight: 600 }}>{cleanName}</strong>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          background: isAutoSaved ? 'rgba(138, 160, 201, 0.12)' : 'rgba(101, 184, 255, 0.14)',
                          color: isAutoSaved ? 'var(--muted)' : 'var(--brand)',
                          border: isAutoSaved ? '1px solid rgba(138, 160, 201, 0.2)' : '1px solid rgba(101, 184, 255, 0.25)',
                        }}
                      >
                        {isAutoSaved ? '↺ Auto' : '✦ Snapshot'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {new Date(ver.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button
                      type="button"
                      className="ghost-button"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', borderRadius: '12px' }}
                      onClick={() => app.handleRestoreVersion(ver._id)}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.78rem',
                        borderRadius: '12px',
                        borderColor: 'rgba(251, 113, 133, 0.25)',
                        color: 'var(--danger)',
                        background: 'rgba(251, 113, 133, 0.04)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(251, 113, 133, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(251, 113, 133, 0.04)';
                      }}
                      onClick={() => app.handleDeleteVersion(ver._id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p className="ai-helper">No saved versions found.</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
              Start editing to trigger automatic saving, or save a manual snapshot above!
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
