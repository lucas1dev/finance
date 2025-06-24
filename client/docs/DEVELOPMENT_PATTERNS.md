# 🎨 Padrões de Desenvolvimento Frontend - Sistema Financeiro

## 📋 Visão Geral

Este documento define os padrões e boas práticas para desenvolvimento frontend no sistema financeiro, garantindo consistência, qualidade e manutenibilidade do código.

## 🏗️ Estrutura de Arquivos

### Organização de Diretórios

```
client/
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── ui/              # Componentes Shadcn/UI
│   │   ├── layout/          # Componentes de layout
│   │   ├── forms/           # Componentes de formulário
│   │   └── charts/          # Componentes de gráficos
│   ├── pages/               # Páginas da aplicação
│   │   ├── admin/           # Páginas administrativas
│   │   ├── auth/            # Páginas de autenticação
│   │   └── ...              # Outras páginas
│   ├── hooks/               # Hooks customizados
│   ├── contexts/            # Contextos React
│   ├── lib/                 # Utilitários e configurações
│   │   ├── api.ts           # Configuração do Axios
│   │   ├── utils.ts         # Funções utilitárias
│   │   ├── validations.ts   # Schemas Zod
│   │   └── constants.ts     # Constantes da aplicação
│   ├── types/               # Tipos TypeScript
│   └── styles/              # Estilos globais
├── __tests__/               # Testes
│   ├── components/          # Testes de componentes
│   ├── pages/               # Testes de páginas
│   └── hooks/               # Testes de hooks
└── docs/                    # Documentação
```

## 🧩 Padrões de Componentes

### 1. Estrutura Básica de Componente

```typescript
/**
 * Componente [Nome do Componente]
 * @author Lucas
 *
 * @description
 * [Descrição detalhada do propósito e funcionalidade do componente]
 *
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título do componente
 * @param {function} props.onSubmit - Função chamada ao submeter
 * @param {boolean} props.loading - Estado de carregamento
 * @returns {JSX.Element} Componente renderizado
 *
 * @example
 * <ComponentName 
 *   title="Título" 
 *   onSubmit={handleSubmit} 
 *   loading={false} 
 * />
 */
interface ComponentNameProps {
  title: string;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export function ComponentName({ title, onSubmit, loading = false }: ComponentNameProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Handlers
  const handleClick = useCallback(() => {
    // Lógica do handler
  }, []);

  // Effects
  useEffect(() => {
    // Lógica do effect
  }, []);

  // Render
  return (
    <div className="component-name">
      <h2>{title}</h2>
      {/* Conteúdo do componente */}
    </div>
  );
}
```

### 2. Componente de Página

```typescript
/**
 * Página [Nome da Página]
 * @author Lucas
 *
 * @description
 * [Descrição da funcionalidade da página]
 *
 * @example
 * // Rota: /page-name
 * // Acesso: Autenticado
 * // Permissões: [lista de permissões necessárias]
 */
export function PageName() {
  // Hooks
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API calls
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Render
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="page-container">
      <PageHeader title="Título da Página" />
      <PageContent>
        {/* Conteúdo da página */}
      </PageContent>
    </div>
  );
}
```

### 3. Componente de Formulário

```typescript
/**
 * Formulário [Nome do Formulário]
 * @author Lucas
 *
 * @description
 * [Descrição do formulário e seus campos]
 */
interface FormData {
  name: string;
  email: string;
  password: string;
}

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export function FormName() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/endpoint', data);
      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar dados');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Form>
  );
}
```

## 🎣 Padrões de Hooks

### 1. Hook Customizado Básico

```typescript
/**
 * Hook [Nome do Hook]
 * @author Lucas
 *
 * @description
 * [Descrição da funcionalidade do hook]
 *
 * @param {string} param1 - Descrição do parâmetro
 * @returns {Object} Objeto com dados e funções
 *
 * @example
 * const { data, loading, error, refetch } = useCustomHook('param');
 */
export function useCustomHook(param1: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/endpoint/${param1}`);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [param1]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

### 2. Hook para CRUD

