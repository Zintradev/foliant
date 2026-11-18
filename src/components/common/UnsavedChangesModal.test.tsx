import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import UnsavedChangesModal from './UnsavedChangesModal';

describe('UnsavedChangesModal Component', () => {
  it('renders all three action buttons including Save & Exit when onSaveAndExit is provided', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const onSaveAndExit = vi.fn();

    render(
      <UnsavedChangesModal
        isOpen={true}
        onCancel={onCancel}
        onConfirm={onConfirm}
        onSaveAndExit={onSaveAndExit}
        cancelText="Permanecer aquí"
        confirmText="Descartar y Salir"
        saveAndExitText="Guardar y Salir"
      />
    );

    const cancelBtn = screen.getByText('Permanecer aquí');
    const discardBtn = screen.getByText('Descartar y Salir');
    const saveAndExitBtn = screen.getByText('Guardar y Salir');

    expect(cancelBtn).toBeInTheDocument();
    expect(discardBtn).toBeInTheDocument();
    expect(saveAndExitBtn).toBeInTheDocument();

    fireEvent.click(saveAndExitBtn);
    expect(onSaveAndExit).toHaveBeenCalledTimes(1);

    fireEvent.click(discardBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <UnsavedChangesModal
        isOpen={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
