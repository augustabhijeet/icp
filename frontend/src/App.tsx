import { useState } from 'react';

interface UploadResult {
  filename: string;
  classification: string;
  markdown: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [status, setStatus] = useState('Ready to upload a PDF.');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are allowed.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File must be 10 MB or smaller.';
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      setStatus('Ready to upload a PDF.');
      return;
    }
    const fileError = validateFile(file);
    if (fileError) {
      setError(fileError);
      setSelectedFile(null);
      setStatus('Select a valid PDF file.');
      return;
    }
    setSelectedFile(file);
    setStatus(`Ready to upload ${file.name}`);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose a PDF before uploading.');
      return;
    }

    setUploading(true);
    setError(null);
    setStatus('Uploading and processing...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || 'Upload failed.');
      }

      const payload = await response.json();
      setResult(payload);
      setStatus('Processing complete.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
      setStatus('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Intelligent Content Processor</h1>
        <p>Upload a PDF. The backend will extract markdown layout and classify the document.</p>
      </header>

      <main>
        <section className="upload-panel">
          <label className="file-input-label">
            <span>Select PDF</span>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
          </label>
          <button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? 'Processing…' : 'Upload & Analyze'}
          </button>
          <div className="status-bar">
            <strong>Status:</strong> {status}
          </div>
          {error && <div className="error-message">{error}</div>}
        </section>

        {result && (
          <section className="result-panel">
            <div className="result-summary">
              <div>
                <strong>File:</strong> {result.filename}
              </div>
              <div>
                <strong>Classification:</strong> {result.classification}
              </div>
            </div>
            <div className="markdown-preview">
              <h2>Extracted Markdown</h2>
              <pre>{result.markdown}</pre>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
