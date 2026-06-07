/**
 * MinimalTemplate — Clean typography, zero gradients.
 * Single-column, pure white, editorial feel.
 * Small-caps labels, hairline dividers, monochrome skills.
 */
export default function MinimalTemplate({ resumeData = {}, atsScore = 0 }) {
  const skills = (resumeData?.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.name}>{resumeData.fullName || 'Your Name'}</h2>
          <p style={styles.title}>{resumeData.title || 'Target Role'}</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.scoreBox}>
            <span style={styles.scoreValue}>{atsScore}%</span>
            <span style={styles.scoreLabel}>ATS</span>
          </div>
        </div>
      </header>

      {/* ── Contact Bar ── */}
      <div style={styles.contactBar}>
        <span style={styles.contactItem}>hello@email.com</span>
        <span style={styles.contactSep}>·</span>
        <span style={styles.contactItem}>+1 (555) 000-0000</span>
        <span style={styles.contactSep}>·</span>
        <span style={styles.contactItem}>San Francisco, CA</span>
        <span style={styles.contactSep}>·</span>
        <span style={styles.contactItem}>linkedin.com/in/profile</span>
      </div>

      {/* ── Body ── */}
      <div style={styles.body}>
        {/* Summary */}
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Summary</p>
          <p style={styles.bodyText}>
            {resumeData.summary ||
              'Write 2–3 sentences that clearly communicate your professional identity, key strengths, and what makes you the right fit for this role.'}
          </p>
        </section>

        {/* Skills */}
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Skills</p>
          {skills.length > 0 ? (
            <div style={styles.skillRow}>
              {skills.map((skill, i) => (
                <span key={skill} style={styles.skillItem}>
                  {skill}
                  {i < skills.length - 1 && <span style={styles.skillSep}>,</span>}
                </span>
              ))}
            </div>
          ) : (
            <p style={styles.emptyNote}>Add skills separated by commas in the editor.</p>
          )}
        </section>

        {/* Experience */}
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Experience</p>
          <div style={styles.entry}>
            <div style={styles.entryHeader}>
              <div>
                <p style={styles.entryRole}>Senior Software Engineer</p>
                <p style={styles.entryCompany}>TechCorp Inc., San Francisco</p>
              </div>
              <p style={styles.entryDate}>Jan 2022 – Present</p>
            </div>
            <ul style={styles.entryBullets}>
              <li>Reduced system latency by 40% through microservice decomposition.</li>
              <li>Mentored 4 junior engineers, improving team velocity consistently.</li>
              <li>Coordinated 3 major product launches with zero critical incidents.</li>
            </ul>
          </div>
        </section>

        {/* Education */}
        <section style={{ ...styles.section, borderBottom: 'none' }}>
          <p style={styles.sectionLabel}>Education</p>
          <div style={styles.entryHeader}>
            <div>
              <p style={styles.entryRole}>B.Sc. Computer Science</p>
              <p style={styles.entryCompany}>University of Excellence</p>
            </div>
            <p style={styles.entryDate}>2018 – 2022</p>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <span>CareerForge Pro</span>
        <span style={styles.footerRight}>ATS Score: {atsScore}%</span>
      </footer>
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    background: '#ffffff',
    color: '#18181b',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    fontSize: '12.5px',
    lineHeight: '1.6',
    border: '1px solid #e4e4e7',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '1.6rem 2rem 1.1rem',
    borderBottom: '2px solid #18181b',
  },
  headerLeft: {},
  headerRight: {},
  name: {
    margin: '0 0 0.2rem',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.8rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: '#09090b',
  },
  title: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#71717a',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  scoreBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.5rem 0.9rem',
    border: '1.5px solid #18181b',
    borderRadius: '8px',
  },
  scoreValue: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#09090b',
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#71717a',
    marginTop: '0.1rem',
  },
  contactBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.4rem',
    padding: '0.7rem 2rem',
    background: '#fafafa',
    borderBottom: '1px solid #e4e4e7',
  },
  contactItem: {
    fontSize: '0.72rem',
    color: '#52525b',
  },
  contactSep: {
    color: '#d4d4d8',
  },
  body: {
    padding: '0 2rem',
  },
  section: {
    padding: '1rem 0',
    borderBottom: '1px solid #e4e4e7',
  },
  sectionLabel: {
    margin: '0 0 0.6rem',
    fontSize: '0.62rem',
    fontWeight: 800,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#a1a1aa',
  },
  bodyText: {
    margin: 0,
    color: '#3f3f46',
    lineHeight: '1.75',
    fontSize: '0.82rem',
  },
  skillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.3rem',
    alignItems: 'center',
  },
  skillItem: {
    fontSize: '0.79rem',
    color: '#3f3f46',
    fontWeight: 500,
  },
  skillSep: {
    color: '#a1a1aa',
  },
  emptyNote: {
    margin: 0,
    color: '#a1a1aa',
    fontSize: '0.78rem',
    fontStyle: 'italic',
  },
  entry: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  entryRole: {
    margin: '0 0 0.1rem',
    fontWeight: 700,
    fontSize: '0.84rem',
    color: '#09090b',
  },
  entryCompany: {
    margin: 0,
    color: '#71717a',
    fontSize: '0.76rem',
  },
  entryDate: {
    margin: 0,
    color: '#a1a1aa',
    fontSize: '0.72rem',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  entryBullets: {
    margin: '0.35rem 0 0',
    paddingLeft: '1rem',
    color: '#52525b',
    fontSize: '0.8rem',
    lineHeight: '1.65',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.65rem 2rem',
    borderTop: '1px solid #e4e4e7',
    color: '#a1a1aa',
    fontSize: '0.68rem',
    letterSpacing: '0.06em',
  },
  footerRight: {
    fontWeight: 600,
  },
};
