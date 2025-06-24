/**
 * Página de Gerenciamento de Recebíveis
 * @author Lucas
 *
 * @description
 * Interface completa para gerenciamento de recebíveis com funcionalidades
 * de criação, edição, estatísticas, gráficos e relatórios
 *
 * @returns {JSX.Element} Página de recebíveis renderizada
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  BarChart3
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import receivableService, { Receivable, ReceivableFilters, ReceivableStats } from '@/lib/receivableService';
import customerService, { Customer } from '@/lib/customerService';
import categoryService, { Category } from '@/lib/categoryService';
import { ReceivableForm, ReceivableFormData } from '@/components/ReceivableForm';
import { PaymentForm } from '@/components/PaymentForm';

/**
 * Componente principal de gerenciamento de recebíveis
 * Permite visualizar, criar, editar e gerenciar recebíveis
 * com funcionalidades de estatísticas e relatórios
 */
export function Receivables() {
  // Estados principais
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [receivableStats, setReceivableStats] = useState<ReceivableStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState<string>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [pageSize] = useState(10);

  /**
   * Carregar dados iniciais
   */
  useEffect(() => {
    fetchReceivables();
    fetchCustomers();
    fetchCategories();
    fetchReceivableStats();
  }, []);

  /**
   * Carregar recebíveis
   */
  const fetchReceivables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: ReceivableFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter as any;
      if (customerFilter !== 'all') filters.customer_id = parseInt(customerFilter);

      const pagination = {
        page: currentPage,
        limit: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const response = await receivableService.getReceivables(filters, pagination);
      setReceivables(response.data || []);
      setTotalReceivables(response.pagination?.total || 0);
      setTotalPages(response.pagination?.total_pages || 0);
    } catch (error) {
      console.error('Erro ao carregar recebíveis:', error);
      setError('Erro ao carregar recebíveis');
      setReceivables([]);
      setTotalReceivables(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, customerFilter, currentPage, pageSize, sortBy, sortOrder]);

  /**
   * Carregar clientes
   */
  const fetchCustomers = useCallback(async () => {
    try {
      const customersData = await customerService.getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  }, []);

  /**
   * Carregar categorias
   */
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await categoryService.getCategoriesByType('income');
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, []);

  /**
   * Carregar estatísticas
   */
  const fetchReceivableStats = useCallback(async () => {
    try {
      const stats = await receivableService.getReceivableStats();
      setReceivableStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Define estatísticas vazias em caso de erro
      setReceivableStats({
        total_receivables: 0,
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
        overdue_count: 0,
        average_days_to_pay: 0,
        top_customers: [],
        receivables_by_status: [],
        receivables_by_month: []
      });
    }
  }, []);

  /**
   * Filtra recebíveis por busca e tipo
   */
  const filteredReceivables = receivables;

  /**
   * Formata valor monetário
   */
  const formatCurrency = (value: number) => {
    return receivableService.formatCurrency(value);
  };

  /**
   * Formata data
   */
  const formatDate = (date: string) => {
    return receivableService.formatDate(date);
  };

  /**
   * Obtém label do status
   */
  const getStatusLabel = (status: string) => {
    return receivableService.getStatusLabel(status);
  };

  /**
   * Obtém cor do status
   */
  const getStatusColor = (status: string) => {
    return receivableService.getStatusColor(status);
  };

  /**
   * Verifica se está em atraso
   */
  const isOverdue = (dueDate: string) => {
    return receivableService.isOverdue(dueDate);
  };

  /**
   * Calcula dias em atraso
   */
  const getDaysOverdue = (dueDate: string) => {
    return receivableService.calculateDaysOverdue(dueDate);
  };

  /**
   * Abre modal para criar/editar recebível
   */
  const handleOpenModal = useCallback((receivable?: Receivable) => {
    if (receivable) {
      setEditingReceivable(receivable);
    } else {
      setEditingReceivable(null);
    }
    setIsModalOpen(true);
  }, []);

  /**
   * Fecha modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingReceivable(null);
  }, []);

  /**
   * Abre modal de pagamento
   */
  const handleOpenPaymentModal = useCallback((receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setIsPaymentModalOpen(true);
  }, []);

  /**
   * Fecha modal de pagamento
   */
  const handleClosePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setSelectedReceivable(null);
  }, []);

  /**
   * Submete formulário de recebível
   */
  const onSubmitReceivable = useCallback(async (data: ReceivableFormData) => {
    try {
      if (editingReceivable) {
        await receivableService.updateReceivable(editingReceivable.id, {
          customer_id: data.customer_id,
          category_id: data.category_id,
          amount: data.amount,
          due_date: data.due_date,
          description: data.description || undefined,
          invoice_number: data.invoice_number || undefined,
          payment_terms: data.payment_terms || undefined,
        });
        toast.success('Recebível atualizado com sucesso');
      } else {
        await receivableService.createReceivable({
          customer_id: data.customer_id,
          category_id: data.category_id,
          amount: data.amount,
          due_date: data.due_date,
          description: data.description || undefined,
          invoice_number: data.invoice_number || undefined,
          payment_terms: data.payment_terms || undefined,
        });
        toast.success('Recebível criado com sucesso');
      }
      
      handleCloseModal();
      fetchReceivables();
      fetchReceivableStats();
    } catch (error: any) {
      console.error('Erro ao salvar recebível:', error);
      toast.error('Erro ao salvar recebível');
    }
  }, [editingReceivable, handleCloseModal, fetchReceivables, fetchReceivableStats]);

  /**
   * Submete formulário de pagamento
   */
  const onSubmitPayment = useCallback(async (data: {
    amount: number;
    payment_date: string;
    payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
    account_id: number;
    description?: string;
  }) => {
    if (!selectedReceivable) return;

    try {
      await receivableService.addPayment(selectedReceivable.id, data);
      
      toast.success('Pagamento registrado com sucesso');
      handleClosePaymentModal();
      fetchReceivables();
      fetchReceivableStats();
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error(error.message || 'Erro ao registrar pagamento');
    }
  }, [selectedReceivable, handleClosePaymentModal, fetchReceivables, fetchReceivableStats]);

  /**
   * Exclui recebível
   */
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este recebível?')) {
      return;
    }

    try {
      await receivableService.deleteReceivable(id);
      toast.success('Recebível excluído com sucesso');
      fetchReceivables();
      fetchReceivableStats();
    } catch (error: any) {
      console.error('Erro ao excluir recebível:', error);
      toast.error('Erro ao excluir recebível');
    }
  }, [fetchReceivables, fetchReceivableStats]);

  /**
   * Exporta recebíveis
   */
  const handleExport = useCallback(async () => {
    try {
      const filters: ReceivableFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter as 'pending' | 'partially_paid' | 'paid' | 'overdue';
      if (customerFilter !== 'all') filters.customer_id = parseInt(customerFilter);

      const blob = await receivableService.exportReceivables(filters);
      
      // Cria link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recebiveis-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Recebíveis exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar recebíveis:', error);
      toast.error('Erro ao exportar recebíveis');
    }
  }, [searchTerm, statusFilter, customerFilter]);

  // Calcula estatísticas gerais
  const totalReceivablesCount = totalReceivables;
  const totalAmount = receivableStats?.total_amount || 0;
  const paidAmount = receivableStats?.paid_amount || 0;
  const pendingAmount = receivableStats?.pending_amount || 0;
  const overdueAmount = receivableStats?.overdue_amount || 0;
  const overdueCount = receivableStats?.overdue_count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recebíveis</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas contas a receber
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Recebível
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Recebíveis
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalReceivablesCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Recebíveis cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total a receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Pago
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalAmount > 0 ? `${((paidAmount / totalAmount) * 100).toFixed(1)}% do total` : '0% do total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Pendente
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalAmount > 0 ? `${((pendingAmount / totalAmount) * 100).toFixed(1)}% do total` : '0% do total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Atraso
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overdueCount} recebíveis em atraso
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
                      placeholder="Cliente, descrição, nota fiscal..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="partially_paid">Parcialmente Pago</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Em Atraso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Cliente</Label>
                  <Select value={customerFilter} onValueChange={setCustomerFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Clientes</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
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
                      <SelectItem value="due_date">Data de Vencimento</SelectItem>
                      <SelectItem value="amount">Valor</SelectItem>
                      <SelectItem value="customer_name">Cliente</SelectItem>
                      <SelectItem value="created_at">Data de Criação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Recebíveis */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Recebíveis</CardTitle>
              <CardDescription>
                {totalReceivablesCount} recebíveis encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2">Carregando recebíveis...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-600">{error}</p>
                  <Button onClick={fetchReceivables} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              ) : filteredReceivables.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhum recebível encontrado</p>
                  <Button onClick={() => handleOpenModal()} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Recebível
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Restante</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceivables.map((receivable) => {
                      const customer = customers.find(c => c.id === receivable.customer_id);
                      const category = categories.find(c => c.id === receivable.category_id);
                      const overdue = isOverdue(receivable.due_date);
                      const daysOverdue = getDaysOverdue(receivable.due_date);

                      return (
                        <TableRow key={receivable.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer?.name || 'Cliente não encontrado'}</div>
                              {category && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{receivable.description || 'Sem descrição'}</div>
                              {receivable.invoice_number && (
                                <div className="text-sm text-muted-foreground">
                                  NF: {receivable.invoice_number}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(receivable.amount)}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatDate(receivable.due_date)}</div>
                              {overdue && (
                                <div className="text-sm text-red-600">
                                  {daysOverdue} dias em atraso
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={receivable.status === 'paid' ? 'default' : 'secondary'}
                              className={getStatusColor(receivable.status)}
                            >
                              {getStatusLabel(receivable.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(receivable.remaining_amount)}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {receivable.remaining_amount > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenPaymentModal(receivable)}
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenModal(receivable)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(receivable.id)}
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
          {/* Estatísticas Detalhadas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Detalhadas</CardTitle>
              <CardDescription>
                Análise completa dos recebíveis e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivableStats ? (
                <div className="space-y-6">
                  {/* Distribuição por Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Distribuição por Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {receivableStats.receivables_by_status.map((stat) => (
                        <div key={stat.status} className="space-y-2">
                          <div className="flex justify-between">
                            <span>{getStatusLabel(stat.status)}</span>
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

                  {/* Top Clientes */}
                  {receivableStats.top_customers && receivableStats.top_customers.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Top Clientes por Recebíveis</h3>
                      <div className="space-y-2">
                        {receivableStats.top_customers.map((customer, index) => (
                          <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                              </div>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {customer.receivables_count} recebíveis
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(customer.total_receivables)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Métricas Adicionais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Média de Dias para Pagamento</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {receivableStats.average_days_to_pay.toFixed(1)} dias
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Taxa de Inadimplência</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {totalAmount > 0 ? `${((overdueAmount / totalAmount) * 100).toFixed(1)}%` : '0%'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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

      {/* Modal de Recebível */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ReceivableForm
          initialData={editingReceivable ? {
            id: editingReceivable.id,
            customer_id: editingReceivable.customer_id,
            category_id: editingReceivable.category_id,
            amount: editingReceivable.amount,
            due_date: editingReceivable.due_date,
            description: editingReceivable.description,
            invoice_number: editingReceivable.invoice_number,
            payment_terms: editingReceivable.payment_terms,
          } : undefined}
          onSubmit={onSubmitReceivable}
        />
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Registre um pagamento para esta conta a receber
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceivable && (
            <PaymentForm
              receivableId={selectedReceivable.id}
              remainingAmount={selectedReceivable.remaining_amount}
              onSubmit={onSubmitPayment}
              onCancel={handleClosePaymentModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Receivables; 