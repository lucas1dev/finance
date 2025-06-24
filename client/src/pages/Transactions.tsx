/**
 * Página de Gerenciamento de Transações
 * @author Lucas
 *
 * @description
 * Interface completa para gerenciamento de transações financeiras com filtros avançados,
 * estatísticas em tempo real, gráficos interativos, exportação de dados e funcionalidades
 * de análise financeira
 *
 * @returns {JSX.Element} Página de transações renderizada
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  CreditCard,
  Receipt,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  LineChart,
  Download as DownloadIcon,
  Upload,
  Settings,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  PiggyBank,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  Heart,
  Activity,
  Building2,
  Users,
  FileSpreadsheet,
  Loader2,
  X,
  Filter as FilterIcon
} from 'lucide-react';
import api from '@/lib/axios';
import transactionService, { Transaction as ServiceTransaction } from '@/lib/transactionService';
import categoryService, { Category as ServiceCategory } from '@/lib/categoryService';
import accountService, { Account as ServiceAccount } from '@/lib/accountService';
import TransactionForm from '@/components/TransactionForm';

/**
 * Interface para transação local (com campos adicionais para UI)
 */
interface Transaction extends ServiceTransaction {
  // Campos adicionais para compatibilidade com a UI
  bank_name?: string;
  account_type?: string;
  category_name?: string;
  status?: 'confirmed' | 'pending' | 'cancelled';
}

// Usar a interface Account do accountService
type Account = ServiceAccount;

/**
 * Interface para categoria local
 */
interface Category extends ServiceCategory {
  // Campos adicionais se necessário
}

/**
 * Interface para filtros
 */
interface TransactionFilters {
  search: string;
  type: string;
  categoryId: string;
  accountId: string;
  status: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}

/**
 * Interface para ordenação
 */
interface SortConfig {
  key: keyof Transaction;
  direction: 'asc' | 'desc';
}

/**
 * Interface para paginação
 */
interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

/**
 * Componente principal de transações
 */
