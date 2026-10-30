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

  it('navigates between Documentation, Controls, and Settings tabs and displays graph controls & layout tip', () => {
    render(
      <HelpGuideModal
        isOpen={true}
        onClose={vi.fn()}
        onStartTour={vi.fn()}
        language="es"
      />
    );

    // Default tab: Documentation
    expect(screen.getByText(/01 • Editor Inmersivo/i)).toBeInTheDocument();
    expect(screen.getByText(/Grafo de Personajes & Flechas Curvables/i)).toBeInTheDocument();
    expect(screen.getByText(/07 • Guardado y Tiempo de Autoguardado/i)).toBeInTheDocument();
    expect(screen.getByText(/colapsar un lado \(izquierdo o derecho\) y agrandar el panel opuesto/i)).toBeInTheDocument();

    // Switch to Controls & Shortcuts tab
    const controlsTabBtn = screen.getByRole('button', { name: /controles y atajos/i });
    fireEvent.click(controlsTabBtn);
    expect(screen.getByText(/Controles del Grafo de Personajes/i)).toBeInTheDocument();
    expect(screen.getByText(/Doblar flecha y mover enlace/i)).toBeInTheDocument();
    expect(screen.getByText(/Clic izquierdo y arrastrar etiqueta/i)).toBeInTheDocument();
    expect(screen.getByText(/Mover etiqueta a lo largo del enlace/i)).toBeInTheDocument();
    expect(screen.getByText(/Clic derecho mantenido sobre etiqueta/i)).toBeInTheDocument();
    expect(screen.getByText(/Restablecer curvatura/i)).toBeInTheDocument();
    expect(screen.getByText(/Deshacer en el grafo/i)).toBeInTheDocument();
    expect(screen.getByText(/Configurar tiempo de autoguardado/i)).toBeInTheDocument();
    expect(screen.getByText('Ctrl + S')).toBeInTheDocument();
    expect(screen.getByText('F1')).toBeInTheDocument();

    // Switch to Settings Guide tab
    const settingsTabBtn = screen.getByRole('button', { name: /guía de ajustes/i });
    fireEvent.click(settingsTabBtn);
    expect(screen.getByText(/Ajustes Generales/i)).toBeInTheDocument();
    expect(screen.getByText(/tiempo de espera del autoguardado/i)).toBeInTheDocument();
    expect(screen.getByText(/Tipografía y Confort de Lectura/i)).toBeInTheDocument();
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
