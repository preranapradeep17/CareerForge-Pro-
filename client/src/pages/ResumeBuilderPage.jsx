import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import ResumePreview from '../components/ResumePreview';
import AtsGauge from '../components/AtsGauge';
import VersionHistorySection from '../components/VersionHistorySection';
import { TEMPLATE_LIST } from '../templates';

const SKILL_SUGGESTIONS_BY_TITLE = {
  'frontend': ['React', 'JavaScript', 'TypeScript', 'Redux', 'Tailwind CSS', 'HTML5', 'CSS3', 'Vite', 'Next.js', 'Jest'],
  'backend': ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'SQL', 'REST API', 'GraphQL', 'Docker', 'Python', 'Redis'],
  'fullstack': ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'TypeScript', 'Redux', 'SQL', 'Git'],
  'software': ['Java', 'Python', 'C++', 'Git', 'Data Structures', 'Algorithms', 'Docker', 'SQL', 'AWS'],
  'data': ['Python', 'SQL', 'Machine Learning', 'Pandas', 'NumPy', 'TensorFlow', 'Data Analysis', 'Tableau', 'R'],
  'product': ['Product Strategy', 'Roadmapping', 'Agile', 'Jira', 'User Research', 'A/B Testing', 'Analytics', 'Figma'],
  'ui': ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'User Research', 'CSS', 'Tailwind CSS', 'Adobe XD'],
  'ux': ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'User Research', 'CSS', 'Tailwind CSS', 'Adobe XD'],
};

