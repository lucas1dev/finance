import '@testing-library/jest-dom';

// Mock do import.meta.env para Jest
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000',
      },
    },
  },
});

// Mock global para import.meta.env (Vite)
Object.defineProperty(global, 'import.meta', {
  value: { env: { VITE_API_TIMEOUT: '30000' } },
  writable: true,
});

// Mock do ResizeObserver para evitar erros nos testes
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock do matchMedia para evitar erros nos testes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 