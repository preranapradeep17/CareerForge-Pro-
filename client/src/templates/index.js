/**
 * Template Registry
 * Maps template key → React component.
 * Import this wherever a template needs to be resolved dynamically.
 */
import ClassicTemplate from './ClassicTemplate';
import ModernTemplate from './ModernTemplate';
import MinimalTemplate from './MinimalTemplate';

export const TEMPLATES = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
};

/** Ordered list for UI rendering (gallery, selectors). */
export const TEMPLATE_LIST = [
  {
    key: 'classic',
    label: 'Classic',
    tagline: 'Safe corporate style. ATS-optimised hierarchy.',
    accent: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #3b82f6 100%)',
  },
  {
    key: 'modern',
    label: 'Modern',
    tagline: 'Sidebar layout with teal colour accents.',
    accent: 'linear-gradient(135deg, #0f172a 0%, #0f766e 55%, #2dd4bf 100%)',
  },
  {
    key: 'minimal',
    label: 'Minimal',
    tagline: 'Clean typography. Zero gradients. Pure editorial.',
    accent: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  },
];
