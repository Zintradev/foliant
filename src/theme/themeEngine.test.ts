import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, applyUIStyle } from './themeEngine';

describe('themeEngine and UIStyle', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-ui-style');
    document.documentElement.style.cssText = '';
  });

  it('sets data-ui-style attribute and CSS variables for modern style', () => {
    applyUIStyle('modern');
    expect(document.documentElement.getAttribute('data-ui-style')).toBe('modern');
    expect(document.documentElement.style.getPropertyValue('--border-radius')).toBe('0.375rem');
    expect(document.documentElement.style.getPropertyValue('--border-width')).toBe('1px');
  });

  it('sets data-ui-style attribute and CSS variables for editorial style', () => {
    applyUIStyle('editorial');
    expect(document.documentElement.getAttribute('data-ui-style')).toBe('editorial');
    expect(document.documentElement.style.getPropertyValue('--border-radius')).toBe('2px');
    expect(document.documentElement.style.getPropertyValue('--shadow-sm')).toBe('none');
    expect(document.documentElement.style.getPropertyValue('--font-heading')).toContain('Georgia');
  });

  it('sets data-ui-style attribute and CSS variables for classic style', () => {
    applyUIStyle('classic');
    expect(document.documentElement.getAttribute('data-ui-style')).toBe('classic');
    expect(document.documentElement.style.getPropertyValue('--border-radius')).toBe('0px');
    expect(document.documentElement.style.getPropertyValue('--border-width')).toBe('1px');
    expect(document.documentElement.style.getPropertyValue('--font-heading')).toContain('Georgia');
  });

  it('sets data-ui-style attribute and CSS variables for classic-clean style', () => {
    applyUIStyle('classic-clean');
    expect(document.documentElement.getAttribute('data-ui-style')).toBe('classic-clean');
    expect(document.documentElement.style.getPropertyValue('--border-radius')).toBe('0px');
    expect(document.documentElement.style.getPropertyValue('--border-width')).toBe('1px');
    expect(document.documentElement.style.getPropertyValue('--font-heading')).toContain('Georgia');
  });

  it('falls back to modern if invalid uiStyle is passed', () => {
    // @ts-expect-error Testing invalid fallback
    applyUIStyle('unknown-style');
    expect(document.documentElement.getAttribute('data-ui-style')).toBe('modern');
  });

  it('applies uiStyle alongside themeMode through applyTheme', () => {
    applyTheme('dark', undefined, 'editorial');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-ui-style')).toBe('editorial');
    expect(document.documentElement.style.getPropertyValue('--border-radius')).toBe('2px');

    applyTheme('light', undefined, 'classic');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.getAttribute('data-ui-style')).toBe('classic');
    expect(document.documentElement.style.getPropertyValue('--border-radius')).toBe('0px');
  });
});
