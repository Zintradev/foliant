import { render, screen, fireEvent, act } from '@testing-library/react';
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

  it('strictly blocks advancing if the required action is incomplete', () => {
    render(
      <GuidedTour
        isOpen={true}
        onClose={vi.fn()}
        language="es"
        activeMainView="write"
      />
    );

    expect(screen.getByText(/Paso 1 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Acción pendiente/i)).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /siguiente/i });
    expect(nextBtn).toBeDisabled();

    // Trying to advance via ArrowRight does not proceed
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/Paso 1 de 6/i)).toBeInTheDocument();
  });

  it('renders interactive tour steps, responds to interactive events, minimizes, navigates, and shows Ko-fi on final step', () => {
    const onClose = vi.fn();
    const onSelectView = vi.fn();
    const onLoadDemoProject = vi.fn();

    render(
      <GuidedTour
        isOpen={true}
        onClose={onClose}
        language="es"
        activeMainView="write"
        onSelectView={onSelectView}
        onLoadDemoProject={onLoadDemoProject}
      />
    );

    // Initial step 1: Outline
    expect(screen.getByRole('region', { name: /interactive guided tour/i })).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/01 • Esquema: Crear tu primera escena/i)).toBeInTheDocument();
    expect(screen.getByText(/Acción pendiente/i)).toBeInTheDocument();

    // Ko-fi button should NOT be in early steps
    expect(screen.queryByRole('link', { name: /apoyar en ko-fi/i })).not.toBeInTheDocument();

    // Minimize and expand
    const minBtn = screen.getByLabelText(/minimize tour/i);
    fireEvent.click(minBtn);
    expect(screen.getByTitle(/expandir guía/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle(/expandir guía/i));
    expect(screen.getByText(/01 • Esquema: Crear tu primera escena/i)).toBeInTheDocument();

    // Complete Step 1 action: user creates a scene
    act(() => {
      window.dispatchEvent(new CustomEvent('foliant-tour-scene-created'));
    });

    // Step 1 marked done; user clicks Siguiente to proceed
    expect(screen.getByText(/Paso completado/i)).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: /siguiente/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Paso 2 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/02 • Reparto: Da vida a tus personajes/i)).toBeInTheDocument();

    // Previous step works to review past completed steps
    const prevBtn = screen.getByRole('button', { name: /anterior/i });
    fireEvent.click(prevBtn);
    expect(screen.getByText(/Paso 1 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Paso completado/i)).toBeInTheDocument();

    // Next step advances to step 2 again
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText(/Paso 2 de 6/i)).toBeInTheDocument();

    // Complete Step 2 action: user creates a character
    act(() => {
      window.dispatchEvent(new CustomEvent('foliant-tour-character-created'));
    });
    expect(screen.getByText(/Paso completado/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    // Reaches Step 3: Graph
    expect(screen.getByText(/Paso 3 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/03 • Grafo de Relaciones: Conecta el reparto/i)).toBeInTheDocument();

    // Complete Step 3 action: user moves link label pill
    act(() => {
      window.dispatchEvent(new CustomEvent('foliant-tour-graph-pill-moved'));
    });
    expect(screen.getByText(/Paso completado/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    // Reaches Step 4: Plots
    expect(screen.getByText(/Paso 4 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/04 • Tramas: Asocia personajes o capítulos/i)).toBeInTheDocument();

    // Complete Step 4 action: user assigns tag/character
    act(() => {
      window.dispatchEvent(new CustomEvent('foliant-tour-tag-assigned'));
    });
    expect(screen.getByText(/Paso completado/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    // Reaches Step 5: Timeline
    expect(screen.getByText(/Paso 5 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/05 • Cronología: Visualización espacial/i)).toBeInTheDocument();

    // Step 5 has explicit demo choice button
    const loadDemoBtn = screen.getByRole('button', { name: /cargar modelo de demostración/i });
    expect(loadDemoBtn).toBeInTheDocument();
    fireEvent.click(loadDemoBtn);
    expect(onLoadDemoProject).toHaveBeenCalled();

    // Progressed to final step 6
    expect(screen.getByText(/Paso 6 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/06 • Ajustes: Configuración de Guardado/i)).toBeInTheDocument();

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

  it('highlights storyline add & link controls on step 4 and settings menu on step 6 without highlighting editor', () => {
    // Setup dummy DOM elements
    const addBtn = document.createElement('button');
    addBtn.setAttribute('data-tour-id', 'storylines-add-btn');
    document.body.appendChild(addBtn);

    const fileMenuBtn = document.createElement('button');
    fileMenuBtn.setAttribute('data-tour-id', 'activity-bar-file-menu');
    document.body.appendChild(fileMenuBtn);

    const onHighlightViewChange = vi.fn();

    render(
      <GuidedTour
        isOpen={true}
        onClose={vi.fn()}
        language="es"
        activeMainView="write"
        onHighlightViewChange={onHighlightViewChange}
      />
    );

    // Fast-forward to step 4 (Plots)
    act(() => {
      window.dispatchEvent(new CustomEvent('foliant-tour-scene-created'));
    });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    act(() => {
      window.dispatchEvent(new CustomEvent('foliant-tour-character-created'));
    });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    act(() => {
      window.dispatchEvent(new CustomEvent('foliant-tour-graph-pill-moved'));
    });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    // On step 4: Plot add button has pulse class
    expect(screen.getByText(/Paso 4 de 6/i)).toBeInTheDocument();
    expect(addBtn.className).toContain('animate-pulse');

    // Advance to step 5 (Timeline) and then step 6 (Settings)
    act(() => {
      window.dispatchEvent(new CustomEvent('foliant-tour-tag-assigned'));
    });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText(/Paso 5 de 6/i)).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: /continuar/i });
    fireEvent.click(continueBtn);

    // On step 6: Settings step
    expect(screen.getByText(/Paso 6 de 6/i)).toBeInTheDocument();
    // It should highlight the file menu / settings button
    expect(fileMenuBtn.className).toContain('animate-pulse');
    // It should NOT request highlighting 'write' in ActivityBar
    expect(onHighlightViewChange).toHaveBeenLastCalledWith(null);

    // Cleanup
    document.body.removeChild(addBtn);
    document.body.removeChild(fileMenuBtn);
  });
});