```typescript
/**
 * Hook para operações CRUD
 * @author Lucas
 *
 * @description
 * Hook genérico para operações de Create, Read, Update, Delete
 */
interface UseCrudOptions<T> {
  endpoint: string;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useCrud<T>({ endpoint, onSuccess, onError }: UseCrudOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoint);
      setData(response.data);
      onSuccess?.(response.data);
    } catch (err) {
      const message = 'Erro ao carregar dados';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError]);

  const create = useCallback(async (item: Partial<T>) => {
    try {
      setLoading(true);
      const response = await api.post(endpoint, item);
      setData(prev => [...prev, response.data]);
      onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const message = 'Erro ao criar item';
      setError(message);
      onError?.(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError]);

  const update = useCallback(async (id: string, item: Partial<T>) => {
    try {
      setLoading(true);
      const response = await api.put(`${endpoint}/${id}`, item);
      setData(prev => prev.map(d => d.id === id ? response.data : d));
      onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const message = 'Erro ao atualizar item';
      setError(message);
      onError?.(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError]);

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`${endpoint}/${id}`);
      setData(prev => prev.filter(d => d.id !== id));
      onSuccess?.(null as any);
    } catch (err) {
      const message = 'Erro ao remover item';
      setError(message);
      onError?.(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError]);

  return {
    data,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
  };
}
```

## 🔧 Padrões de Validação

### 1. Schemas Zod

```typescript
/**
 * Schemas de validação para formulários
 * @author Lucas
 */

// Schema de usuário
export const userSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email deve ter pelo menos 5 caracteres')
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha deve ter no máximo 50 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter letra maiúscula, minúscula e número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema de transação
export const transactionSchema = z.object({
  description: z.string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres'),
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(999999999.99, 'Valor muito alto'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser receita ou despesa' }),
  }),
  categoryId: z.string().uuid('Categoria inválida'),
  accountId: z.string().uuid('Conta inválida'),
  date: z.date({
    required_error: 'Data é obrigatória',
    invalid_type_error: 'Data inválida',
  }),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
});

// Tipos derivados dos schemas
export type UserFormData = z.infer<typeof userSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
```

### 2. Validação de Formulários

```typescript
/**
 * Hook para validação de formulários
 * @author Lucas
 */
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validação em tempo real
  });

  const handleSubmit = useCallback(async (
    onSubmit: (data: T) => Promise<void>
  ) => {
    try {
      const isValid = await form.trigger();
      if (isValid) {
        const data = form.getValues();
        await onSubmit(data);
      }
    } catch (error) {
      console.error('Erro na validação:', error);
    }
  }, [form]);

  return {
    form,
    handleSubmit,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
  };
}
```

## 🧪 Padrões de Testes

### 1. Teste de Componente

```typescript
/**
 * Testes para [Nome do Componente]
 * @author Lucas
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  const mockProps = {
    title: 'Test Title',
    onSubmit: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar corretamente', () => {
    render(<ComponentName {...mockProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('deve chamar onSubmit quando clicado', async () => {
    render(<ComponentName {...mockProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('deve mostrar loading quando prop loading for true', () => {
    render(<ComponentName {...mockProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('deve ser acessível', () => {
    const { container } = render(<ComponentName {...mockProps} />);
    
    expect(container).toBeAccessible();
  });
});
```

### 2. Teste de Hook

```typescript
/**
 * Testes para [Nome do Hook]
 * @author Lucas
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomHook } from '../useCustomHook';

// Mock da API
jest.mock('../lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('useCustomHook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar dados quando API responde com sucesso', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApi = require('../lib/api').api;
    mockApi.get.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useCustomHook('test'));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('deve retornar erro quando API falha', async () => {
    const mockError = new Error('API Error');
    const mockApi = require('../lib/api').api;
    mockApi.get.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCustomHook('test'));

    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
      expect(result.current.loading).toBe(false);
    });
  });
});
```

## 🎨 Padrões de Estilização

### 1. Classes TailwindCSS

```typescript
/**
 * Constantes de classes CSS
 * @author Lucas
 */

// Layout
export const LAYOUT_CLASSES = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  page: 'min-h-screen bg-gray-50',
  content: 'py-8',
  card: 'bg-white shadow rounded-lg p-6',
  section: 'space-y-6',
} as const;

// Formulários
export const FORM_CLASSES = {
  container: 'space-y-6',
  field: 'space-y-2',
  label: 'block text-sm font-medium text-gray-700',
  input: 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
  error: 'mt-1 text-sm text-red-600',
  button: {
    primary: 'inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    secondary: 'inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  },
} as const;

// Tabelas
export const TABLE_CLASSES = {
  container: 'overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg',
  table: 'min-w-full divide-y divide-gray-300',
  header: 'bg-gray-50',
  headerCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  row: 'bg-white hover:bg-gray-50',
  cell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
} as const;
```

