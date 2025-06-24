/**
 * Página de Gerenciamento de Investimentos
 * @author Lucas
 *
 * @description
 * Interface completa para gerenciamento de investimentos com funcionalidades
 * de criação, edição, estatísticas, gráficos e relatórios
 *
 * @returns {JSX.Element} Página de investimentos renderizada
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  DollarSign,
  Calendar,
  User,
  FileText,
  Eye,
  EyeOff,
  CreditCard,
  Receipt,
  AlertCircle,
  CalendarDays,
  TrendingUpIcon,
  TrendingDownIcon,
  Minus,
  Percent,
  BarChart,
  PieChartIcon,
  LineChartIcon,
  DollarSignIcon,
  Building2,
  Coins,
  Home,
  Briefcase,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import investmentService, { 
  Investment as ServiceInvestment, 
  InvestmentStats as ServiceInvestmentStats,
  InvestmentFilters,
  PaginationParams
} from '@/lib/investmentService';

/**
 * Esquema de validação para investimento
 */
const investmentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(['stocks', 'bonds', 'funds', 'crypto', 'real_estate', 'other'], {
    required_error: 'Tipo de investimento é obrigatório'
  }),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  purchase_date: z.string().min(1, 'Data de compra é obrigatória'),
  purchase_price: z.number().min(0.01, 'Preço de compra deve ser maior que zero'),
  quantity: z.number().optional(),
  broker: z.string().optional(),
  description: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

/**
 * Esquema de validação para transação
 */
