import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './useAuth';
import { Root } from './Root';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>,
);
