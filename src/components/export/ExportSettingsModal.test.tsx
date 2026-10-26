import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ExportSettingsModal from './ExportSettingsModal';
import { DEFAULT_PROJECT } from '../../data/mockProject';
import { FoliantProject } from '../../types/project';

describe('ExportSettingsModal Component', () => {
  let mockProject: FoliantProject;
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnExport: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProject = JSON.parse(JSON.stringify(DEFAULT_PROJECT));
    mockOnClose = vi.fn();
    mockOnExport = vi.fn();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ExportSettingsModal
        isOpen={false}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when open with default pre-filled values', () => {
    render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Export to EPUB')).toBeInTheDocument();
    expect(screen.getByText('Metadata & Cover')).toBeInTheDocument();
    expect(screen.getByText('Content Selection')).toBeInTheDocument();

    // Title and author pre-filled
    const titleInput = screen.getByDisplayValue(mockProject.title);
    expect(titleInput).toBeInTheDocument();

    const authorInput = screen.getByPlaceholderText('e.g. Jane Doe');
    expect(authorInput).toBeInTheDocument();
  });

  it('modifies metadata fields (title, author, publisher, language, profile, visual TOC)', () => {
    render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
      />
    );

    // Edit Title
    const titleInput = screen.getByDisplayValue(mockProject.title);
    fireEvent.change(titleInput, { target: { value: 'New Epic Title' } });
    expect(titleInput).toHaveValue('New Epic Title');

    // Edit Author
    const authorInput = screen.getByPlaceholderText('e.g. Jane Doe');
    fireEvent.change(authorInput, { target: { value: 'Brandon S.' } });
    expect(authorInput).toHaveValue('Brandon S.');

    // Edit Publisher
    const publisherInput = screen.getByPlaceholderText('e.g. Acme Publishing · 2026');
    fireEvent.change(publisherInput, { target: { value: 'Tor Books · 2026' } });
    expect(publisherInput).toHaveValue('Tor Books · 2026');

    // Edit Language
    const languageSelect = screen.getByDisplayValue('Español (es)');
    fireEvent.change(languageSelect, { target: { value: 'en' } });
    expect(languageSelect).toHaveValue('en');

    // Edit Destination Profile
    const profileSelect = screen.getByDisplayValue(/Ecosistema Amazon/i);
    fireEvent.change(profileSelect, { target: { value: 'standard' } });
    expect(profileSelect).toHaveValue('standard');

    // Toggle Visual TOC checkbox
    const visualTocCheckbox = screen.getByRole('checkbox', {
      name: /Incluir página de Índice visual/i,
    });
    expect(visualTocCheckbox).toBeChecked();
    fireEvent.click(visualTocCheckbox);
    expect(visualTocCheckbox).not.toBeChecked();
  });

  it('handles cover image upload, rejection of non-image files, drag-and-drop, and cover removal', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock FileReader
    class MockFileReader {
      onload: ((e: any) => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mockdata' } });
          }
        }, 10);
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
      />
    );

    // 1. Attempt non-image upload -> should trigger alert
    const dropArea = screen.getByText('Click or drag and drop your book cover here').parentElement!;
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' });

    fireEvent.dragOver(dropArea);
    fireEvent.dragLeave(dropArea);
    fireEvent.drop(dropArea, { dataTransfer: { files: [textFile] } });

    expect(alertSpy).toHaveBeenCalledWith('Please select an image file (JPEG, PNG, WEBP, etc.)');

    // 2. Successful image upload via drop
    const imageFile = new File(['image'], 'cover.jpg', { type: 'image/jpeg' });
    fireEvent.drop(dropArea, { dataTransfer: { files: [imageFile] } });

    await waitFor(() => {
      expect(screen.getByText('Cover Ready')).toBeInTheDocument();
      expect(screen.getByText('cover.jpg')).toBeInTheDocument();
    });

    // 3. Remove cover
    const removeBtn = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('Cover Ready')).not.toBeInTheDocument();
    expect(screen.getByText('Click or drag and drop your book cover here')).toBeInTheDocument();
  });

  it('switches to Content tab and toggles chapter formatting', () => {
    render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
      />
    );

    fireEvent.click(screen.getByText('Content Selection'));
    expect(screen.getByText('Chapter Formatting')).toBeInTheDocument();

    const formatSelect = screen.getByDisplayValue(/Treat top Folders as Chapters/i);
    fireEvent.change(formatSelect, { target: { value: 'sub-folders' } });
    expect(formatSelect).toHaveValue('sub-folders');

    fireEvent.change(formatSelect, { target: { value: 'flatten' } });
    expect(formatSelect).toHaveValue('flatten');
  });

  it('handles folder collapse/expand and expand all/collapse all in Content tab', () => {
    render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
      />
    );

    fireEvent.click(screen.getByText('Content Selection'));

    // Scene in Act I should be visible initially
    expect(screen.getByText(mockProject.chapters[1].title)).toBeInTheDocument();

    // Collapse Act I folder
    const collapseFolderBtn = screen.getAllByTitle('Collapse folder')[0];
    fireEvent.click(collapseFolderBtn);

    // Scene should now be hidden
    expect(screen.queryByText(mockProject.chapters[1].title)).not.toBeInTheDocument();

    // Expand Act I folder again
    const expandFolderBtn = screen.getByTitle('Expand folder');
    fireEvent.click(expandFolderBtn);
    expect(screen.getByText(mockProject.chapters[1].title)).toBeInTheDocument();

    // Toggle Collapse All / Expand All
    const toggleAllBtn = screen.getByRole('button', { name: /Collapse All/i });
    fireEvent.click(toggleAllBtn);

    // Now button should say Expand All
    expect(screen.getByRole('button', { name: /Expand All/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Expand All/i }));
    expect(screen.getByRole('button', { name: /Collapse All/i })).toBeInTheDocument();
  });

  it('handles Select All, Deselect All, and individual node selections', () => {
    render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
      />
    );

    fireEvent.click(screen.getByText('Content Selection'));

    // Deselect All
    fireEvent.click(screen.getByText('Deselect All'));
    expect(screen.getByText(/0 \//)).toBeInTheDocument();

    // Select All
    fireEvent.click(screen.getByText('Select All'));
    expect(screen.queryByText(/0 \//)).not.toBeInTheDocument();

    // Toggle single scene node
    const firstSceneTitle = screen.getByText(mockProject.chapters[1].title);
    fireEvent.click(firstSceneTitle);

    // Toggle folder node (toggling folder deselects all descendants)
    const firstFolderTitle = screen.getByText(mockProject.chapters[0].title);
    fireEvent.click(firstFolderTitle); // deselect folder & children
    fireEvent.click(firstFolderTitle); // re-select folder & children
  });

  it('renders gracefully when project has no chapters', () => {
    const emptyProject: FoliantProject = {
      ...mockProject,
      chapters: [],
    };

    render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={emptyProject}
        onExport={mockOnExport}
      />
    );

    fireEvent.click(screen.getByText('Content Selection'));
    expect(
      screen.getByText('No chapters or scenes found in this project.')
    ).toBeInTheDocument();
  });

  it('submits the form calling onExport with resolved options', async () => {
    render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Export EPUB/i });
    fireEvent.click(submitBtn);

    expect(mockOnExport).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockProject.title,
        language: 'es',
        profile: 'amazon',
        includeVisualToc: true,
        chapterFormatting: 'top-folders',
      })
    );
  });

  it('guards against submission when no scenes are selected or isExporting is true', () => {
    const { rerender } = render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
        isExporting={true}
      />
    );

    // When isExporting is true, submit button is disabled
    expect(screen.getByRole('button', { name: /Exporting EPUB.../i })).toBeDisabled();

    // Attempting submit does not call onExport
    fireEvent.submit(screen.getByRole('button', { name: /Exporting EPUB.../i }).closest('form')!);
    expect(mockOnExport).not.toHaveBeenCalled();

    // Rerender with 0 scenes selected
    rerender(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
        isExporting={false}
      />
    );

    fireEvent.click(screen.getByText('Content Selection'));
    fireEvent.click(screen.getByText('Deselect All'));

    const exportBtn = screen.getByRole('button', { name: /Export EPUB/i });
    expect(exportBtn).toBeDisabled();

    fireEvent.submit(exportBtn.closest('form')!);
    expect(mockOnExport).not.toHaveBeenCalled();
  });

  it('handles closing via X button, Cancel button, and Escape key', () => {
    render(
      <ExportSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        project={mockProject}
        onExport={mockOnExport}
      />
    );

    // Cancel button
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(2);

    // Close button (X)
    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(3);
  });
});
