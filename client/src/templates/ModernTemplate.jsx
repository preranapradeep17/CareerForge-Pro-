/**
 * ModernTemplate — Sidebar + color accents.
 * Two-column layout: narrow teal sidebar on the left,
 * main content area on the right. Bold and contemporary.
 */
export default function ModernTemplate({ resumeData, atsScore }) {
  const skills = resumeData.skills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const initials = resumeData.fullName
    ? resumeData.fullName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : 'YN';

  const scoreColor =
    atsScore >= 75 ? '#2dd4bf' : atsScore >= 50 ? '#facc15' : '#fb7185';

  return (
    <div style={styles.root}>
      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        {/* Avatar */}
        <div style={styles.avatar}>{initials}</div>

        {/* Name / Title */}
        <div style={styles.sideIdentity}>
          <p style={styles.sideName}>{resumeData.fullName || 'Your Name'}</p>
          <p style={styles.sideTitle}>{resumeData.title || 'Target Role'}</p>
        </div>

        {/* ATS Score Gauge */}
        <div style={styles.scoreBlock}>
          <p style={styles.sideLabel}>ATS Score</p>
          <div style={styles.scoreCircle}>
            <span style={{ ...styles.scoreNumber, color: scoreColor }}>
              {atsScore}%
            </span>
          </div>
          <p style={styles.scoreNote}>
            {atsScore >= 75
              ? 'Strong match'
              : atsScore >= 50
              ? 'Good progress'
              : 'Needs work'}
          </p>
        </div>

        {/* Skills */}
        <div style={styles.sideSection}>
          <p style={styles.sideLabel}>Core Skills</p>
          <div style={styles.sideSkills}>
            {skills.length > 0 ? (
              skills.map((skill) => (
                <span key={skill} style={styles.sideChip}>
                  {skill}
                </span>
              ))
            ) : (
              <span style={styles.sideEmpty}>Add skills in the editor</span>
            )}
          </div>
        </div>

        {/* Contact placeholder */}
        <div style={styles.sideSection}>
          <p style={styles.sideLabel}>Contact</p>
          <div style={styles.contactList}>
            <p style={styles.contactItem}>📧 hello@example.com</p>
            <p style={styles.contactItem}>📍 San Francisco, CA</p>
            <p style={styles.contactItem}>🔗 linkedin.com/in/profile</p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={styles.main}>
        {/* Section heading accent dot pattern */}
        <section style={styles.mainSection}>
          <div style={styles.mainSectionHead}>
            <span style={styles.accentDot} />
            <p style={styles.mainLabel}>Professional Summary</p>
          </div>
          <p style={styles.mainSummary}>
            {resumeData.summary ||
              'Your professional summary appears here. Craft 2–3 sentences that highlight your unique value proposition for the target role.'}
          </p>
        </section>

        {/* Experience */}
        <section style={styles.mainSection}>
          <div style={styles.mainSectionHead}>
            <span style={styles.accentDot} />
            <p style={styles.mainLabel}>Professional Experience</p>
          </div>
          <div style={styles.expCard}>
            <div style={styles.expHeader}>
              <div>
                <p style={styles.expRole}>Senior Software Engineer</p>
                <p style={styles.expCompany}>TechCorp Inc. · San Francisco, CA</p>
              </div>
              <span style={styles.expDate}>2022 – Present</span>
            </div>
            <ul style={styles.expBullets}>
              <li>Architected scalable microservices reducing latency by 40%.</li>
              <li>Mentored 4 junior engineers through quarterly growth cycles.</li>
              <li>Drove feature delivery for 3 major product launches on schedule.</li>
            </ul>
          </div>
        </section>

        {/* Education */}
        <section style={styles.mainSection}>
          <div style={styles.mainSectionHead}>
            <span style={styles.accentDot} />
            <p style={styles.mainLabel}>Education</p>
          </div>
          <div style={styles.eduRow}>
            <div>
              <p style={styles.expRole}>B.Sc. Computer Science</p>
              <p style={styles.expCompany}>University of Excellence · 2018–2022</p>
            </div>
            <span style={styles.expDate}>3.8 GPA</span>
          </div>
        </section>

        {/* Footer tag */}
        <div style={styles.mainFooter}>
          <span style={styles.mainFooterTag}>CareerForge Pro</span>
        </div>
      </main>
    </div>
  );
}

const TEAL = '#0d9488';
const TEAL_DARK = '#0f172a';
const TEAL_MID = '#134e4a';

const styles = {
  root: {
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    background: '#ffffff',
    color: '#0f172a',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 18px 48px rgba(15,23,42,0.18)',
    fontSize: '13px',
    lineHeight: '1.6',
    minHeight: '520px',
  },
  sidebar: {
    width: '38%',
    flexShrink: 0,
    background: `linear-gradient(180deg, ${TEAL_DARK} 0%, ${TEAL_MID} 50%, #0f4037 100%)`,
    padding: '1.6rem 1.2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${TEAL} 0%, #2dd4bf 100%)`,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.3rem',
    fontWeight: 700,
    border: '3px solid rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  sideIdentity: {
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    paddingBottom: '1rem',
  },
  sideName: {
    margin: '0 0 0.2rem',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1rem',
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.3,
  },
  sideTitle: {
    margin: 0,
    color: '#5eead4',
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  scoreBlock: {
    textAlign: 'center',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '14px',
    padding: '0.9rem 0.7rem',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  scoreCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(45,212,191,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0.5rem auto',
  },
  scoreNumber: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  scoreNote: {
    margin: '0.3rem 0 0',
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.68rem',
  },
  sideSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sideLabel: {
    margin: 0,
    fontSize: '0.64rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: '#5eead4',
  },
  sideSkills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
  },
  sideChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.22rem 0.6rem',
    background: 'rgba(45,212,191,0.14)',
    border: '1px solid rgba(45,212,191,0.3)',
    borderRadius: '6px',
    color: '#99f6e4',
    fontSize: '0.71rem',
    fontWeight: 600,
  },
  sideEmpty: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '0.75rem',
    fontStyle: 'italic',
  },
  contactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.28rem',
  },
  contactItem: {
    margin: 0,
    color: 'rgba(255,255,255,0.68)',
    fontSize: '0.73rem',
  },
  main: {
    flex: 1,
    padding: '1.6rem 1.4rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    background: '#ffffff',
  },
  mainSection: {
    paddingBottom: '0.8rem',
    borderBottom: '1px solid #f1f5f9',
  },
  mainSectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  accentDot: {
    display: 'block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${TEAL}, #2dd4bf)`,
    flexShrink: 0,
  },
  mainLabel: {
    margin: 0,
    fontSize: '0.68rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: TEAL,
  },
  mainSummary: {
    margin: 0,
    color: '#334155',
    lineHeight: '1.75',
    fontSize: '0.83rem',
  },
  expCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  expHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  expRole: {
    margin: '0 0 0.1rem',
    fontWeight: 700,
    fontSize: '0.84rem',
    color: '#0f172a',
  },
  expCompany: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.74rem',
  },
  expDate: {
    flexShrink: 0,
    padding: '0.2rem 0.55rem',
    background: '#f0fdfa',
    border: '1px solid #99f6e4',
    borderRadius: '6px',
    color: '#0f766e',
    fontSize: '0.68rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  expBullets: {
    margin: 0,
    paddingLeft: '1rem',
    color: '#475569',
    fontSize: '0.8rem',
    lineHeight: '1.65',
  },
  eduRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  mainFooter: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  mainFooterTag: {
    fontSize: '0.64rem',
    color: '#94a3b8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
};
