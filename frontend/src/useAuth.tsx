import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already logged in (from localStorage)
    const stored = localStorage.getItem('icp_auth');
    return !!stored;
  });

  const [username, setUsername] = useState<string | null>(() => {
    const stored = localStorage.getItem('icp_username');
    return stored || null;
  });

  const login = async (inputUsername: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputUsername, password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setUsername(inputUsername);
        localStorage.setItem('icp_auth', 'true');
        localStorage.setItem('icp_username', inputUsername);
        return true;
      }
    } catch (err) {
      console.error('Login request failed', err);
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem('icp_auth');
    localStorage.removeItem('icp_username');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
