import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './useAuth';
import { LoginForm } from './LoginForm';

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn());

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render login form with title', () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      expect(screen.getByText('Intelligent Content Processor')).toBeInTheDocument();
      expect(screen.getByText('Sign in to access the dashboard')).toBeInTheDocument();
    });

    it('should render username and password inputs', () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      expect(screen.getByTestId('username-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
    });

    it('should render sign in button', () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    it('should render demo credentials hint', () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      expect(screen.getByText('Demo credentials:')).toBeInTheDocument();
      expect(screen.getByText('user / password')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should be disabled initially', () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const button = screen.getByTestId('login-button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should enable button when username and password are filled', async () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');
      const button = screen.getByTestId('login-button') as HTMLButtonElement;

      await userEvent.type(usernameInput, 'user');
      await userEvent.type(passwordInput, 'password');

      expect(button.disabled).toBe(false);
    });

    it('should disable button if username is empty', async () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const passwordInput = screen.getByTestId('password-input');
      const button = screen.getByTestId('login-button') as HTMLButtonElement;

      await userEvent.type(passwordInput, 'password');

      expect(button.disabled).toBe(true);
    });

    it('should disable button if password is empty', async () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const usernameInput = screen.getByTestId('username-input');
      const button = screen.getByTestId('login-button') as HTMLButtonElement;

      await userEvent.type(usernameInput, 'user');

      expect(button.disabled).toBe(true);
    });
  });

  describe('Login Validation', () => {
    it('should show error with wrong credentials', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');
      const button = screen.getByTestId('login-button');

      await userEvent.type(usernameInput, 'wronguser');
      await userEvent.type(passwordInput, 'wrongpass');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toBeInTheDocument();
        expect(screen.getByText(/Invalid username or password/)).toBeInTheDocument();
      });
    });

    it('should show error with correct username but wrong password', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');
      const button = screen.getByTestId('login-button');

      await userEvent.type(usernameInput, 'user');
      await userEvent.type(passwordInput, 'wrongpass');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toBeInTheDocument();
      });
    });

    it('should clear error when user types after error', async () => {
      (fetch as any)
        .mockResolvedValueOnce({ ok: false, status: 401 }) // Fail
        .mockResolvedValueOnce({ ok: true }); // Success

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');
      const button = screen.getByTestId('login-button');

      // First failed attempt
      await userEvent.type(usernameInput, 'wrong');
      await userEvent.type(passwordInput, 'wrong');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toBeInTheDocument();
      });

      // Clear and retry
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'user');
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'password');
      await userEvent.click(button);

      // Error should be gone after successful login attempt
      await waitFor(() => {
        expect(screen.queryByTestId('login-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Button States', () => {
    it('should show loading state during login', async () => {
      (fetch as any).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');
      const button = screen.getByTestId('login-button');

      await userEvent.type(usernameInput, 'user');
      await userEvent.type(passwordInput, 'password');
      await userEvent.click(button);

      expect(button).toHaveTextContent('Signing in...');
    });

    it('should disable inputs during login', async () => {
      (fetch as any).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
      const button = screen.getByTestId('login-button') as HTMLButtonElement;

      await userEvent.type(usernameInput, 'user');
      await userEvent.type(passwordInput, 'password');
      await userEvent.click(button);

      expect(usernameInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
      expect(button.disabled).toBe(true);
    });
  });

  describe('localStorage Persistence', () => {
    it('should store auth state in localStorage on successful login', async () => {
      (fetch as any).mockResolvedValueOnce({ ok: true });

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');
      const button = screen.getByTestId('login-button');

      await userEvent.type(usernameInput, 'user');
      await userEvent.type(passwordInput, 'password');
      await userEvent.click(button);

      await waitFor(() => {
        expect(localStorage.getItem('icp_auth')).toBe('true');
        expect(localStorage.getItem('icp_username')).toBe('user');
      });
    });
  });
});
