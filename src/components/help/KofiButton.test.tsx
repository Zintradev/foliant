import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import KofiButton, { KOFI_URL } from './KofiButton';

describe('KofiButton Component', () => {
  it('renders link pointing to ko-fi.com/zintradev', () => {
    render(<KofiButton label="Apoyar en Ko-fi" />);
    const link = screen.getByRole('link', { name: /apoyar en ko-fi/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', KOFI_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders in compact mode with icon only', () => {
    render(<KofiButton compact title="Compact Kofi" />);
    const link = screen.getByRole('link', { name: /compact kofi/i });
    expect(link).toBeInTheDocument();
    expect(screen.queryByText('Apoyar en Ko-fi')).not.toBeInTheDocument();
  });
});

