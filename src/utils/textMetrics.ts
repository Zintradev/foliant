/**
 * @file textMetrics.ts
 * @description High-performance zero-allocation text and word count measurement routines.
 *
 * ## Performance Decision:
 * Standard naive word counting in JavaScript using `str.trim().split(/\s+/).length`
 * forces the V8 engine to allocate an array containing thousands or tens of thousands of string
 * objects on the heap for every scene on every keystroke. When typing at 60-120 WPM, this triggers
 * constant Garbage Collection (GC) sweeps, leading to frame drops and typing stutter.
 *
 * This scanner runs in single-pass O(N) using `charCodeAt()`, allocating zero heap objects,
 * while transparently skipping inline HTML/XHTML tags without intermediate string copies.
 */

/**
 * Counts words in a string in a single O(N) pass without heap allocations.
 * Automatically skips HTML/XML tags (<...>) and treats contiguous whitespace characters
 * (spaces, tabs, newlines, carriage returns) as token delimiters.
 *
 * @param text The text or HTML string to count
 * @returns The total number of words (0 if empty or whitespace-only)
 */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  let count = 0;
  let inWord = false;
  let inTag = false;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);

    // Fast-path HTML tag delimiter handling: <...>
    if (code === 60 /* '<' */) {
      inTag = true;
      inWord = false;
      continue;
    }
    if (code === 62 /* '>' */) {
      inTag = false;
      continue;
    }
    if (inTag) {
      continue;
    }

    // Standard ASCII whitespace:
    // \t (9), \n (10), \v (11), \f (12), \r (13), space (32)
    // Non-breaking space \u00A0 is 160
    if (code <= 32 || code === 160) {
      inWord = false;
    } else if (!inWord) {
      inWord = true;
      count++;
    }
  }

  return count;
}
