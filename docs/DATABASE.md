# Database Design Documentation

## Overview
The Intelligent Content Processor uses a local **SQLite** database to persist user information, document metadata, and upload history. This ensures that users can access their previous uploads and results across sessions.

## Schema Design

### 1. `users`
Stores user credentials and metadata.
- `id`: Primary key.
- `username`: Unique identifier for login.
- `password_hash`: Securely hashed password.
- `created_at`: Timestamp of user creation.

### 2. `documents`
Stores the core data for each uploaded PDF.
- `id`: Primary key.
- `user_id`: Foreign key linking to the owner.
- `filename`: Original name of the uploaded file.
- `classification`: AI-determined category (Resume, Professional Summary, Other).
- `confidence`: AI confidence score (0.0 to 1.0).
- `extracted_data`: JSON field containing structured key-value pairs (e.g., name, skills).
- `markdown`: Full markdown representation of the document layout.
- `uploaded_at`: Timestamp of upload.

### 3. `upload_history`
Tracks actions related to documents (upload, delete).
- `id`: Primary key.
- `user_id`: Foreign key.
- `document_id`: Foreign key.
- `action`: The action performed (e.g., 'UPLOAD', 'DELETE').
- `timestamp`: When the action occurred.

## Relationships
- One **User** can have many **Documents** (1:N).
- One **User** can have many **History Entries** (1:N).
- One **Document** can have many **History Entries** (1:N).

## Design Decisions
- **SQLite:** Chosen for its zero-configuration setup and file-based persistence, ideal for this single-container application.
- **JSON for Extraction:** Using a JSON field for `extracted_data` allows the AI to return varied schemas based on document type (e.g., Resume vs. Professional Summary) without requiring schema migrations.
- **Confidence Storage:** Storing confidence as a real number enables frontend logic for color-coding (e.g., < 0.8 is yellow).
- **History Table:** Separating history from the documents table allows for auditing actions (like when a document was deleted) and supports potential future features like versioning.
