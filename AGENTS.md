# Intelligent Content Processor Web Application

## Business Requirements
- Ability to upload a document
- Extract the content of the document with layout information in a markdown format
-- Ability to classify the document into one of the following:
-- Resume
-- Professional summary
-- Other

## Technical Requirements
- Use the OpenRouter API key in the .env file for LLM calls. Use the model google/gemma-4-31b-it:free from OpenRouter
- Only allow PDF documents to be uploaded
- Limit upload file size to 10 MB
- React frontend
- Python FastAPI backend, including serving the static NextJS site at /
- Everything packaged into a Docker container
- Use "uv" as the package manager for python in the Docker container
- Use OpenRouter for the AI calls. An OPENROUTER_API_KEY is in .env in the project root
- Use `openai/gpt-oss-120b` as the model
- Use SQLLite local database for the database, creating a new db if it doesn't exist
- Start and Stop server scripts for Mac, PC, Linux in scripts/

## Starting Point

A working MVP of the project with frontend and backend has been built and is already in frontend and backend folders. This is not yet designed for the Docker setup. It's a MVP demo without any persistence.

## Color Scheme

- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
4. When hitting issues, always identify root cause before trying a fix. Do not guess. Prove with evidence, then fix the root cause.

## Working documentation

All documents for planning and executing this project will be in the docs/ directory.
Please review the docs/PLAN.md document before proceeding.