### 2. Componente com Classes Dinâmicas

```typescript
/**
 * Componente com classes dinâmicas
 * @author Lucas
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
} as const;

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
} as const;

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  children,
  className,
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const classes = cn(
    baseClasses,
    buttonVariants[variant],
    buttonSizes[size],
    className
  );

  return (
    <button 
      className={classes} 
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
```

## 🔄 Padrões de Estado

### 1. Context de Autenticação

```typescript
/**
 * Context de autenticação
 * @author Lucas
 */
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error) {
      throw new Error('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      await api.post('/auth/register', data);
    } catch (error) {
      throw new Error('Erro ao registrar usuário');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verificar token e carregar usuário
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
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
```

## 📝 Padrões de Documentação

### 1. JSDoc para Componentes

```typescript
/**
 * Componente de tabela de dados
 * @author Lucas
 *
 * @description
 * Componente reutilizável para exibir dados em formato de tabela.
 * Suporta paginação, ordenação e filtros.
 *
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.data - Dados a serem exibidos
 * @param {Array} props.columns - Configuração das colunas
 * @param {function} props.onRowClick - Função chamada ao clicar em uma linha
 * @param {boolean} props.loading - Estado de carregamento
 * @param {Object} props.pagination - Configuração da paginação
 * @param {function} props.onPageChange - Função chamada ao mudar de página
 *
 * @returns {JSX.Element} Tabela renderizada
 *
 * @example
 * <DataTable
 *   data={users}
 *   columns={userColumns}
 *   onRowClick={(user) => console.log(user)}
 *   loading={false}
 *   pagination={{
 *     current: 1,
 *     total: 100,
 *     pageSize: 10
 *   }}
 *   onPageChange={(page) => setPage(page)}
 * />
 *
 * @see {@link https://example.com/docs} Documentação completa
 */
```

### 2. README de Componente

```markdown
# Componente [Nome]

## Descrição
[Descrição detalhada do componente]

## Props
| Prop | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|--------|-----------|
| title | string | ✅ | - | Título do componente |
| loading | boolean | ❌ | false | Estado de carregamento |
| onSubmit | function | ✅ | - | Função de submit |

## Exemplo de Uso
```tsx
import { ComponentName } from '@/components/ComponentName';

function MyPage() {
  const handleSubmit = (data) => {
    console.log(data);
  };

  return (
    <ComponentName
      title="Meu Título"
      onSubmit={handleSubmit}
      loading={false}
    />
  );
}
```

## Testes
```bash
npm test ComponentName.test.tsx
```

## Changelog
- v1.0.0: Versão inicial
- v1.1.0: Adicionado suporte a loading state
```

---

## 🚀 Checklist de Implementação

### Para Cada Componente:
- [ ] **JSDoc**: Documentação completa
- [ ] **TypeScript**: Tipagem forte
- [ ] **Props**: Interface bem definida
- [ ] **Validação**: Props validadas
- [ ] **Testes**: Cobertura adequada
- [ ] **Acessibilidade**: ARIA labels e roles
- [ ] **Responsividade**: Funciona em mobile
- [ ] **Performance**: Otimizado
- [ ] **Estilização**: Classes consistentes

### Para Cada Hook:
- [ ] **JSDoc**: Documentação completa
- [ ] **TypeScript**: Tipagem forte
- [ ] **Testes**: Cobertura adequada
- [ ] **Performance**: Otimizado
- [ ] **Error Handling**: Tratamento de erros
- [ ] **Cleanup**: Limpeza adequada

### Para Cada Página:
- [ ] **Layout**: Estrutura consistente
- [ ] **Loading States**: Estados de carregamento
- [ ] **Error Handling**: Tratamento de erros
- [ ] **SEO**: Meta tags adequadas
- [ ] **Performance**: Lazy loading
- [ ] **Testes**: Cobertura adequada

---

**Última atualização**: 21/06/2025  
**Versão**: 1.0  
**Autor**: Lucas 