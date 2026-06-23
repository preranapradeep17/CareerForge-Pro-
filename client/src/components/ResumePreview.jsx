import React, { useRef, useState, useEffect } from 'react';
import { TEMPLATES } from '../templates';

const highlightText = (text, skillsStr) => {
  if (!text) return '';
  if (!skillsStr) return text;

  const skills = skillsStr
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  if (skills.length === 0) return text;

  const escapedSkills = skills.map((s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedSkills.join('|')})\\b`, 'gi');

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="keyword-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function ResumePreview({ resumeData, experience = [], education = [], projects = [], template, atsScore }) {
  const TemplateComponent = TEMPLATES[template] ?? TEMPLATES.classic;

  const highlightedSummary = typeof resumeData.summary === 'string'
    ? highlightText(resumeData.summary, resumeData.skills)
    : resumeData.summary;

  const mixedResumeData = {
    ...resumeData,
    summary: highlightedSummary,
    experience,
    education,
    projects,
  };

  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);
  const targetWidth = 800; // Design width for the A4-like preview

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const updateScaleAndHeight = () => {
      const parentWidth = outer.getBoundingClientRect().width;
      if (parentWidth > 0) {
        const newScale = parentWidth / targetWidth;
        setScale(newScale);
        setHeight(inner.offsetHeight * newScale);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScaleAndHeight();
    });

    resizeObserver.observe(outer);
    resizeObserver.observe(inner);

    updateScaleAndHeight();

    return () => {
      resizeObserver.disconnect();
    };
  }, [targetWidth, template, resumeData, experience?.length, education?.length, projects?.length]);

  return (
    <div
      ref={outerRef}
      className="resume-preview-outer-container"
      style={{
        width: '100%',
        overflow: 'hidden',
        height: height > 0 ? `${height}px` : 'auto',
        transition: 'height 0.2s ease-out',
        position: 'relative',
      }}
    >
      <div
        ref={innerRef}
        className="resume-preview-inner-container"
        style={{
          width: `${targetWidth}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <TemplateComponent resumeData={mixedResumeData} atsScore={atsScore} />
      </div>
    </div>
  );
}

