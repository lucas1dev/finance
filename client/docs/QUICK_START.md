# 🚀 Guia de Início Rápido - Frontend

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conhecimento básico de React, TypeScript e TailwindCSS

## 🛠️ Configuração Inicial

### 1. Instalar Dependências

```bash
cd client
npm install
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Sistema Financeiro
```

### 3. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
client/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Shadcn/UI components
│   │   ├── layout/         # Layout components
│   │   └── forms/          # Form components
│   ├── pages/              # Páginas da aplicação
│   ├── hooks/              # Custom hooks
│   ├── contexts/           # React contexts
│   ├── lib/                # Utilitários
│   └── types/              # TypeScript types
├── __tests__/              # Testes
└── docs/                   # Documentação
```

## 🎯 Primeiros Passos

### 1. Entender a Estrutura Existente

- **Páginas**: `src/pages/` - Páginas principais já implementadas
- **Componentes**: `src/components/` - Componentes reutilizáveis
- **Contextos**: `src/contexts/` - Estado global da aplicação

### 2. Familiarizar-se com as Tecnologias

- **Shadcn/UI**: Componentes baseados em Radix UI
- **TailwindCSS**: Framework de CSS utilitário
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de dados

### 3. Verificar Funcionalidades Existentes

- ✅ Sistema de autenticação básico
- ✅ Páginas principais (Dashboard, Transactions, etc.)
- ✅ Layout responsivo
- ✅ Context de autenticação

## 🔧 Desenvolvimento

### 1. Criar um Novo Componente

```bash
# Criar componente na pasta correta
touch src/components/MyComponent.tsx
```

### 2. Seguir os Padrões

- Usar TypeScript com tipagem forte
- Documentar com JSDoc
- Seguir padrões de nomenclatura
- Implementar testes

### 3. Usar Shadcn/UI

```bash
# Adicionar novo componente
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
```

### 4. Implementar Validação

```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;
```

## 🧪 Testes

### 1. Executar Testes

```bash
# Testes unitários
npm test

# Testes em modo watch
npm test -- --watch

# Cobertura de testes
npm run test:coverage
```

### 2. Criar Novos Testes

```bash
# Criar arquivo de teste
touch __tests__/components/MyComponent.test.tsx
```

## 📦 Build e Deploy

### 1. Build de Produção

```bash
npm run build
```

### 2. Preview do Build

```bash
npm run preview
```

### 3. Deploy

O projeto está configurado para deploy em Vercel, Netlify ou similar.

## 🔍 Debugging

### 1. React DevTools

Instalar extensão do navegador para debugging de componentes.

### 2. Console Logs

```typescript
// Logs de desenvolvimento
console.log('Debug:', data);

// Logs de erro
console.error('Erro:', error);
```

### 3. Network Tab

Verificar requisições para a API no DevTools.

## 📚 Recursos Úteis

### Documentação
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

### Ferramentas
- [Vite](https://vitejs.dev/)
- [Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 🚨 Problemas Comuns

### 1. Erro de CORS

Verificar se o backend está rodando e configurado corretamente.

### 2. Erro de Tipos TypeScript

```bash
# Verificar tipos
npm run type-check
```

### 3. Erro de Build

```bash
# Limpar cache
npm run clean
npm install
npm run build
```

## 📞 Suporte

- **Documentação**: `docs/` folder
- **Issues**: Criar issue no repositório
- **Padrões**: Ver `docs/DEVELOPMENT_PATTERNS.md`

---

**Última atualização**: 21/06/2025  
**Versão**: 1.0  
**Autor**: Lucas 