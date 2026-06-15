import { useAuth } from './useAuth';
import App from './App';
import { LoginForm } from './LoginForm';

export function Root() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <App /> : <LoginForm />;
}
