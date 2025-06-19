import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Cache do perfil do usuário
  const [profileCache, setProfileCache] = useState<{
    data: User | null;
    timestamp: number;
  }>({
    data: null,
    timestamp: 0
  });

  // Tempo de expiração do cache (5 minutos)
  const CACHE_EXPIRATION = 5 * 60 * 1000;

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      // Verifica se o cache é válido
      const now = Date.now();
      if (profileCache.data && now - profileCache.timestamp < CACHE_EXPIRATION) {
        setUser(profileCache.data);
        return true;
      }

      const response = await api.get('/auth/profile');
      const userData = response.data;
      setUser(userData);
      
      // Atualiza o cache
      setProfileCache({
        data: userData,
        timestamp: now
      });
      return true;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      // Atualiza o cache
      setProfileCache({
        data: userData,
        timestamp: Date.now()
      });

      // Força uma pequena pausa para garantir que o token foi armazenado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verifica se o token foi armazenado corretamente
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('Erro ao armazenar token');
      }

      // Redireciona para o dashboard
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      // Atualiza o cache
      setProfileCache({
        data: userData,
        timestamp: Date.now()
      });

      // Força uma pequena pausa para garantir que o token foi armazenado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verifica se o token foi armazenado corretamente
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('Erro ao armazenar token');
      }

      // Redireciona para o dashboard
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Limpa o cache
    setProfileCache({
      data: null,
      timestamp: 0
    });
    navigate('/login', { replace: true });
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 