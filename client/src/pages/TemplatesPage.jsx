import React from 'react';
import { NavLink } from 'react-router-dom';
import ResumePreview from '../components/ResumePreview';
import { TEMPLATE_LIST } from '../templates';

export default function TemplatesPage({ app }) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Templates</span>
          <h2>Choose the look that fits your target role</h2>
          <p>Preview each layout, then switch directly into the resume builder with one click.</p>
        </div>
      </header>

      <section className="template-gallery">
        {TEMPLATE_LIST.map((tpl) => {
          const isActive = app.template === tpl.key;
          return (
            <article
              key={tpl.key}
              className={`template-gallery__card${isActive ? ' template-gallery__card--active' : ''}`}
            >
              {/* Live miniature preview */}
              <div className="template-thumb-wrap">
                <div className="template-thumb-scale">
                  <ResumePreview
                    resumeData={app.resumeData}
                    experience={app.experience}
                    education={app.education}
                    projects={app.projects}
                    template={tpl.key}
                    atsScore={app.atsScore}
                  />
                </div>
                {isActive && (
                  <div className="template-thumb-badge">Active</div>
                )}
              </div>

              {/* Card footer */}
              <div className="template-gallery__footer">
                <div>
                  <h3 className="template-gallery__name">{tpl.label}</h3>
                  <p className="template-gallery__tagline">{tpl.tagline}</p>
                </div>
                <div className="header-actions">
                  {!isActive ? (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => app.setTemplate(tpl.key)}
                    >
                      Use Template
                    </button>
                  ) : (
                    <NavLink to="/resume-builder" className="ghost-link">
                      Open Builder
                    </NavLink>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
