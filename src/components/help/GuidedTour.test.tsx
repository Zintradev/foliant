import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import GuidedTour from './GuidedTour';

describe('GuidedTour Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <GuidedTour isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders tour steps, navigates between workspaces, minimizes, and shows Ko-fi only on final step', () => {
    const onClose = vi.fn();
    const onSelectView = vi.fn();

    render(
      <GuidedTour
        isOpen={true}
        onClose={onClose}
        language="es"
        onSelectView={onSelectView}
      />
    );

    // Initial step 1: Editor
    expect(screen.getByRole('region', { name: /interactive guided tour/i })).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 12/i)).toBeInTheDocument();
    expect(screen.getByText(/01 • Editor de Escritura Inmersivo/i)).toBeInTheDocument();

    // Ko-fi button should NOT be in early steps
    expect(screen.queryByRole('link', { name: /apoyar en ko-fi/i })).not.toBeInTheDocument();

    // Next step: File Menu
    const nextBtn = screen.getByRole('button', { name: /siguiente/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Paso 2 de 12/i)).toBeInTheDocument();
    expect(screen.getByText(/02 • Menú de Proyecto & Transferencia/i)).toBeInTheDocument();

    // Previous step
    const prevBtn = screen.getByRole('button', { name: /anterior/i });
    fireEvent.click(prevBtn);
    expect(screen.getByText(/Paso 1 de 12/i)).toBeInTheDocument();

    // Minimize and expand
    const minBtn = screen.getByLabelText(/minimize tour/i);
    fireEvent.click(minBtn);
    expect(screen.getByTitle(/expandir guía/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle(/expandir guía/i));
    expect(screen.getByText(/01 • Editor de Escritura Inmersivo/i)).toBeInTheDocument();

    // Jump to last step (12) via dot
    const stepDots = screen.getAllByLabelText(/go to step/i);
    expect(stepDots.length).toBe(12);
    fireEvent.click(stepDots[11]);

    expect(screen.getByText(/Paso 12 de 12/i)).toBeInTheDocument();
    expect(screen.getByText(/12 • Ajustes del Estudio & Finalización/i)).toBeInTheDocument();

    // Ko-fi button MUST be present on final step, and should not have a tooltip title
    const kofiLink = screen.getByRole('link', { name: /apoyar en ko-fi/i });
    expect(kofiLink).toBeInTheDocument();
    expect(kofiLink).not.toHaveAttribute('title');

    // Finish button closes tour
    const finishBtn = screen.getByRole('button', { name: /finalizar/i });
    fireEvent.click(finishBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when pressing Escape key', () => {
    const onClose = vi.fn();
    render(<GuidedTour isOpen={true} onClose={onClose} language="en" />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('advances with ArrowRight key', () => {
    render(<GuidedTour isOpen={true} onClose={vi.fn()} language="es" />);

    expect(screen.getByText(/Paso 1 de 12/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/Paso 2 de 12/i)).toBeInTheDocument();
  });
});
