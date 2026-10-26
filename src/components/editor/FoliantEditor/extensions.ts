import Underline from '@tiptap/extension-underline';
import { Mark } from '@tiptap/react';

// Custom Colored Underline Extension
export const CustomUnderline = Underline.extend({
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el) => el.style.textDecorationColor || null,
        renderHTML: (attrs) => {
          if (!attrs.color) return {};
          return {
            style: `text-decoration: underline; text-decoration-color: ${attrs.color};`,
          };
        },
      },
    };
  },
});

// Custom Font Size Extension
export const FontSize = Mark.create({
  name: 'fontSize',

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.size) return {};
          return {
            style: `font-size: ${attributes.size}; line-height: 1.35;`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return el.style.fontSize ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

// Color palettes for Underline & Highlight
export const UNDERLINE_COLORS = [
  { hex: '#ef4444', name: 'Coral Red' },
  { hex: '#f59e0b', name: 'Amber Orange' },
  { hex: '#eab308', name: 'Bright Yellow' },
  { hex: '#10b981', name: 'Emerald Green' },
  { hex: '#06b6d4', name: 'Cyan Blue' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#ffffff', name: 'White' },
];

export const HIGHLIGHT_COLORS = [
  { hex: '#fef08a', name: 'Yellow' },
  { hex: '#a7f3d0', name: 'Emerald' },
  { hex: '#a5f3fc', name: 'Cyan' },
  { hex: '#fbcfe8', name: 'Rose' },
  { hex: '#fed7aa', name: 'Orange' },
  { hex: '#e9d5ff', name: 'Lavender' },
];
