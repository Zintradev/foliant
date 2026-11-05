import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FirstRunPromptModal from './FirstRunPromptModal';

describe('FirstRunPromptModal', () => {
  it('renders all three action options including open existing project', () => {
    const onLoadDemo = vi.fn();
    const onStartEmpty = vi.fn();
    const onOpenExisting = vi.fn();

    render(
      <FirstRunPromptModal
        isOpen={true}
        onLoadDemo={onLoadDemo}
        onStartEmpty={onStartEmpty}
        onOpenExisting={onOpenExisting}
      />
    );

    expect(screen.getByText(/Load Demo Project|Cargar modelo de demostración/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Existing Project\.\.\.|Abrir proyecto existente\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/Start with Blank Project|Empezar con proyecto vacío/i)).toBeInTheDocument();

    const openExistingBtn = screen.getByText(/Open Existing Project\.\.\.|Abrir proyecto existente\.\.\./i);
    fireEvent.click(openExistingBtn);
    expect(onOpenExisting).toHaveBeenCalledTimes(1);
  });

  it('renders Manuskript import option and calls onImportManuskript on click', () => {
    const onLoadDemo = vi.fn();
    const onStartEmpty = vi.fn();
    const onImportManuskript = vi.fn();

    render(
      <FirstRunPromptModal
        isOpen={true}
        onLoadDemo={onLoadDemo}
        onStartEmpty={onStartEmpty}
        onImportManuskript={onImportManuskript}
      />
    );

    const importBtn = screen.getByText(/Import Manuskript Project|Importar Proyecto Manuskript/i);
    expect(importBtn).toBeInTheDocument();
    fireEvent.click(importBtn);
    expect(onImportManuskript).toHaveBeenCalledTimes(1);
  });

  it('renders close button and triggers onClose on click and Escape key', () => {
    const onLoadDemo = vi.fn();
    const onStartEmpty = vi.fn();
    const onClose = vi.fn();

    render(
      <FirstRunPromptModal
        isOpen={true}
        onLoadDemo={onLoadDemo}
        onStartEmpty={onStartEmpty}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close|Cerrar/i });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
