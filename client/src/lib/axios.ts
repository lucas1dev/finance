import axios from 'axios';

// Cache de requisições
const requestCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

// Tempo de expiração do cache (1 minuto)
const CACHE_EXPIRATION = 60 * 1000;

// Rate limiting
const RATE_LIMIT = {
  maxRequests: 10,
  timeWindow: 1000, // 1 segundo
  requests: new Map<string, number[]>()
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
});

// Função para limpar requisições antigas do rate limiting
const cleanOldRequests = (timestamps: number[]) => {
  const now = Date.now();
  return timestamps.filter(timestamp => now - timestamp < RATE_LIMIT.timeWindow);
};

// Função para verificar rate limit
const checkRateLimit = (url: string): boolean => {
  const now = Date.now();
  const requests = RATE_LIMIT.requests.get(url) || [];
  const recentRequests = cleanOldRequests(requests);

  if (recentRequests.length >= RATE_LIMIT.maxRequests) {
    return false;
  }

  recentRequests.push(now);
  RATE_LIMIT.requests.set(url, recentRequests);
  return true;
};

// Função para gerar chave do cache
const generateCacheKey = (config: any) => {
  const { url, method, params, data } = config;
  return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
};

// Interceptor de requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Verifica rate limit para métodos não-GET
    if (config.method !== 'get' && config.url && !checkRateLimit(config.url)) {
      throw new Error('Too many requests, please try again later');
    }

    // Verifica cache para métodos GET
    if (config.method === 'get') {
      const cacheKey = generateCacheKey(config);
      const cachedData = requestCache.get(cacheKey);

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRATION) {
        // Retorna uma Promise rejeitada com um objeto especial para identificar que é um cache hit
        return Promise.reject({
          __CACHE_HIT__: true,
          data: cachedData.data
        });
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta
api.interceptors.response.use(
  (response) => {
    // Armazena no cache se for uma requisição GET
    if (response.config.method === 'get') {
      const cacheKey = generateCacheKey(response.config);
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  (error) => {
    // Verifica se é um cache hit
    if (error.__CACHE_HIT__) {
      return Promise.resolve({ data: error.data });
    }

    // Trata erros de autenticação
    if (error.response?.status === 401) {
      // Limpa o token
      localStorage.removeItem('token');
      // Emite um evento para o AuthContext tratar o redirecionamento
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

// Função para verificar se o token está presente
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export default api; 