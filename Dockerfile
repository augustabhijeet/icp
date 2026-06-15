FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/ .
RUN npm install && npm run build

FROM python:3.11-slim
WORKDIR /app

# Install uv package manager
RUN pip install --no-cache-dir uv

# Copy backend requirements
COPY backend/requirements.txt backend/requirements.txt

# Install Python dependencies using uv
RUN uv pip install --system -r backend/requirements.txt

# Copy built frontend from previous stage
COPY --from=frontend-builder /frontend/dist frontend/dist

# Copy backend code
COPY backend/ backend/

# Serve frontend static files and backend API
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