export default function Transactions() {
  // Estados principais
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  
  // Estados de filtros e ordenação
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: '',
    categoryId: '',
    accountId: '',
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    limit: 20,
    total: 0
  });

  const navigate = useNavigate();

  /**
   * Busca transações da API com filtros e paginação
   */
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Construir filtros para o serviço
      const serviceFilters: any = {};
      
      // Mapear filtros locais para filtros do serviço
      if (filters.search) serviceFilters.search = filters.search;
      if (filters.type) serviceFilters.type = filters.type as 'income' | 'expense';
      if (filters.categoryId) serviceFilters.category_id = parseInt(filters.categoryId);
      if (filters.accountId) serviceFilters.account_id = parseInt(filters.accountId);
      if (filters.status) serviceFilters.status = filters.status;
      if (filters.startDate) serviceFilters.start_date = filters.startDate;
      if (filters.endDate) serviceFilters.end_date = filters.endDate;
      if (filters.minAmount) serviceFilters.min_amount = parseFloat(filters.minAmount);
      if (filters.maxAmount) serviceFilters.max_amount = parseFloat(filters.maxAmount);
      
      // Construir parâmetros de paginação
      const paginationParams: any = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Adicionar ordenação
      if (sortConfig) {
        paginationParams.sort_by = sortConfig.key;
        paginationParams.sort_order = sortConfig.direction;
      }
      
      const response = await transactionService.getTransactions(serviceFilters, paginationParams);
      setTransactions(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setError('Erro ao carregar transações. Tente novamente.');
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  }, [filters, sortConfig, pagination.page, pagination.limit]);

  /**
   * Busca contas da API
   */
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await accountService.getAccounts();
      // Garantir que sempre seja um array
      setAccounts(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas');
      setAccounts([]);
    }
  }, []);

  /**
   * Busca categorias da API
   */
  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
      setCategories([]);
    }
  }, []);

  // Carrega dados iniciais
  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchCategories();
  }, [fetchTransactions, fetchAccounts, fetchCategories]);

  /**
   * Filtra transações baseado na aba ativa
   */
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filtro por aba
    switch (activeTab) {
      case 'income':
        filtered = filtered.filter(t => t.type === 'income');
        break;
      case 'expense':
        filtered = filtered.filter(t => t.type === 'expense');
        break;
      case 'pending':
        filtered = filtered.filter(t => t.status === 'pending');
        break;
      case 'confirmed':
        filtered = filtered.filter(t => t.status === 'confirmed');
        break;
      default:
        break;
    }

    return filtered;
  }, [transactions, activeTab]);

  /**
   * Calcula estatísticas baseadas nas transações filtradas
   */
  const calculatedStats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    const pending = filteredTransactions.filter(t => t.status === 'pending').length;
    const average = filteredTransactions.length > 0 
      ? (income + expense) / filteredTransactions.length 
      : 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      balance,
      pendingTransactions: pending,
      averageTransaction: average,
      totalTransactions: filteredTransactions.length
    };
  }, [filteredTransactions]);

  /**
   * Formata valor monetário
   */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  /**
   * Formata data
   */
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  /**
   * Obtém ícone baseado na categoria
   */
  const getCategoryIcon = (categoryName: string | undefined) => {
    if (!categoryName) return Receipt;
    
    const iconMap: { [key: string]: React.ElementType } = {
      'Trabalho': DollarSign,
      'Alimentação': Utensils,
      'Transporte': Car,
      'Saúde': Activity,
      'Lazer': Heart,
      'Moradia': Home,
      'default': Receipt
    };
    return iconMap[categoryName] || iconMap.default;
  };

  /**
   * Obtém cor baseada no tipo de transação
   */
  const getTransactionColor = (type: 'income' | 'expense') => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  /**
   * Obtém badge de status
   */
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
    const statusConfig = {
      confirmed: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle },
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: X }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  /**
   * Aplica filtros
   */
  const applyFilters = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTransactions();
  }, [fetchTransactions]);

  /**
   * Limpa filtros
   */
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: '',
      categoryId: '',
      accountId: '',
      status: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Atualiza filtro específico
   */
  const updateFilter = useCallback((key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Ordena por coluna
   */
  const handleSort = useCallback((key: keyof Transaction) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  /**
   * Exclui transação
   */
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }

    try {
      await transactionService.deleteTransaction(id);
      toast.success('Transação excluída com sucesso');
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  }, [fetchTransactions]);

  /**
   * Exclui múltiplas transações
   */
  const handleDeleteMultiple = useCallback(async () => {
    if (selectedTransactions.size === 0) {
      toast.error('Selecione transações para excluir');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${selectedTransactions.size} transações?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedTransactions).map(id => 
        transactionService.deleteTransaction(id)
      );
      await Promise.all(promises);
      
      toast.success(`${selectedTransactions.size} transações excluídas com sucesso`);
      setSelectedTransactions(new Set());
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao excluir transações:', error);
      toast.error('Erro ao excluir transações');
    }
  }, [selectedTransactions, fetchTransactions]);

  /**
   * Exporta transações
   */
  const handleExport = useCallback(async () => {
    try {
      // Construir filtros para exportação
      const exportFilters: any = {};
      
      if (filters.search) exportFilters.search = filters.search;
      if (filters.type) exportFilters.type = filters.type as 'income' | 'expense';
      if (filters.categoryId) exportFilters.category_id = parseInt(filters.categoryId);
      if (filters.accountId) exportFilters.account_id = parseInt(filters.accountId);
      if (filters.status) exportFilters.status = filters.status;
      if (filters.startDate) exportFilters.start_date = filters.startDate;
      if (filters.endDate) exportFilters.end_date = filters.endDate;
      if (filters.minAmount) exportFilters.min_amount = parseFloat(filters.minAmount);
      if (filters.maxAmount) exportFilters.max_amount = parseFloat(filters.maxAmount);
      
      const blob = await transactionService.exportTransactions(exportFilters);
      
      // Cria link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transacoes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Transações exportadas com sucesso');
    } catch (error) {
      console.error('Erro ao exportar transações:', error);
      toast.error('Erro ao exportar transações');
    }
  }, [filters]);

  /**
   * Atualiza seleção de transações
   */
  const handleSelectTransaction = useCallback((id: number, selected: boolean) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  /**
   * Seleciona/desseleciona todas as transações
   */
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  }, [filteredTransactions]);

  /**
   * Callback de sucesso do formulário
   */
  const handleSuccess = useCallback(() => {
    setShowForm(false);
    setSelectedTransaction(null);
    fetchTransactions();
    toast.success('Transação salva com sucesso');
  }, [fetchTransactions]);

  /**
   * Navega para próxima página
   */
  const nextPage = useCallback(() => {
    if (pagination.page * pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination]);

  /**
   * Navega para página anterior
   */
  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  }, [pagination]);

  // Calcula informações de paginação
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => {
            setSelectedTransaction(null);
            setShowForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(calculatedStats.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {calculatedStats.totalTransactions} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(calculatedStats.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              {calculatedStats.totalTransactions} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculatedStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(calculatedStats.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {calculatedStats.balance >= 0 ? 'Positivo' : 'Negativo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {calculatedStats.pendingTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs e Filtros */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilterIcon className="h-5 w-5" />
                Filtros
              </CardTitle>
              <CardDescription>
                Filtre as transações por diferentes critérios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Descrição..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={filters.type || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="income">Receitas</SelectItem>
                      <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={filters.categoryId || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, categoryId: value === 'all' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Conta</label>
                  <Select value={filters.accountId || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, accountId: value === 'all' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as contas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as contas</SelectItem>
                      {Array.isArray(accounts) && accounts.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inicial</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Final</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Mínimo</label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Máximo</label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Transações */}
          <Card>
            <CardHeader>
              <CardTitle>Transações ({filteredTransactions.length})</CardTitle>
              <CardDescription>
                Lista de todas as transações filtradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando transações...</p>
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhuma transação encontrada</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSelectedTransaction(null);
                      setShowForm(true);
                    }}
                  >
                    Criar Primeira Transação
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const CategoryIcon = getCategoryIcon(transaction.category_name);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                              {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                            </Badge>
                          </TableCell>
                          <TableCell className={getTransactionColor(transaction.type)}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4" />
                              {transaction.category_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.bank_name}
                          </TableCell>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Editar"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Excluir"
                                onClick={() => handleDelete(transaction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Formulário */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTransaction ? 'Editar Transação' : 'Nova Transação'}
              </DialogTitle>
              <DialogDescription>
                {selectedTransaction ? 'Edite os dados da transação' : 'Crie uma nova transação'}
              </DialogDescription>
            </DialogHeader>
            <TransactionForm
              accounts={accounts.map(account => ({
                id: account.id,
                bankName: account.name,
                accountType: account.type,
                balance: account.balance
              }))}
              categories={categories}
              transaction={selectedTransaction}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 