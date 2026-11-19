import { describe, it, expect, vi } from 'vitest';
import { processWebImage } from './useMoodboardStorage';

describe('processWebImage utility', () => {
  it('returns raw data URL for SVG images without rasterizing through canvas', async () => {
    const originalFileReader = window.FileReader;
    class MockFileReader {
      result: string | null = null;
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.result = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 5);
      }
    }
    window.FileReader = MockFileReader as any;

    try {
      const svgFile = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' });
      const result = await processWebImage(svgFile);
      expect(result).toBe('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
    } finally {
      window.FileReader = originalFileReader;
    }
  });

  it('resizes images exceeding 1200px width using canvas', async () => {
    const originalFileReader = window.FileReader;
    const originalImage = window.Image;
    const originalCreateElement = document.createElement.bind(document);

    class MockFileReader {
      result: string | null = null;
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.result = 'data:image/jpeg;base64,largeImageRaw';
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 5);
      }
    }
    window.FileReader = MockFileReader as any;

    const mockDrawImage = vi.fn();
    const mockToDataURL = vi.fn(() => 'data:image/jpeg;base64,resizedImageBase64_0.85');

    // Mock Image with dimensions 2400x1600 (> 1200)
    class MockImage {
      width = 2400;
      height = 1600;
      onload: ((e: any) => void) | null = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload(new Event('load'));
        }, 5);
      }
    }
    window.Image = MockImage as any;

    // Mock canvas context
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: (type: string) => {
            if (type === '2d') {
              return { drawImage: mockDrawImage };
            }
            return null;
          },
          toDataURL: mockToDataURL,
        } as any;
      }
      return originalCreateElement(tagName);
    });

    try {
      const file = new File(['dummy'], 'large_photo.jpg', { type: 'image/jpeg' });
      const result = await processWebImage(file, 1200, 0.85);

      expect(mockDrawImage).toHaveBeenCalledWith(
        expect.anything(),
        0,
        0,
        1200,
        800 // 1600 * (1200 / 2400)
      );
      expect(mockToDataURL).toHaveBeenCalledWith('image/jpeg', 0.85);
      expect(result).toBe('data:image/jpeg;base64,resizedImageBase64_0.85');
    } finally {
      window.FileReader = originalFileReader;
      window.Image = originalImage;
      vi.restoreAllMocks();
    }
  });

  it('keeps raw data URL without canvas scaling when image width is <= 1200px', async () => {
    const originalFileReader = window.FileReader;
    const originalImage = window.Image;

    class MockFileReader {
      result: string | null = null;
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.result = 'data:image/jpeg;base64,normalImageRaw';
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 5);
      }
    }
    window.FileReader = MockFileReader as any;

    // Mock Image with dimensions 800x600 (<= 1200)
    class MockImage {
      width = 800;
      height = 600;
      onload: ((e: any) => void) | null = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload(new Event('load'));
        }, 5);
      }
    }
    window.Image = MockImage as any;

    try {
      const file = new File(['dummy'], 'normal_photo.jpg', { type: 'image/jpeg' });
      const result = await processWebImage(file, 1200, 0.85);
      expect(result).toBe('data:image/jpeg;base64,normalImageRaw');
    } finally {
      window.FileReader = originalFileReader;
      window.Image = originalImage;
    }
  });
});
