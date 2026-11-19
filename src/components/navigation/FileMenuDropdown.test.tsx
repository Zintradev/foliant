import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FileMenuDropdown from './FileMenuDropdown';

describe('FileMenuDropdown Component', () => {
  it('renders menu items including Help & Guide and Ko-fi option', () => {
    const onOpenHelpGuide = vi.fn();
    const onClose = vi.fn();

    render(
      <FileMenuDropdown
        onClose={onClose}
        onOpenHelpGuide={onOpenHelpGuide}
        language="es"
      />
    );

    // Help & Guide button
    const helpBtn = screen.getByRole('button', { name: /ayuda y guía/i });
    expect(helpBtn).toBeInTheDocument();
    fireEvent.click(helpBtn);
    expect(onOpenHelpGuide).toHaveBeenCalled();

    // Ko-fi menu button is present
    const kofiBtn = screen.getByRole('button', { name: /apoyar en ko-fi/i });
    expect(kofiBtn).toBeInTheDocument();
  });

  it('shows "Volver a la portada" only when isWeb is true', () => {
    const { rerender } = render(
      <FileMenuDropdown onClose={vi.fn()} isWeb={true} language="es" />
    );

    expect(screen.getByText(/volver a la portada/i)).toBeInTheDocument();

    // Rerender as local desktop app (isWeb = false)
    rerender(<FileMenuDropdown onClose={vi.fn()} isWeb={false} language="es" />);

    expect(screen.queryByText(/volver a la portada/i)).not.toBeInTheDocument();
  });

  it('renders "Others" section header and allows editing project metadata and EPUB options', () => {
    const onExportEpub = vi.fn();
    const onClose = vi.fn();

    render(
      <FileMenuDropdown
        onClose={onClose}
        onExportEpub={onExportEpub}
        onOpenSearch={vi.fn()}
        language="es"
      />
    );

    // "Otros" section header
    expect(screen.getByText('Otros')).toBeInTheDocument();

    // Project details button
    const metadataBtn = screen.getByRole('button', { name: /detalles del proyecto/i });
    expect(metadataBtn).toBeInTheDocument();
    fireEvent.click(metadataBtn);
    expect(onExportEpub).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

