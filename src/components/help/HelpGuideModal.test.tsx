import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import HelpGuideModal from './HelpGuideModal';
import { KOFI_URL } from './KofiButton';

describe('HelpGuideModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <HelpGuideModal isOpen={false} onClose={vi.fn()} onStartTour={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog and triggers startTour callback when clicking tour button', () => {
    const onStartTour = vi.fn();
    const onClose = vi.fn();

    render(
      <HelpGuideModal
        isOpen={true}
        onClose={onClose}
        onStartTour={onStartTour}
        language="es"
      />
    );

    // Dialog title
    expect(screen.getByRole('dialog', { name: /ayuda y guía/i })).toBeInTheDocument();

    // Tour start button
    const tourBtn = screen.getByRole('button', { name: /iniciar tour guiado/i });
    expect(tourBtn).toBeInTheDocument();
    fireEvent.click(tourBtn);
    expect(onStartTour).toHaveBeenCalledTimes(1);

    // Ko-fi link is present and points to the right URL
    const kofiLink = screen.getByRole('link', { name: /apoyar en ko-fi/i });
    expect(kofiLink).toBeInTheDocument();
    expect(kofiLink).toHaveAttribute('href', KOFI_URL);
  });

  it('renders Controls and Shortcuts as the exclusive section with white titles without icons', () => {
    render(
      <HelpGuideModal
        isOpen={true}
        onClose={vi.fn()}
        onStartTour={vi.fn()}
        language="es"
      />
    );

    // No documentation or settings tabs
    expect(screen.queryByRole('button', { name: /documentación/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /guía de ajustes/i })).not.toBeInTheDocument();

    // Section headings are present and have text-white
    const graphHeading = screen.getByText(/Controles del Grafo de Personajes/i);
    expect(graphHeading).toBeInTheDocument();
    expect(graphHeading).toHaveClass('text-white');

    const projectHeading = screen.getByText(/Atajos Generales del Proyecto & Búsqueda/i);
    expect(projectHeading).toBeInTheDocument();
    expect(projectHeading).toHaveClass('text-white');

    const editorHeading = screen.getByText(/Atajos de Redacción en Editor & Símbolos/i);
    expect(editorHeading).toBeInTheDocument();
    expect(editorHeading).toHaveClass('text-white');

    // Controls items
    expect(screen.getByText(/Doblar flecha y mover enlace/i)).toBeInTheDocument();
    expect(screen.getByText(/Clic izquierdo \+ Arrastrar etiqueta/i)).toBeInTheDocument();
    expect(screen.getByText(/Mover etiqueta a lo largo del enlace/i)).toBeInTheDocument();
    expect(screen.getByText(/Clic derecho mantenido \+ Arrastrar/i)).toBeInTheDocument();
    expect(screen.getByText(/Restablecer curvatura/i)).toBeInTheDocument();
    expect(screen.getByText(/Deshacer en el grafo/i)).toBeInTheDocument();
    expect(screen.getByText(/Configurar tiempo de autoguardado/i)).toBeInTheDocument();
    expect(screen.getAllByText('Ctrl + S').length).toBeGreaterThan(0);
    expect(screen.getByText('F1')).toBeInTheDocument();

    // Notes shortcut
    expect(screen.getByText(/Guardar y finalizar edición de nota/i)).toBeInTheDocument();
    expect(screen.getByText('Ctrl + Enter')).toBeInTheDocument();

    // Layout tip
    expect(screen.getByText(/colapsar un lado \(izquierdo o derecho\) y agrandar el panel opuesto/i)).toBeInTheDocument();
  });

  it('closes modal when clicking close button', () => {
    const onClose = vi.fn();
    render(
      <HelpGuideModal
        isOpen={true}
        onClose={onClose}
        onStartTour={vi.fn()}
        language="en"
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close help/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
