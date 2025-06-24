/**
 * Instância global do axios para requisições HTTP.
 * - Em ambiente Vite (produção/desenvolvimento), usa variáveis globais definidas pelo Vite.
 * - Em ambiente de teste (Jest), usa process.env ou valores padrão.
 * @module axios
 * @example
 * import api from '@/lib/axios';
 * api.get('/users');
 */
import axios from 'axios';

// Configuração base para todos os ambientes
const baseConfig = {
  timeout: 30000,
  withCredentials: true,
};

// Detecta ambiente de teste (Jest)
const isTest = typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined;

// Configuração específica por ambiente
const apiConfig = {
  ...baseConfig,
  baseURL: isTest
    ? (process.env.API_URL || '/api')
    : (typeof window !== 'undefined' && (window as any).__VITE_API_URL__)
      ? (window as any).__VITE_API_URL__
      : '/api',
};

const api = axios.create(apiConfig);

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔧 Interceptor de requisição - URL:', config.url);
    console.log('🔧 Interceptor de requisição - Token disponível:', !!token);
    console.log('🔧 Interceptor de requisição - Token completo:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔧 Interceptor de requisição - Token adicionado:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ Interceptor de requisição - Nenhum token encontrado');
    }
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Dispara evento para o AuthContext tratar
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api; 