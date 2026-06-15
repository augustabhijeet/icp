import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './useAuth';
import App from './App';

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn());

// Helper function to render App with AuthProvider
function renderWithAuth(component: React.ReactElement) {
  return render(<AuthProvider>{component}</AuthProvider>);
}

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default URL-aware mock
    (fetch as any).mockImplementation((url: string) => {
      if (url === '/api/documents') {
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });
  });

  describe('Rendering', () => {
    it('should render the app shell with header', async () => {
      renderWithAuth(<App />);
      expect(screen.getByText('Intelligent Content Processor')).toBeInTheDocument();
      expect(screen.getAllByText(/Upload a PDF/)[0]).toBeInTheDocument();
    });

    it('should render upload panel', () => {
      renderWithAuth(<App />);
      expect(screen.getByText('Select PDF')).toBeInTheDocument();
      expect(screen.getByTestId('upload-button')).toBeInTheDocument();
    });

    it('should render results placeholder initially', () => {
      renderWithAuth(<App />);
      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('Upload a PDF or select from history to see results here')).toBeInTheDocument();
    });

    it('should render status bar', () => {
      renderWithAuth(<App />);
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Ready to upload a PDF.')).toBeInTheDocument();
    });

    it('should render history sidebar', () => {
      renderWithAuth(<App />);
      expect(screen.getByText('Upload History')).toBeInTheDocument();
      expect(screen.getByText('No uploads yet.')).toBeInTheDocument();
    });
  });

  describe('File Input Handling', () => {
    it('should update status when file is selected', async () => {
      renderWithAuth(<App />);
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await userEvent.upload(fileInput, file);

      expect(screen.getByText('Ready to upload test.pdf')).toBeInTheDocument();
    });

    it('should reject non-PDF files', async () => {
      renderWithAuth(<App />);
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText('Only PDF files are allowed.')).toBeInTheDocument();
      expect(screen.getByText('Select a valid PDF file.')).toBeInTheDocument();
    });

    it('should reject files larger than 10MB', async () => {
      renderWithAuth(<App />);
      const fileInput = screen.getByTestId('file-input');
      const largeData = new Uint8Array(11 * 1024 * 1024);
      const file = new File([largeData], 'large.pdf', { type: 'application/pdf' });

      await userEvent.upload(fileInput, file);

      expect(screen.getByText('File must be 10 MB or smaller.')).toBeInTheDocument();
    });

    it('should clear file when no file selected', async () => {
      renderWithAuth(<App />);
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await userEvent.upload(fileInput, file);
      expect(screen.getByText('Ready to upload test.pdf')).toBeInTheDocument();

      // Clear file
      fireEvent.change(fileInput, { target: { files: [] } });
      expect(screen.getByText('Ready to upload a PDF.')).toBeInTheDocument();
    });
  });

  describe('Upload Button', () => {
    it('should be disabled when no file is selected', () => {
      renderWithAuth(<App />);
      const button = screen.getByTestId('upload-button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should be enabled when file is selected', async () => {
      renderWithAuth(<App />);
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await userEvent.upload(fileInput, file);

      const button = screen.getByTestId('upload-button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });
  });

  describe('Upload Submission', () => {
    it('should call fetch when uploading', async () => {
      const mockFetch = vi.mocked(fetch as any);
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/documents') return Promise.resolve({ ok: true, json: async () => [] });
        if (url === '/api/upload') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 1,
              filename: 'test.pdf',
              classification: 'Resume',
              markdown: '# Test',
              confidence: 0.95,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      renderWithAuth(<App />);
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await userEvent.upload(fileInput, file);

      const button = screen.getByTestId('upload-button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('should display results after successful upload', async () => {
      const mockFetch = vi.mocked(fetch as any);
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/documents') return Promise.resolve({ ok: true, json: async () => [] });
        if (url === '/api/upload') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 1,
              filename: 'test.pdf',
              classification: 'Resume',
              markdown: '# Test Markdown',
              confidence: 0.85,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      renderWithAuth(<App />);
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await userEvent.upload(fileInput, file);

      const button = screen.getByTestId('upload-button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
        expect(screen.getByText('Resume')).toBeInTheDocument();
        expect(screen.getByText('# Test Markdown')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
      });
    });

    it('should show error message on failed upload', async () => {
      const mockFetch = vi.mocked(fetch as any);
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/documents') return Promise.resolve({ ok: true, json: async () => [] });
        if (url === '/api/upload') {
          return Promise.resolve({
            ok: false,
            json: async () => ({ detail: 'Upload failed' }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      renderWithAuth(<App />);
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await userEvent.upload(fileInput, file);

      const button = screen.getByTestId('upload-button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });
    });
  });

  describe('Confidence Level Display', () => {
    it('should display confidence level when present', async () => {
      const mockFetch = vi.mocked(fetch as any);
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/documents') return Promise.resolve({ ok: true, json: async () => [] });
        if (url === '/api/upload') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 1,
              filename: 'test.pdf',
              classification: 'Resume',
              markdown: '# Test',
              confidence: 0.92,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      renderWithAuth(<App />);
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await userEvent.upload(fileInput, file);

      const button = screen.getByTestId('upload-button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('92%')).toBeInTheDocument();
      });
    });
  });
});
