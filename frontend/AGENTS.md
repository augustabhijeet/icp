# Frontend Codebase Documentation

## Overview

React + TypeScript frontend for the Intelligent Content Processor application. Built with Vite as the build tool. Currently a demo MVP without backend persistence.

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx          # Entry point, mounts React app to #root
│   ├── Root.tsx          # Conditional rendering based on auth state
│   ├── App.tsx           # Main dashboard UI for authenticated users
│   ├── LoginForm.tsx     # Sign-in component with dummy validation
│   ├── useAuth.tsx       # Auth context and hook for session management
│   ├── index.css         # Global styles and component styling
│   ├── App.test.tsx      # Unit and integration tests for App
│   ├── LoginForm.test.tsx # Unit tests for LoginForm
│   └── vite-env.d.ts     # Vite type definitions
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tsconfig.node.json    # TypeScript config for Vite
└── vite.config.ts        # Vite build configuration
```

## Dependencies

**Runtime:**
- `react@^18.3.1` - UI library
- `react-dom@^18.3.1` - React DOM rendering

**Dev:**
- `typescript@^5.6.2` - Type checking
- `vite@^5.4.1` - Build tool
- `vitest@^2.1.0` - Testing framework
- `@testing-library/react@^16.1.0` - UI testing utilities
- `@vitejs/plugin-react@^4.3.0` - React support in Vite

## Scripts

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Build to dist/
npm run preview  # Preview production build locally
npm run test     # Run unit and integration tests
```

## Key Files

### src/useAuth.tsx
- Provides `AuthContext` with `isAuthenticated`, `username`, `login`, and `logout`.
- Persists session state in `localStorage` (`icp_auth`, `icp_username`).
- **Dummy credentials:** `user` / `password`.

### src/Root.tsx
- Uses `useAuth` hook to determine which top-level component to render.
- Renders `App` if authenticated, otherwise `LoginForm`.

### src/App.tsx
**Main component handling:**
- **File selection:** PDF-only, max 10 MB.
- **Validation:** Type and size checks with user-friendly errors.
- **Upload:** POST to `/api/upload` endpoint.
- **Results Display:** Shows filename, classification (with confidence-based coloring), and markdown.

### src/LoginForm.tsx
- Handles username/password input.
- Calls `login` from `useAuth`.
- Displays validation errors for wrong credentials.

## Current Functionality

1. **Authentication**
   - Dummy login with "user" / "password".
   - Session persistence across reloads.
   - Logout functionality in header.

2. **File Selection**
   - Accept only PDF files (validated by extension and MIME type).
   - Validate file size (max 10 MB).

3. **Upload & Process**
   - POST file to `/api/upload`.
   - Display response data (filename, classification, markdown).

## Testing

Tests are implemented using **Vitest** and **React Testing Library**:
- `App.test.tsx`: Tests upload flow, file validation, and UI states.
- `LoginForm.test.tsx`: Tests login validation and error handling.

Run tests via `npm run test`.

## Notes for Developers

- Component is functional with hooks (useState)
- No external UI library; all styling custom CSS
- No routing (single-page app)
- No API mocking; expects real backend at /api/upload
- All user-facing strings should be clear and actionable
- Errors are user-friendly (not technical stacktraces)
