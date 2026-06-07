/**
 * ClassicTemplate — Safe corporate style.
 * Single-column, navy header, ruled section dividers.
 * Designed for ATS-friendly, traditional professional roles.
 */
export default function ClassicTemplate({ resumeData = {}, atsScore = 0 }) {
  const skills = (resumeData?.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h2 style={styles.name}>{resumeData.fullName || 'Your Name'}</h2>
          <p style={styles.title}>{resumeData.title || 'Target Role'}</p>
          <div style={styles.headerMeta}>
            <span style={styles.metaBadge}>ATS Score: {atsScore}%</span>
            <span style={styles.metaDot} />
            <span style={styles.metaLabel}>CareerForge Pro</span>
          </div>
        </div>
      </header>

      <div style={styles.body}>
        {/* ── Professional Summary ── */}
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Professional Summary</p>
          <div style={styles.rule} />
          <p style={styles.summaryText}>
            {resumeData.summary ||
              'Your professional summary appears here. Write 2–3 focused sentences that position you for the target role.'}
          </p>
        </section>

        {/* ── Core Skills ── */}
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Core Skills</p>
          <div style={styles.rule} />
          {skills.length > 0 ? (
            <div style={styles.skillGrid}>
              {skills.map((skill) => (
                <span key={skill} style={styles.skillChip}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={styles.emptyNote}>Add skills separated by commas in the editor.</p>
          )}
        </section>

        {/* ── Experience placeholder ── */}
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Professional Experience</p>
          <div style={styles.rule} />
          <div style={styles.experiencePlaceholder}>
            <p style={styles.placeholderTitle}>Senior Role · Company Name</p>
            <p style={styles.placeholderDate}>Jan 2022 – Present · City, State</p>
            <ul style={styles.bulletList}>
              <li>Led cross-functional initiatives that improved team delivery by 30%.</li>
              <li>Collaborated with stakeholders to refine product scope and roadmap alignment.</li>
            </ul>
          </div>
        </section>

        {/* ── Education placeholder ── */}
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Education</p>
          <div style={styles.rule} />
          <div style={styles.educationRow}>
            <div>
              <p style={styles.placeholderTitle}>Bachelor of Science · Computer Science</p>
              <p style={styles.placeholderDate}>University Name · 2018–2022</p>
            </div>
            <span style={styles.gpaTag}>GPA: 3.8</span>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <span>Generated with CareerForge Pro</span>
        <span style={styles.footerDot}>·</span>
        <span>ATS Score {atsScore}%</span>
      </footer>
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'Inter', Georgia, serif",
    background: '#ffffff',
    color: '#0f172a',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 18px 48px rgba(15,23,42,0.16)',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #3b82f6 100%)',
    padding: '1.8rem 2rem',
    color: '#ffffff',
  },
  headerInner: {
    maxWidth: '100%',
  },
  name: {
    margin: '0 0 0.25rem',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#ffffff',
  },
  title: {
    margin: '0 0 1rem',
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.78)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  metaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.3rem 0.75rem',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 700,
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#ffffff',
  },
  metaDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.4)',
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  body: {
    padding: '1.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  section: {
    paddingBottom: '1.1rem',
  },
  sectionLabel: {
    margin: '0 0 0.4rem',
    fontSize: '0.68rem',
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#1e3a8a',
  },
  rule: {
    height: '1px',
    background: 'linear-gradient(90deg, #3b82f6 0%, #e2e8f0 100%)',
    marginBottom: '0.75rem',
  },
  summaryText: {
    margin: 0,
    color: '#334155',
    lineHeight: '1.75',
    fontSize: '0.84rem',
  },
  skillGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.45rem',
  },
  skillChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.28rem 0.72rem',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    color: '#1e40af',
    fontSize: '0.76rem',
    fontWeight: 600,
  },
  emptyNote: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.8rem',
    fontStyle: 'italic',
  },
  experiencePlaceholder: {
    borderLeft: '3px solid #3b82f6',
    paddingLeft: '0.9rem',
  },
  placeholderTitle: {
    margin: '0 0 0.15rem',
    fontWeight: 700,
    fontSize: '0.84rem',
    color: '#0f172a',
  },
  placeholderDate: {
    margin: '0 0 0.5rem',
    color: '#64748b',
    fontSize: '0.76rem',
  },
  bulletList: {
    margin: 0,
    paddingLeft: '1.1rem',
    color: '#334155',
    fontSize: '0.82rem',
    lineHeight: '1.65',
  },
  educationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  gpaTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.65rem',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    color: '#166534',
    fontSize: '0.74rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 2rem',
    background: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    color: '#94a3b8',
    fontSize: '0.7rem',
  },
  footerDot: {
    color: '#cbd5e1',
  },
};
