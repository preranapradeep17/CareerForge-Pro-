import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function CoverLetterEditModal({ isOpen, onClose, initialContent, onSave }) {
  const [text, setText] = useState(initialContent || '');

  useEffect(() => {
    setText(initialContent || '');
  }, [initialContent]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cover_letter.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded cover_letter.txt');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-surface modal-surface--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow" style={{ marginBottom: '0.4rem', display: 'block' }}>Refine & Export</span>
            <h3>Edit Cover Letter</h3>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-shimmer-line" />

        <textarea
          className="modal-textarea"
          rows={16}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Refine your cover letter here..."
        />

        <div className="modal-actions" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              onSave(text);
              onClose();
            }}
          >
            Apply & Save
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleCopy}
          >
            📋 Copy
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleDownload}
          >
            ⬇️ Download .txt
          </button>
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoverLetterPage({ app }) {
  const [letterJobDescription, setLetterJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleGenerate = async () => {
    if (!letterJobDescription.trim()) {
      toast.error('Paste a job description first');
      return;
    }

    if (app.user?.plan !== 'pro') {
      app.setIsUpgradeModalOpen(true);
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('Generating cover letter with Gemini AI...');

    try {
      const skillsArray = app.resumeData.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);

      const response = await fetch(`${API_BASE}/ai/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${app.token}`,
        },
        body: JSON.stringify({
          resumeData: {
            fullName: app.resumeData.fullName || app.user?.name || 'Applicant',
            title: app.resumeData.title || 'Target Role',
            summary: app.resumeData.summary || '',
            skills: skillsArray,
          },
          jobDescription: letterJobDescription.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.upgradeRequired) {
          app.setIsUpgradeModalOpen(true);
        }
        throw new Error(data.message || 'Failed to generate cover letter');
      }

      const generatedText = data.coverLetter || '';
      setCoverLetter(generatedText);
      if (generatedText) {
        setIsEditModalOpen(true);
      }
      toast.success('Cover letter generated', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Cover Letter</span>
          <h2>Generate a tailored first draft</h2>
          <p>Use your resume data plus a target JD to create an editable cover letter fast.</p>
        </div>
      </header>

      <section className="builder-grid">
        <article className="surface-card builder-form">
          <div className="surface-card__header">
            <h3>Generator Inputs</h3>
            <span className="status-pill">Resume Selected</span>
          </div>
          <label>
            Job Description
            <textarea
              rows={10}
              value={letterJobDescription}
              onChange={(event) => setLetterJobDescription(event.target.value)}
              placeholder="Paste the target role description here."
            />
          </label>
          <button
            type="button"
            className="primary-button"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate with Gemini'}
          </button>
        </article>

        <article className="surface-card builder-preview">
          <div className="surface-card__header">
            <h3>Editable Cover Letter</h3>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {coverLetter && (
                <span className="status-pill status-pill--accent" style={{ fontSize: '0.74rem' }}>
                  {coverLetter.trim().split(/\s+/).filter(Boolean).length} words / {coverLetter.length} chars
                </span>
              )}
              <span className="status-pill">Ready to refine</span>
            </div>
          </div>
          {isGenerating ? (
            <div className="skeleton-card" style={{ height: '360px', justifyContent: 'center' }}>
              <div className="skeleton-title" style={{ width: '45%', marginBottom: '0.8rem' }} />
              <div className="skeleton-text" style={{ width: '90%' }} />
              <div className="skeleton-text" style={{ width: '85%' }} />
              <div className="skeleton-text" style={{ width: '95%' }} />
              <div className="skeleton-text skeleton-text--short" style={{ width: '60%' }} />
              <div className="skeleton-text" style={{ width: '75%' }} />
            </div>
          ) : (
            <textarea
              className="cover-letter-output"
              rows={18}
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder="Your generated cover letter appears here."
            />
          )}
          {coverLetter && (
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => setIsEditModalOpen(true)}
                style={{ flex: 1.5 }}
              >
                ✏️ Open in Modal Editor
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  navigator.clipboard.writeText(coverLetter);
                  toast.success('Cover letter copied to clipboard');
                }}
                style={{ flex: 1 }}
              >
                📋 Copy Text
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  const element = document.createElement("a");
                  const file = new Blob([coverLetter], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = `${app.resumeData.fullName || 'CareerForge'}_CoverLetter.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                  toast.success('Cover letter downloaded as .TXT');
                }}
                style={{ flex: 1 }}
              >
                📥 Download .TXT
              </button>
            </div>
          )}
        </article>
      </section>

      <CoverLetterEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialContent={coverLetter}
        onSave={(updatedText) => {
          setCoverLetter(updatedText);
          toast.success('Cover letter updated');
        }}
      />
    </div>
  );
}
