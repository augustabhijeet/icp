import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface UploadResult {
  id?: number;
  filename: string;
  classification: string;
  markdown: string;
  confidence?: number;
  extracted_data?: any;
  uploaded_at?: string;
}

function App() {
  const { isAuthenticated, username, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [history, setHistory] = useState<UploadResult[]>([]);
  const [status, setStatus] = useState('Ready to upload a PDF.');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated]);

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
      fetchHistory(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
      setStatus('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        if (result?.id === id) setResult(null);
        fetchHistory();
      } else {
        setError('Failed to delete document.');
      }
    } catch (err) {
      setError('Error connecting to server.');
    }
  };

  const fetchDocumentDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setStatus(`Viewing ${data.filename}`);
      } else {
        setError('Failed to fetch document details.');
      }
    } catch (err) {
      setError('Error connecting to server.');
    }
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (confidence === undefined) return '#888888';
    const value = confidence <= 1 ? confidence * 100 : confidence;
    if (value >= 80) return '#10b981'; 
    if (value >= 50) return '#f59e0b'; 
    return '#ef4444'; 
  };

  const renderValue = (value: any): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <ul className="data-list">
          {value.map((item, i) => (
            <li key={i}>{typeof item === 'object' ? renderNestedObject(item) : String(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof value === 'object' && value !== null) {
      return renderNestedObject(value);
    }
    return String(value);
  };

  const renderNestedObject = (obj: any): React.ReactNode => {
    return (
      <div className="nested-data">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="nested-row">
            <strong>{k}:</strong> {Array.isArray(v) ? v.join(', ') : String(v)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <header>
        <div className="header-content">
          <div className="header-title">
            <h1>Intelligent Content Processor</h1>
            <p>Upload a PDF. The backend will extract markdown layout and classify the document.</p>
          </div>
          {isAuthenticated && (
            <div className="header-user">
              <span className="username">{username}</span>
              <button onClick={logout} className="logout-button" data-testid="logout-button">
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="dashboard-layout">
        <aside className="history-sidebar">
          <h2>Upload History</h2>
          <div className="history-list">
            {history.length === 0 ? (
              <p className="no-history">No uploads yet.</p>
            ) : (
              history.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`history-item ${result?.id === doc.id ? 'active' : ''}`} 
                  onClick={() => doc.id && fetchDocumentDetails(doc.id)}
                >
                  <div className="history-info">
                    <span className="history-filename">{doc.filename}</span>
                    <span className="history-date">
                      {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      doc.id && handleDelete(doc.id); 
                    }}
                    title="Delete document"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="main-content">
          <section className="upload-panel">
            <label className="file-input-label">
              <span>Select PDF</span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} data-testid="file-input" />
            </label>
            <button onClick={handleUpload} disabled={!selectedFile || uploading} data-testid="upload-button">
              {uploading ? 'Processing…' : 'Upload & Analyze'}
            </button>
            <div className="status-bar">
              <strong>Status:</strong> {status}
            </div>
            {error && <div className="error-message" data-testid="error-message">{error}</div>}
          </section>

          <section className="results-placeholder">
            <h2>Results</h2>
            {result ? (
              <div className="results-content">
                <div className="result-summary">
                  <div className="result-item">
                    <strong>File:</strong> <span>{result.filename}</span>
                  </div>
                  <div className="result-item">
                    <strong>Classification:</strong>
                    <div className="classification-badge" style={{ borderColor: getConfidenceColor(result.confidence) }}>
                      {result.classification}
                      {result.confidence !== undefined && (
                        <span className="confidence-level">
                          {((result.confidence <= 1 ? result.confidence * 100 : result.confidence)).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {result.extracted_data && Object.keys(result.extracted_data).length > 0 && (
                  <div className="extracted-data-section">
                    <h3>Structured Data</h3>
                    <div className="extracted-data-grid">
                      {Object.entries(result.extracted_data).map(([key, value]) => (
                        <div key={key} className="data-row">
                          <span className="data-key">{key.replace(/_/g, ' ')}:</span>
                          <span className="data-value">{renderValue(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="markdown-preview">
                  <h3>Markdown Layout</h3>
                  <pre>{result.markdown}</pre>
                </div>
              </div>
            ) : (
              <div className="placeholder-content">
                <p>Upload a PDF or select from history to see results here</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
