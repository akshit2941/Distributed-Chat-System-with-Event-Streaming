import React, { createContext, useState, useEffect, useContext } from 'react';

interface User {
  userId: number;
  username: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

import { generateE2EEKeys } from '../utils/cryptoUtils';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and register E2EE RSA keys automatically when authenticated
  useEffect(() => {
    if (!token || !user) return;

    const initializeKeys = async () => {
      try {
        const pubKeyKey = `e2ee_public_key_${user.userId}`;
        const privKeyKey = `e2ee_private_key_${user.userId}`;

        let pubKey = localStorage.getItem(pubKeyKey);
        let privKey = localStorage.getItem(privKeyKey);

        if (!pubKey || !privKey) {
          console.log('Generating E2EE key pair for user:', user.username);
          const keypair = await generateE2EEKeys();
          localStorage.setItem(pubKeyKey, keypair.publicKey);
          localStorage.setItem(privKeyKey, keypair.privateKey);
          pubKey = keypair.publicKey;
        }

        console.log('Registering E2EE public key with backend...');
        const response = await fetch('http://localhost:8080/api/user/public-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ publicKey: pubKey })
        });
        if (!response.ok) {
          console.error('Failed to register public key on server:', await response.text());
        }
      } catch (err) {
        console.error('E2EE key generation/registration error:', err);
      }
    };

    initializeKeys();
  }, [token, user]);

  useEffect(() => {
    const savedToken = localStorage.getItem('chat_token');
    if (savedToken) {
      const decoded = parseJwt(savedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(savedToken);
        setUser({
          userId: decoded.userId,
          username: decoded.sub,
        });
      } else {
        localStorage.removeItem('chat_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Invalid username or password');
    }

    const data = await response.json(); // { token: "ey..." }
    const decoded = parseJwt(data.token);
    if (!decoded) {
      throw new Error('Failed to parse authentication token');
    }

    localStorage.setItem('chat_token', data.token);
    setToken(data.token);
    setUser({
      userId: decoded.userId,
      username: decoded.sub,
    });
  };

  const register = async (username: string, password: string, email: string) => {
    const response = await fetch('http://localhost:8080/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('chat_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
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
