import { describe, it, expect } from 'vitest';
import { countWords } from './textMetrics';

describe('countWords', () => {
  it('returns 0 for null, undefined, or empty strings', () => {
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\t  ')).toBe(0);
  });

  it('counts single and multiple words accurately', () => {
    expect(countWords('Hello')).toBe(1);
    expect(countWords('Hello world')).toBe(2);
    expect(countWords('  The   quick   brown   fox  ')).toBe(4);
    expect(countWords('First line.\nSecond line.\r\nThird line.')).toBe(6);
  });

  it('skips HTML tags transparently without counting them as words', () => {
    expect(countWords('<p>Hello world</p>')).toBe(2);
    expect(countWords('<p>This is <strong>bold</strong> and <em>italic</em> text.</p>')).toBe(6);
    expect(countWords('<h1>Title</h1><p><br /></p>')).toBe(1);
  });

  it('handles non-breaking spaces', () => {
    expect(countWords('Chapter\u00A0One')).toBe(2);
  });
});
