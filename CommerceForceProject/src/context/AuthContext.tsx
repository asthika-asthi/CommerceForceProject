import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, LoginCredentials, RegisterData, AuthResponse, PendingAction } from '../shared/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  pendingAction: PendingAction | null;
  setPendingAction: (action: PendingAction | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    // Attempt to recover pendingAction from session storage to survive refreshes
    const savedAction = sessionStorage.getItem('pending_auth_action');
    if (savedAction) {
      try {
        setPendingAction(JSON.parse(savedAction));
      } catch (e) {
        sessionStorage.removeItem('pending_auth_action');
      }
    }
  }, []);

  const handleSetPendingAction = useCallback((action: PendingAction | null) => {
    if (action) {
      sessionStorage.setItem('pending_auth_action', JSON.stringify(action));
    } else {
      sessionStorage.removeItem('pending_auth_action');
    }
    setPendingAction(action);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const authData: AuthResponse = await response.json();
    localStorage.setItem('token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.replace('/login');
  }, []);

  const contextValue = useMemo(() => ({ 
    user, 
    token, 
    login, 
    register, 
    logout, 
    isLoading, 
    pendingAction, 
    setPendingAction: handleSetPendingAction 
  }), [user, token, login, register, logout, isLoading, pendingAction, handleSetPendingAction]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
