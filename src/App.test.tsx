import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import App from './App';

// Mock Tauri core invoke function for the jsdom testing environment
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('App Component', () => {
  it('renders the sidebar with the Foliant application title', () => {
    render(<App />);

    // Verify that the "Foliant" brand heading appears in the document
    const titleElement = screen.getByText('Foliant');
    expect(titleElement).toBeInTheDocument();
  });
});