const transactionSchema = z.object({
  type: z.enum(['buy', 'sell', 'dividend', 'interest', 'fee'], {
    required_error: 'Tipo de transação é obrigatório'
  }),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  quantity: z.number().optional(),
  price: z.number().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

/**
 * Interface para investimento local (com campos adicionais para UI)
 */
interface Investment extends ServiceInvestment {
  // Campos adicionais se necessário
}

/**
 * Interface para estatísticas de investimentos local
 */
interface InvestmentStats extends ServiceInvestmentStats {
  // Campos adicionais se necessário
}

/**
 * Componente principal de gerenciamento de investimentos
 * Permite visualizar, criar, editar e gerenciar investimentos
 * com funcionalidades de estatísticas e relatórios
 */
export function Investments() {
  const { user } = useAuth();
  
  // Estados principais
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentStats, setInvestmentStats] = useState<InvestmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [pageSize] = useState(10);

  // Formulário de investimento
  const investmentForm = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: '',
      type: 'stocks',
      amount: 0,
      purchase_date: '',
      purchase_price: 0,
      quantity: undefined,
      broker: '',
      description: '',
    }
  });

  // Formulário de transação
  const transactionForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'buy',
      amount: 0,
      quantity: undefined,
      price: undefined,
      date: new Date().toISOString().split('T')[0],
      description: '',
    }
  });

  /**
   * Busca investimentos do usuário
   */
  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: InvestmentFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (typeFilter !== 'all') filters.type = typeFilter as 'stocks' | 'bonds' | 'funds' | 'crypto' | 'real_estate' | 'other';
      if (statusFilter !== 'all') filters.status = statusFilter as 'active' | 'sold' | 'pending';

      const pagination: PaginationParams = {
        page: currentPage,
        limit: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const response = await investmentService.getInvestments(filters, pagination);
      setInvestments(response.data || []);
      setTotalPages(response.pagination.total_pages);
      setTotalInvestments(response.pagination.total);
    } catch (error: any) {
      console.error('Erro ao buscar investimentos:', error);
      setError('Erro ao carregar investimentos. Tente novamente.');
      toast.error('Erro ao buscar investimentos');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, statusFilter, currentPage, pageSize, sortBy, sortOrder]);

  /**
   * Busca estatísticas dos investimentos
   */
  const fetchInvestmentStats = useCallback(async () => {
    try {
      const response = await investmentService.getInvestmentStats('month');
      setInvestmentStats(response);
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao buscar estatísticas dos investimentos');
    }
  }, []);

  // Carrega dados iniciais
  useEffect(() => {
    if (user) {
      fetchInvestments();
      fetchInvestmentStats();
    }
  }, [user, fetchInvestments, fetchInvestmentStats]);

  /**
   * Filtra investimentos por busca e tipo
   */
  const filteredInvestments = useMemo(() => {
    return investments; // Já filtrado pelo backend
  }, [investments]);

  /**
   * Formata valor monetário
   */
  const formatCurrency = (value: number) => {
    return investmentService.formatCurrency(value);
  };

  /**
   * Formata data
   */
  const formatDate = (date: string) => {
    return investmentService.formatDate(date);
  };

  /**
   * Obtém label do tipo
   */
  const getTypeLabel = (type: string) => {
    return investmentService.getTypeLabel(type);
  };

  /**
   * Obtém label do status
   */
  const getStatusLabel = (status: string) => {
    return investmentService.getStatusLabel(status);
  };

  /**
   * Obtém cor do status
   */
  const getStatusColor = (status: string) => {
    return investmentService.getStatusColor(status);
  };

  /**
   * Obtém cor baseada no lucro/prejuízo
   */
  const getProfitLossColor = (profitLoss: number) => {
    return investmentService.getProfitLossColor(profitLoss);
  };

  /**
   * Calcula lucro/prejuízo
   */
  const calculateProfitLoss = (investment: Investment) => {
    return investmentService.calculateProfitLoss(investment);
  };

  /**
   * Calcula rentabilidade anualizada
   */
  const calculateAnnualizedReturn = (investment: Investment) => {
    return investmentService.calculateAnnualizedReturn(investment);
  };

  /**
   * Obtém ícone do tipo de investimento
   */
  const getTypeIcon = (type: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      stocks: <TrendingUpIcon className="h-4 w-4" />,
      bonds: <FileText className="h-4 w-4" />,
      funds: <BarChart className="h-4 w-4" />,
      crypto: <Coins className="h-4 w-4" />,
      real_estate: <Home className="h-4 w-4" />,
      other: <Briefcase className="h-4 w-4" />
    };
    return iconMap[type] || <Zap className="h-4 w-4" />;
  };

  /**
   * Abre modal para criar/editar investimento
   */
  const handleOpenModal = useCallback((investment?: Investment) => {
    if (investment) {
      setEditingInvestment(investment);
      investmentForm.reset({
        name: investment.name,
        type: investment.type,
        amount: investment.amount,
        purchase_date: investment.purchase_date.split('T')[0],
        purchase_price: investment.purchase_price,
        quantity: investment.quantity,
        broker: investment.broker || '',
        description: investment.description || '',
      });
    } else {
      setEditingInvestment(null);
      investmentForm.reset();
    }
    setIsModalOpen(true);
  }, [investmentForm]);

  /**
   * Fecha modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingInvestment(null);
    investmentForm.reset();
  }, [investmentForm]);

  /**
   * Abre modal de transação
   */
  const handleOpenTransactionModal = useCallback((investment: Investment) => {
    setSelectedInvestment(investment);
    transactionForm.reset({
      type: 'buy',
      amount: 0,
      quantity: undefined,
      price: undefined,
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setIsTransactionModalOpen(true);
  }, [transactionForm]);

  /**
   * Fecha modal de transação
   */
  const handleCloseTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setSelectedInvestment(null);
    transactionForm.reset();
  }, [transactionForm]);

  /**
   * Submete formulário de investimento
   */
  const onSubmitInvestment = useCallback(async (data: InvestmentFormData) => {
    try {
      if (editingInvestment) {
        await investmentService.updateInvestment(editingInvestment.id, {
          name: data.name,
          type: data.type,
          current_value: data.amount, // Para simplificar, usando amount como current_value
          quantity: data.quantity,
          broker: data.broker || undefined,
          description: data.description || undefined,
        });
        toast.success('Investimento atualizado com sucesso');
      } else {
        await investmentService.createInvestment({
          name: data.name,
          type: data.type,
          amount: data.amount,
          purchase_date: data.purchase_date,
          purchase_price: data.purchase_price,
          quantity: data.quantity,
          broker: data.broker || undefined,
          description: data.description || undefined,
        });
        toast.success('Investimento criado com sucesso');
      }
      
      handleCloseModal();
      fetchInvestments();
      fetchInvestmentStats();
    } catch (error: any) {
      console.error('Erro ao salvar investimento:', error);
      toast.error('Erro ao salvar investimento');
    }
  }, [editingInvestment, handleCloseModal, fetchInvestments, fetchInvestmentStats]);

  /**
   * Submete formulário de transação
   */
  const onSubmitTransaction = useCallback(async (data: TransactionFormData) => {
    if (!selectedInvestment) return;

    try {
      await investmentService.addTransaction(selectedInvestment.id, {
        type: data.type,
        amount: data.amount,
        quantity: data.quantity,
        price: data.price,
        date: data.date,
        description: data.description || undefined,
      });
      
      toast.success('Transação registrada com sucesso');
      handleCloseTransactionModal();
      fetchInvestments();
      fetchInvestmentStats();
    } catch (error: any) {
      console.error('Erro ao registrar transação:', error);
      toast.error('Erro ao registrar transação');
    }
  }, [selectedInvestment, handleCloseTransactionModal, fetchInvestments, fetchInvestmentStats]);

  /**
   * Exclui investimento
   */
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) {
      return;
    }

    try {
      await investmentService.deleteInvestment(id);
      toast.success('Investimento excluído com sucesso');
      fetchInvestments();
      fetchInvestmentStats();
    } catch (error: any) {
      console.error('Erro ao excluir investimento:', error);
      toast.error('Erro ao excluir investimento');
    }
  }, [fetchInvestments, fetchInvestmentStats]);

  /**
   * Exporta investimentos
   */
  const handleExport = useCallback(async () => {
    try {
      const filters: InvestmentFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (typeFilter !== 'all') filters.type = typeFilter as 'stocks' | 'bonds' | 'funds' | 'crypto' | 'real_estate' | 'other';
      if (statusFilter !== 'all') filters.status = statusFilter as 'active' | 'sold' | 'pending';

      const blob = await investmentService.exportInvestments(filters);
      
      // Cria link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `investimentos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Investimentos exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar investimentos:', error);
      toast.error('Erro ao exportar investimentos');
    }
  }, [searchTerm, typeFilter, statusFilter]);

  // Calcula estatísticas gerais
  const totalInvestmentsCount = totalInvestments;
  const totalInvested = investmentStats?.total_invested || 0;
  const totalCurrentValue = investmentStats?.total_current_value || 0;
  const totalProfitLoss = investmentStats?.total_profit_loss || 0;
  const totalProfitLossPercentage = investmentStats?.total_profit_loss_percentage || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investimentos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus investimentos e acompanhe a performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Investimento
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Investimentos
            </CardTitle>
            <BarChart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalInvestmentsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Investimentos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Investido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalInvested)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total investido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Atual
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalCurrentValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor atual total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro/Prejuízo
            </CardTitle>
            <Percent className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitLossColor(totalProfitLoss)}`}>
              {formatCurrency(totalProfitLoss)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalProfitLossPercentage.toFixed(2)}% de retorno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rentabilidade Média
            </CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100).toFixed(2) : '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Retorno médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Nome, corretora, descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="stocks">Ações</SelectItem>
                      <SelectItem value="bonds">Títulos</SelectItem>
                      <SelectItem value="funds">Fundos</SelectItem>
                      <SelectItem value="crypto">Criptomoedas</SelectItem>
                      <SelectItem value="real_estate">Imóveis</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="sold">Vendido</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="amount">Valor Investido</SelectItem>
                      <SelectItem value="current_value">Valor Atual</SelectItem>
                      <SelectItem value="purchase_date">Data de Compra</SelectItem>
                      <SelectItem value="created_at">Data de Criação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Investimentos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Investimentos</CardTitle>
              <CardDescription>
                {totalInvestmentsCount} investimentos encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2">Carregando investimentos...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-600">{error}</p>
                  <Button onClick={fetchInvestments} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              ) : filteredInvestments.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhum investimento encontrado</p>
                  <Button onClick={() => handleOpenModal()} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Investimento
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investimento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Investido</TableHead>
                      <TableHead>Valor Atual</TableHead>
                      <TableHead>Lucro/Prejuízo</TableHead>
                      <TableHead>Rentabilidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.map((investment) => {
                      const profitLoss = calculateProfitLoss(investment);
                      const annualizedReturn = calculateAnnualizedReturn(investment);

                      return (
                        <TableRow key={investment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{investment.name}</div>
                              {investment.broker && (
                                <div className="text-sm text-muted-foreground">
                                  {investment.broker}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(investment.type)}
                              <span>{getTypeLabel(investment.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(investment.amount)}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(investment.purchase_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(investment.current_value)}</div>
                            {investment.quantity && (
                              <div className="text-sm text-muted-foreground">
                                {investment.quantity} unidades
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${getProfitLossColor(profitLoss.value)}`}>
                              {formatCurrency(profitLoss.value)}
                            </div>
                            <div className={`text-sm ${getProfitLossColor(profitLoss.value)}`}>
                              {profitLoss.percentage.toFixed(2)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {annualizedReturn.toFixed(2)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ao ano
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={investment.status === 'active' ? 'default' : 'secondary'}
                              className={getStatusColor(investment.status)}
                            >
                              {getStatusLabel(investment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenTransactionModal(investment)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenModal(investment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(investment.id)}
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

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Detalhadas</CardTitle>
              <CardDescription>
                Análise completa da performance dos seus investimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {investmentStats ? (
                <div className="space-y-6">
                  {/* Resumo Geral */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800">Total Investido</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(investmentStats.total_invested)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800">Valor Atual</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(investmentStats.total_current_value)}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800">Lucro/Prejuízo</h4>
                      <p className={`text-2xl font-bold ${getProfitLossColor(investmentStats.total_profit_loss)}`}>
                        {formatCurrency(investmentStats.total_profit_loss)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {investmentStats.total_profit_loss_percentage.toFixed(2)}% de retorno
                      </p>
                    </div>
                  </div>

                  {/* Distribuição por Tipo (se disponível) */}
                  {investmentStats.investments_by_type && investmentStats.investments_by_type.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Distribuição por Tipo</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {investmentStats.investments_by_type.map((stat) => (
                          <div key={stat.type} className="space-y-2">
                            <div className="flex justify-between">
                              <span>{getTypeLabel(stat.type)}</span>
                              <span className="font-bold">{stat.count}</span>
                            </div>
                            <Progress value={stat.percentage} className="h-2" />
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(stat.amount)} ({stat.percentage.toFixed(1)}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Performers (se disponível) */}
                  {investmentStats.top_performers && investmentStats.top_performers.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Melhores Performances</h3>
                      <div className="space-y-2">
                        {investmentStats.top_performers.map((investment, index) => (
                          <div key={investment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                              </div>
                              <div>
                                <div className="font-medium">{investment.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {investment.profit_loss_percentage.toFixed(2)}% de retorno
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold ${getProfitLossColor(investment.profit_loss)}`}>
                                {formatCurrency(investment.profit_loss)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Mensal (se disponível) */}
                  {investmentStats.monthly_performance && investmentStats.monthly_performance.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Performance Mensal</h3>
                      <div className="space-y-2">
                        {investmentStats.monthly_performance.map((month) => (
                          <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{month.month}</div>
                              <div className="text-sm text-muted-foreground">
                                Investido: {formatCurrency(month.invested)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(month.current_value)}</div>
                              <div className={`text-sm ${getProfitLossColor(month.profit_loss)}`}>
                                {formatCurrency(month.profit_loss)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhuma estatística disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Investimento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingInvestment ? 'Editar Investimento' : 'Novo Investimento'}
            </DialogTitle>
          </DialogHeader>
          <Form {...investmentForm}>
            <form onSubmit={investmentForm.handleSubmit(onSubmitInvestment)} className="space-y-4">
              <FormField
                control={investmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Investimento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: PETR4, Fundo XP, Bitcoin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={investmentForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="stocks">Ações</SelectItem>
                          <SelectItem value="bonds">Títulos</SelectItem>
                          <SelectItem value="funds">Fundos</SelectItem>
                          <SelectItem value="crypto">Criptomoedas</SelectItem>
                          <SelectItem value="real_estate">Imóveis</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={investmentForm.control}
                  name="broker"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corretora</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: XP, Rico, Binance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={investmentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Investido</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={investmentForm.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Compra</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={investmentForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={investmentForm.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Compra</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={investmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre o investimento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingInvestment ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Transação */}
      <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Transação</DialogTitle>
          </DialogHeader>
          <Form {...transactionForm}>
            <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Transação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="buy">Compra</SelectItem>
                          <SelectItem value="sell">Venda</SelectItem>
                          <SelectItem value="dividend">Dividendo</SelectItem>
                          <SelectItem value="interest">Juros</SelectItem>
                          <SelectItem value="fee">Taxa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Unitário</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={transactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre a transação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseTransactionModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Transação
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Investments; 