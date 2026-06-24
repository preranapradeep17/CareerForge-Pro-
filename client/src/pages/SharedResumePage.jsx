import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ResumePreview from '../components/ResumePreview';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export default function SharedResumePage() {
  const { shareId } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedResume = async () => {
      try {
        const response = await fetch(`${API_BASE}/resumes/share/${shareId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch shared resume');
        }
        
        setResume(data.resume);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedResume();
  }, [shareId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--background)', color: 'var(--text)' }}>
        <div style={{ display: 'grid', gap: '1rem', justifyItems: 'center' }}>
          <div className="skeleton-title" style={{ width: '120px', height: '24px' }} />
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading shared resume...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--background)', color: 'var(--text)', padding: '2rem' }}>
        <article className="surface-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⚠️</span>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', margin: '0 0 0.75rem' }}>Link Expired or Invalid</h3>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6', margin: '0 0 1.5rem' }}>
            {error || 'This shared resume link could not be found. The owner may have disabled public sharing.'}
          </p>
          <a href="/" className="primary-button" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            Go to CareerForge Pro
          </a>
        </article>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '2rem 1rem 4rem', color: 'var(--text)' }}>
      <header style={{ maxWidth: '800px', margin: '0 auto 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="eyebrow">Public Resume Share</span>
          <h2 style={{ fontSize: '1.5rem', margin: '0.2rem 0 0', fontFamily: "'Space Grotesk', sans-serif" }}>
            {resume.personalInfo?.fullName || 'Candidate Resume'}
          </h2>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={() => window.print()}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          🖨️ Print Resume
        </button>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', boxShadow: 'var(--shadow)' }}>
        <ResumePreview
          resumeData={{
            name: resume.name,
            fullName: resume.personalInfo?.fullName || '',
            title: resume.targetJD || '',
            summary: resume.personalInfo?.summary || '',
            skills: Array.isArray(resume.skills) ? resume.skills.join(', ') : '',
          }}
          experience={resume.experience || []}
          education={resume.education || []}
          projects={resume.projects || []}
          template={resume.template || 'classic'}
          atsScore={resume.atsScore || 0}
        />
      </main>

      <footer style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
          Powered by <a href="/" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: '600' }}>✦ CareerForge Pro</a> — AI-Powered Career Command Center
        </p>
      </footer>
    </div>
  );
}
