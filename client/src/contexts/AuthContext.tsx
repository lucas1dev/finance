import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
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

  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('AuthContext: Evento unauthorized disparado');
      setUser(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/profile');
      const userData = response.data;
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error('❌ AuthContext: Erro ao buscar perfil:', error);
      // Se houver erro 401, limpa o token
      if (error && typeof error === 'object' && 'response' in error && (error as any).response?.status === 401) {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Configura o token no axios imediatamente
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      // Armazena o token
      localStorage.setItem('token', token);
      
      // Configura o token no axios imediatamente
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Atualiza o estado do usuário diretamente
      setUser(userData);
      
      // Força uma atualização do estado
      setLoading(false);
      
      // Redireciona para o dashboard
      navigate('/', { replace: true });
    } catch (error) {
      console.error('❌ AuthContext: Erro no login:', error);
      setLoading(false);
      throw error;
    }
  }, [navigate]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user: userData } = response.data;
      
      // Armazena o token
      localStorage.setItem('token', token);
    
      // Configura o token no axios imediatamente
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Atualiza o estado do usuário imediatamente
      setUser(userData);
      
      // Força uma atualização do estado
      setLoading(false);
      
      navigate('/', { replace: true });
    } catch (error) {
      console.error('AuthContext: Erro no registro:', error);
      setLoading(false);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const isAuthenticated = useCallback(() => {
    return !!user;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
} 