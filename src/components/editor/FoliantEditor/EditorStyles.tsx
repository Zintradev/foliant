import { memo } from 'react';

function EditorStylesComponent() {
  return (
    <style>{`
      /* Core Editor Typography & Layout */
      .foliant-editor-wrapper .tiptap {
        outline: none;
        min-height: 450px;
        line-height: 1.8;
      }

      /* High-Contrast Bold with Letter-Spacing Compensation */
      .foliant-editor-wrapper .tiptap strong,
      .foliant-editor-wrapper .tiptap b {
        font-weight: 700;
        color: #ffffff !important;
        letter-spacing: -0.015em;
        text-shadow: 0 0 1px rgba(255, 255, 255, 0.4);
      }

      /* Crisp Italic */
      .foliant-editor-wrapper .tiptap em,
      .foliant-editor-wrapper .tiptap i {
        font-style: italic;
        color: #f4f4f5;
      }

      /* Font Family Definitions */
      .foliant-font-serif .tiptap {
        font-family: Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
      }
      .foliant-font-garamond .tiptap {
        font-family: Garamond, 'EB Garamond', 'Baskerville', 'Times New Roman', serif;
      }
      .foliant-font-sans .tiptap {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      .foliant-font-humanist .tiptap {
        font-family: Verdana, Geneva, Tahoma, 'Trebuchet MS', sans-serif;
      }
      .foliant-font-mono .tiptap {
        font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
      }
      .foliant-font-bookman .tiptap {
        font-family: 'Book Antiqua', 'Bookman Old Style', 'Century Schoolbook', Georgia, serif;
      }

      /* Paragraphs & Headings */
      .foliant-editor-wrapper .tiptap p {
        margin-bottom: 0.75rem;
      }
      .foliant-editor-wrapper .tiptap h1 {
        font-size: 1.875rem;
        font-weight: 700;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        color: #f4f4f5;
        line-height: 1.25;
      }
      .foliant-editor-wrapper .tiptap h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
        color: #e4e4e7;
        line-height: 1.3;
      }
      .foliant-editor-wrapper .tiptap blockquote {
        border-left: 3px solid #52525b;
        padding-left: 1rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
        color: #a1a1aa;
        font-style: italic;
      }
      /* Horizontal Rule / Markdown Divider */
      .foliant-editor-wrapper .tiptap hr {
        border: none;
        border-top: 1px solid rgba(161, 161, 170, 0.28);
        margin: 1.75rem 0;
        cursor: pointer;
        transition: border-color 0.2s ease;
      }
      .foliant-editor-wrapper .tiptap hr:hover,
      .foliant-editor-wrapper .tiptap hr.ProseMirror-selectednode {
        border-top-color: rgba(161, 161, 170, 0.6);
      }
      .foliant-editor-wrapper .tiptap mark {
        padding: 0.1rem 0.25rem;
        border-radius: 0.125rem;
      }

      /* First-Line Indentation Rules */
      .foliant-indent-first-line .tiptap p {
        text-indent: 1.5rem;
        margin-bottom: 0.25rem;
      }
      .foliant-indent-first-line .tiptap h1,
      .foliant-indent-first-line .tiptap h2,
      .foliant-indent-first-line .tiptap h3,
      .foliant-indent-first-line .tiptap blockquote,
      .foliant-indent-first-line .tiptap blockquote p,
      .foliant-indent-first-line .tiptap ul p,
      .foliant-indent-first-line .tiptap ol p {
        text-indent: 0 !important;
      }
      .foliant-indent-first-line .tiptap p[style*="text-align: center"] {
        text-indent: 0 !important;
      }
    `}</style>
  );
}

export default memo(EditorStylesComponent);