function AutoSaveIndicator({ isSaving, saveError, lastSavedAt }) {
  const [text, setText] = useState('Ready to save');

  useEffect(() => {
    if (isSaving) {
      setText('Auto-saving...');
      return;
    }
    if (saveError) {
      setText(`Error: ${saveError}`);
      return;
    }
    if (!lastSavedAt) {
      setText('Ready to save');
      return;
    }

    const updateText = () => {
      const diffMs = Date.now() - new Date(lastSavedAt).getTime();
      const diffSec = Math.floor(diffMs / 1000);

      if (diffSec < 5) {
        setText('Saved just now');
      } else if (diffSec < 60) {
        setText(`Saved ${diffSec} seconds ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setText(`Saved ${diffMin} minute${diffMin > 1 ? 's' : ''} ago`);
      }
    };

    updateText();
    const interval = setInterval(updateText, 5000);
    return () => clearInterval(interval);
  }, [isSaving, saveError, lastSavedAt]);

  return <span>{text}</span>;
}

export default function ResumeBuilderPage({ app }) {
  const { id } = useParams();
  const [draggedItem, setDraggedItem] = useState(null); // { index, type }
  const [dragOverItem, setDragOverItem] = useState(null); // { index, type }

  const handleDragStart = (e, index, type) => {
    setDraggedItem({ index, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e, index, type) => {
    if (!draggedItem || draggedItem.type !== type) return;
    e.preventDefault();
    if (dragOverItem?.index !== index || dragOverItem?.type !== type) {
      setDragOverItem({ index, type });
    }
  };

  const handleDrop = (e, index, type) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type) return;
    const startIndex = draggedItem.index;
    const endIndex = index;
    if (startIndex !== endIndex) {
      if (type === 'experience') {
        app.handleReorderExperience(startIndex, endIndex);
      } else if (type === 'education') {
        app.handleReorderEducation(startIndex, endIndex);
      } else if (type === 'projects') {
        app.handleReorderProjects(startIndex, endIndex);
      }
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  useEffect(() => {
    if (id && app.resumeId !== id) {
      app.fetchResumeById(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, app.resumeId]);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Resume Builder</span>
          <h2>Editor and live preview</h2>
          <p>Autosave, switch templates, parse an existing PDF, and export the finished version.</p>
        </div>
        <div className="header-actions">
          <NavLink to="/ai" className="ghost-link">AI Optimization</NavLink>
          <button
            type="button"
            className="primary-button"
            onClick={app.handleExportPdf}
            disabled={app.isExportingPdf}
          >
            {app.isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </header>

      <section className="builder-grid">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <form className="surface-card builder-form">
            <div className="surface-card__header">
              <h3>Resume Content</h3>
              <span className="status-pill">
                <AutoSaveIndicator
                  isSaving={app.isSaving}
                  saveError={app.saveError}
                  lastSavedAt={app.lastSavedAt}
                />
              </span>
            </div>

            <label>
              Upload Resume (PDF)
              <input
                type="file"
                accept="application/pdf"
                onChange={app.handleResumeUpload}
                disabled={app.isParsingResume}
              />
            </label>

            {/* Completeness Progress Bar */}
            {(() => {
              const completeness = [
                app.resumeData.fullName ? 15 : 0,
                app.resumeData.title ? 15 : 0,
                app.resumeData.summary ? 20 : 0,
                app.resumeData.skills ? 15 : 0,
                app.experience && app.experience.length > 0 ? 15 : 0,
                app.education && app.education.length > 0 ? 10 : 0,
                app.projects && app.projects.length > 0 ? 10 : 0,
              ].reduce((a, b) => a + b, 0);

              const getTip = () => {
                if (!app.resumeData.fullName) return 'Add your name';
                if (!app.resumeData.title) return 'Add your target job title';
                if (!app.resumeData.summary) return 'Add a professional summary';
                if (!app.resumeData.skills) return 'Add your core skills';
                if (!app.experience || app.experience.length === 0) return 'Add work experience';
                if (!app.education || app.education.length === 0) return 'Add education history';
                if (!app.projects || app.projects.length === 0) return 'Add a project';
                return 'Your resume is complete!';
              };

              return (
                <div className="completeness-bar-container" style={{ margin: '0.5rem 0 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Resume Completeness</span>
                    <span style={{ fontWeight: '700', color: completeness === 100 ? 'var(--success)' : 'var(--brand)' }}>
                      {completeness}%
                    </span>
                  </div>
                  <div className="completeness-track">
                    <div className="completeness-fill" style={{ width: `${completeness}%` }} />
                  </div>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                    💡 Tip: {getTip()}
                  </p>
                </div>
              );
            })()}

            <label>
              Resume Label / Name
              <input
                type="text"
                name="name"
                value={app.resumeData.name || ''}
                onChange={app.handleResumeChange}
                placeholder="e.g. Google Application, Frontend Resume"
              />
            </label>

            <label>
              Full Name
              <input
                type="text"
                name="fullName"
                value={app.resumeData.fullName}
                onChange={app.handleResumeChange}
                placeholder="Your full name"
              />
            </label>

            <label>
              Target Job Title
              <input
                type="text"
                name="title"
                value={app.resumeData.title}
                onChange={app.handleResumeChange}
                placeholder="Frontend Developer"
              />
            </label>

            <label>
              Professional Summary
              <textarea
                name="summary"
                value={app.resumeData.summary}
                onChange={app.handleResumeChange}
                rows={6}
                placeholder="Write a sharp professional summary."
              />
            </label>

            <label>
              Skills (comma separated)
              <input
                type="text"
                name="skills"
                value={app.resumeData.skills}
                onChange={app.handleResumeChange}
                placeholder="React, Node.js, MongoDB"
              />
              {/* Skills Suggestions */}
              {(() => {
                const title = (app.resumeData.title || '').toLowerCase();
                let matchingKey = '';
                if (title.includes('front')) matchingKey = 'frontend';
                else if (title.includes('back')) matchingKey = 'backend';
                else if (title.includes('full')) matchingKey = 'fullstack';
                else if (title.includes('data')) matchingKey = 'data';
                else if (title.includes('product')) matchingKey = 'product';
                else if (title.includes('ui') || title.includes('ux') || title.includes('design')) matchingKey = 'ui';
                else if (title.includes('soft') || title.includes('engin')) matchingKey = 'software';

                if (!matchingKey) return null;

                const suggestions = SKILL_SUGGESTIONS_BY_TITLE[matchingKey] || [];
                const currentSkills = (app.resumeData.skills || '')
                  .split(',')
                  .map((s) => s.trim().toLowerCase())
                  .filter(Boolean);

                const missingSuggestions = suggestions.filter(
                  (s) => !currentSkills.includes(s.toLowerCase())
                );

                if (missingSuggestions.length === 0) return null;

                return (
                  <div className="skills-suggestions-container" style={{ marginTop: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Suggested skills for {matchingKey} role:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {missingSuggestions.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          className="chip chip--add"
                          style={{ cursor: 'pointer', fontSize: '0.74rem', padding: '0.2rem 0.6rem', minHeight: 'auto', border: 0 }}
                          onClick={() => {
                            const current = (app.resumeData.skills || '')
                              .split(',')
                              .map((entry) => entry.trim())
                              .filter(Boolean);
                            if (!current.includes(skill)) {
                              app.handleResumeChange({
                                target: {
                                  name: 'skills',
                                  value: [...current, skill].join(', ')
                                }
                              });
                            }
                          }}
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </label>

            {/* Experience Builder */}
            <div className="section-builder">
              <div className="section-builder__header">
                <h4>Work Experience</h4>
                <button
                  type="button"
                  className="ghost-button ghost-button--small"
                  onClick={app.handleAddExperience}
                >
                  + Add
                </button>
              </div>
              {app.experience?.map((exp, idx) => (
                <div
                  key={idx}
                  className={`builder-card${
                    draggedItem?.type === 'experience' && draggedItem?.index === idx ? ' dragging' : ''
                  }${
                    dragOverItem?.type === 'experience' && dragOverItem?.index === idx ? ' drag-over' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, idx, 'experience')}
                  onDrop={(e) => handleDrop(e, idx, 'experience')}
                >
                  <div className="builder-card__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="drag-grip"
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx, 'experience')}
                        onDragEnd={handleDragEnd}
                        title="Drag to reorder"
                      >
                        ⋮⋮
                      </span>
                      <span>Experience #{idx + 1}</span>
                    </div>
                    <button
                      type="button"
                      className="danger-button-text"
                      onClick={() => app.handleRemoveExperience(idx)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid-2col">
                    <label>
                      Company
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => app.handleUpdateExperience(idx, 'company', e.target.value)}
                        placeholder="Company Name"
                      />
                    </label>
                    <label>
                      Role / Title
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => app.handleUpdateExperience(idx, 'role', e.target.value)}
                        placeholder="e.g. Software Engineer"
                      />
                    </label>
                  </div>
                  <div className="grid-3col">
                    <label>
                      Location
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => app.handleUpdateExperience(idx, 'location', e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                      />
                    </label>
                    <label>
                      Start Date
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => app.handleUpdateExperience(idx, 'startDate', e.target.value)}
                        placeholder="e.g. Jan 2022"
                      />
                    </label>
                    <label>
                      End Date
                      <input
                        type="text"
                        value={exp.endDate}
                        disabled={exp.currentlyWorking}
                        onChange={(e) => app.handleUpdateExperience(idx, 'endDate', e.target.value)}
                        placeholder="e.g. Dec 2023"
                      />
                    </label>
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={exp.currentlyWorking}
                      onChange={(e) => app.handleUpdateExperience(idx, 'currentlyWorking', e.target.checked)}
                    />
                    I currently work here
                  </label>
                  <label>
                    Description
                    <textarea
                      value={exp.description}
                      onChange={(e) => app.handleUpdateExperience(idx, 'description', e.target.value)}
                      rows={3}
                      placeholder="Describe key responsibilities and impact."
                    />
                  </label>
                </div>
              ))}
            </div>

            {/* Education Builder */}
            <div className="section-builder">
              <div className="section-builder__header">
                <h4>Education</h4>
                <button
                  type="button"
                  className="ghost-button ghost-button--small"
                  onClick={app.handleAddEducation}
                >
                  + Add
                </button>
              </div>
              {app.education?.map((edu, idx) => (
                <div
                  key={idx}
                  className={`builder-card${
                    draggedItem?.type === 'education' && draggedItem?.index === idx ? ' dragging' : ''
                  }${
                    dragOverItem?.type === 'education' && dragOverItem?.index === idx ? ' drag-over' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, idx, 'education')}
                  onDrop={(e) => handleDrop(e, idx, 'education')}
                >
                  <div className="builder-card__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="drag-grip"
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx, 'education')}
                        onDragEnd={handleDragEnd}
                        title="Drag to reorder"
                      >
                        ⋮⋮
                      </span>
                      <span>Education #{idx + 1}</span>
                    </div>
                    <button
                      type="button"
                      className="danger-button-text"
                      onClick={() => app.handleRemoveEducation(idx)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid-2col">
                    <label>
                      Institution
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => app.handleUpdateEducation(idx, 'institution', e.target.value)}
                        placeholder="e.g. Stanford University"
                      />
                    </label>
                    <label>
                      Degree
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => app.handleUpdateEducation(idx, 'degree', e.target.value)}
                        placeholder="e.g. Bachelor of Science"
                      />
                    </label>
                  </div>
                  <div className="grid-3col">
                    <label>
                      Field of Study
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => app.handleUpdateEducation(idx, 'fieldOfStudy', e.target.value)}
                        placeholder="e.g. Computer Science"
                      />
                    </label>
                    <label>
                      Start Date
                      <input
                        type="text"
                        value={edu.startDate}
                        onChange={(e) => app.handleUpdateEducation(idx, 'startDate', e.target.value)}
                        placeholder="e.g. 2018"
                      />
                    </label>
                    <label>
                      End Date
                      <input
                        type="text"
                        value={edu.endDate}
                        onChange={(e) => app.handleUpdateEducation(idx, 'endDate', e.target.value)}
                        placeholder="e.g. 2022"
                      />
                    </label>
                  </div>
                  <label>
                    Grade / GPA
                    <input
                      type="text"
                      value={edu.grade}
                      onChange={(e) => app.handleUpdateEducation(idx, 'grade', e.target.value)}
                      placeholder="e.g. 3.8/4.0"
                    />
                  </label>
                </div>
              ))}
            </div>

            {/* Projects Builder */}
            <div className="section-builder">
              <div className="section-builder__header">
                <h4>Projects</h4>
                <button
                  type="button"
                  className="ghost-button ghost-button--small"
                  onClick={app.handleAddProject}
                >
                  + Add
                </button>
              </div>
              {app.projects?.map((proj, idx) => (
                <div
                  key={idx}
                  className={`builder-card${
                    draggedItem?.type === 'projects' && draggedItem?.index === idx ? ' dragging' : ''
                  }${
                    dragOverItem?.type === 'projects' && dragOverItem?.index === idx ? ' drag-over' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, idx, 'projects')}
                  onDrop={(e) => handleDrop(e, idx, 'projects')}
                >
                  <div className="builder-card__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="drag-grip"
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx, 'projects')}
                        onDragEnd={handleDragEnd}
                        title="Drag to reorder"
                      >
                        ⋮⋮
                      </span>
                      <span>Project #{idx + 1}</span>
                    </div>
                    <button
                      type="button"
                      className="danger-button-text"
                      onClick={() => app.handleRemoveProject(idx)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid-2col">
                    <label>
                      Project Title
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => app.handleUpdateProject(idx, 'title', e.target.value)}
                        placeholder="Project Name"
                      />
                    </label>
                    <label>
                      Link
                      <input
                        type="text"
                        value={proj.link}
                        onChange={(e) => app.handleUpdateProject(idx, 'link', e.target.value)}
                        placeholder="https://..."
                      />
                    </label>
                  </div>
                  <label>
                    Technologies Used (comma separated)
                    <input
                      type="text"
                      value={proj.technologies}
                      onChange={(e) => app.handleUpdateProject(idx, 'technologies', e.target.value)}
                      placeholder="e.g. React, Express, MongoDB"
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      value={proj.description}
                      onChange={(e) => app.handleUpdateProject(idx, 'description', e.target.value)}
                      rows={2}
                      placeholder="Briefly describe the project's key highlights."
                    />
                  </label>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: '0.55rem' }}>
              <span style={{ color: '#d8e5fb', fontSize: '0.92rem' }}>Resume Template</span>
              <div className="template-switcher">
                {TEMPLATE_LIST.map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    className={`template-switcher__btn${app.template === tpl.key ? ' template-switcher__btn--active' : ''}`}
                    onClick={() => app.setTemplate(tpl.key)}
                  >
                    <span
                      className="template-switcher__swatch"
                      style={{ background: tpl.accent }}
                    />
                    <span className="template-switcher__name">{tpl.label}</span>
                    {app.template === tpl.key && (
                      <span className="template-switcher__tick">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <VersionHistorySection app={app} />
        </div>

        <article className="surface-card builder-preview">
          <div className="surface-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Live Preview</h3>
            <AtsGauge score={app.atsScore} size={48} />
          </div>
          <ResumePreview
            resumeData={app.resumeData}
            experience={app.experience}
            education={app.education}
            projects={app.projects}
            template={app.template}
            atsScore={app.atsScore}
          />
        </article>
      </section>
    </div>
  );
}
