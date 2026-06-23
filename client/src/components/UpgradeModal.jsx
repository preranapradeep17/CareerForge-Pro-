import React from 'react';

const UPGRADE_BENEFITS = [
  { icon: '📄', text: 'Unlimited Resumes (Starter limit: 1)' },
  { icon: '⬇️', text: 'A4 PDF Downloads — recruiter-ready exports' },
  { icon: '🎯', text: 'JD Analyzer — extract recruiter keywords instantly' },
  { icon: '✍️', text: 'AI Bullet Rewriter & quantified achievements' },
  { icon: '💌', text: 'Cover Letter Generator powered by Gemini AI' },
];

export default function UpgradeModal({ onClose, onUpgrade, isLoading }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-surface" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow" style={{ marginBottom: '0.4rem', display: 'block' }}>Unlock Pro</span>
            <h3>CareerForge Pro</h3>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-shimmer-line" />

        <p className="ai-helper">Everything you need to go from draft to job-ready — in one focused platform.</p>

        <ul className="modal-benefits">
          {UPGRADE_BENEFITS.map((benefit) => (
            <li key={benefit.text} className="modal-benefit-item">
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{benefit.icon}</span>
              <span>{benefit.text}</span>
            </li>
          ))}
        </ul>

        <div className="modal-pricing">
          <strong>$12.00 / month</strong>
          <span>Cancel anytime — no lock-in, no hidden fees.</span>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onUpgrade}
            disabled={isLoading}
            id="upgrade-modal-cta-btn"
          >
            {isLoading ? 'Opening Stripe...' : '✦ Upgrade Now — $12/mo'}
          </button>
          <button type="button" className="ghost-button" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
