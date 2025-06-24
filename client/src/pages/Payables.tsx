import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import payableService, { Payable, CreatePayableData, AddPaymentData, PayableFilters } from '@/lib/payableService';
import accountService, { Account } from '@/lib/accountService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Página de gerenciamento de contas a pagar
 * Permite visualizar, criar, editar e gerenciar pagamentos de contas a pagar
 */
const Payables: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Estados principais
  const [payables, setPayables] = useState<Payable[]>([]);
  const [filteredPayables, setFilteredPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total_pending: 0,
    total_paid: 0,
    total_overdue: 0,
    total_amount: 0,
    pending_amount: 0,
    paid_amount: 0,
    overdue_amount: 0
  });

  // Estados de filtros
  const [filters, setFilters] = useState<PayableFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Estados de modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);

  // Estados de formulários
  const [createForm, setCreateForm] = useState<CreatePayableData>({
    supplier_id: 0,
    description: '',
    amount: 0,
    due_date: '',
    category_id: undefined,
    notes: ''
  });
  const [paymentForm, setPaymentForm] = useState<AddPaymentData>({
    payable_id: 0,
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'pix',
    account_id: 0,
    notes: ''
  });

  // Estados de loading
  const [creating, setCreating] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Estados para dados auxiliares
  const [suppliers, setSuppliers] = useState<Array<{id: number, name: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: number, name: string, color: string}>>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  /**
   * Carrega fornecedores da API
   */
  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  /**
   * Carrega categorias da API
   */
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  /**
   * Carrega contas bancárias da API
   */
  const loadAccounts = async () => {
    try {
      console.log('🔍 Carregando contas bancárias...');
      const accountsData = await accountService.getAccounts();
      console.log('✅ Contas carregadas:', accountsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('❌ Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas bancárias');
      setAccounts([]);
    }
  };

  /**
   * Carrega as contas a pagar da API
   */
  const loadPayables = async () => {
    try {
      setLoading(true);
      
      const [payablesData, statsData] = await Promise.all([
        payableService.getPayables(filters),
        payableService.getStatistics()
      ]);
      
      setPayables(payablesData);
      setFilteredPayables(payablesData);
      setStatistics(statsData);
      
    } catch (error: any) {
      console.error('Erro ao carregar contas a pagar:', error);
      console.error('Detalhes do erro:', error.response?.data);
      toast.error('Não foi possível carregar as contas a pagar');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aplica filtros e busca
   */
  const applyFilters = () => {
    let filtered = [...payables];

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payable => payable.status === statusFilter);
    }

    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(payable => 
        payable.description.toLowerCase().includes(term) ||
        payable.supplier?.name.toLowerCase().includes(term) ||
        payable.category?.name.toLowerCase().includes(term)
      );
    }

    setFilteredPayables(filtered);
  };

  /**
   * Cria uma nova conta a pagar
   */
  const handleCreatePayable = async () => {
    try {
      setCreating(true);
      
      // Validação básica
      if (!createForm.supplier_id || !createForm.description || !createForm.amount || !createForm.due_date) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      await payableService.createPayable(createForm);
      
      toast.success('Conta a pagar criada com sucesso');
      
      // Reset do formulário
      setCreateForm({
        supplier_id: 0,
        description: '',
        amount: 0,
        due_date: '',
        category_id: undefined,
        notes: ''
      });
      
      setShowCreateModal(false);
      loadPayables();
    } catch (error: any) {
      console.error('Erro ao criar conta a pagar:', error);
      const errorMessage = error.response?.data?.error || 'Não foi possível criar a conta a pagar';
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  /**
   * Adiciona um pagamento
   */
  const handleAddPayment = async () => {
    if (!selectedPayable) return;

    try {
      setAddingPayment(true);
      
      // Validação básica
      if (!paymentForm.amount || !paymentForm.payment_date || !paymentForm.payment_method || !paymentForm.account_id) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Verifica se o valor do pagamento não excede o valor restante
      if (paymentForm.amount > selectedPayable.remaining_amount) {
        toast.error('O valor do pagamento não pode exceder o valor restante');
        return;
      }

      await payableService.addPayment(selectedPayable.id, paymentForm);
      
      toast.success('Pagamento registrado com sucesso');
      
      // Reset do formulário
      setPaymentForm({
        payable_id: 0,
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'pix',
        account_id: 0,
        notes: ''
      });
      
      setShowPaymentModal(false);
      setSelectedPayable(null);
      loadPayables();
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      const errorMessage = error.response?.data?.error || 'Não foi possível registrar o pagamento';
      toast.error(errorMessage);
    } finally {
      setAddingPayment(false);
    }
  };

  /**
   * Remove uma conta a pagar
   */
  const handleDeletePayable = async (id: number) => {
    try {
      setDeleting(id);
      await payableService.deletePayable(id);
      
      toast.success('Conta a pagar excluída com sucesso');
      loadPayables();
    } catch (error: any) {
      console.error('Erro ao excluir conta a pagar:', error);
      const errorMessage = error.response?.data?.error || 'Não foi possível excluir a conta a pagar';
      toast.error(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  /**
   * Abre o modal de pagamento
   */
  const openPaymentModal = (payable: Payable) => {
    setSelectedPayable(payable);
    setPaymentForm({
      payable_id: payable.id,
      amount: payable.remaining_amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'pix',
      account_id: (Array.isArray(accounts) && accounts.length > 0) ? accounts[0].id : 0,
      notes: ''
    });
    setShowPaymentModal(true);
  };

  /**
   * Abre o modal de detalhes
   */
  const openDetailsModal = (payable: Payable) => {
    setSelectedPayable(payable);
    setShowDetailsModal(true);
  };

  /**
   * Obtém o ícone do status
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  /**
   * Obtém a cor do status
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Obtém o texto do status
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Carrega dados na montagem do componente
  useEffect(() => {
    loadPayables();
    loadSuppliers();
    loadCategories();
    loadAccounts();
  }, []);

  // Aplica filtros quando mudam
  useEffect(() => {
    if (payables.length > 0) {
      applyFilters();
    }
  }, [payables, searchTerm, statusFilter]);

  // Redireciona se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando contas a pagar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar</h1>
          <p className="text-gray-600 mt-1">Gerencie suas contas a pagar e pagamentos</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta a Pagar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_pending}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics.pending_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_paid}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics.paid_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_overdue}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics.overdue_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.total_amount)}</div>
            <p className="text-xs text-muted-foreground">
              Todas as contas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por descrição, fornecedor..."
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
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Select 
                value={filters.min_amount?.toString() || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  min_amount: value === 'all' ? undefined : parseFloat(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por valor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="100">Até R$ 100</SelectItem>
                  <SelectItem value="500">Até R$ 500</SelectItem>
                  <SelectItem value="1000">Até R$ 1.000</SelectItem>
                  <SelectItem value="5000">Até R$ 5.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            {filteredPayables.length} conta(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-2" />
                        <p>Nenhuma conta a pagar encontrada</p>
                        <p className="text-sm">Crie sua primeira conta a pagar para começar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayables.map((payable) => (
                    <TableRow key={payable.id}>
                      <TableCell className="font-medium">
                        {payable.description}
                      </TableCell>
                      <TableCell>{payable.supplier?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {payable.category ? (
                          <Badge 
                            className="text-xs"
                            style={{ backgroundColor: payable.category.color + '20', color: payable.category.color }}
                          >
                            {payable.category.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">Sem categoria</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(payable.amount)}</TableCell>
                      <TableCell>{formatDate(payable.due_date)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getStatusColor(payable.status)}`}>
                          {getStatusIcon(payable.status)}
                          <span className="ml-1">{getStatusText(payable.status)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(payable.remaining_amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsModal(payable)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payable.remaining_amount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPaymentModal(payable)}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePayable(payable.id)}
                            disabled={deleting === payable.id}
                          >
                            {deleting === payable.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conta a Pagar</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova conta a pagar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor *</Label>
              <Select 
                value={createForm.supplier_id ? createForm.supplier_id.toString() : ''} 
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, supplier_id: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria (Opcional)</Label>
              <Select 
                value={createForm.category_id ? createForm.category_id.toString() : ''} 
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, category_id: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Descrição da conta a pagar"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={createForm.amount}
                onChange={(e) => setCreateForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={createForm.due_date}
                onChange={(e) => setCreateForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações adicionais (opcional)"
                rows={3}
                value={createForm.notes}
                onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePayable} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Conta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Registre um pagamento para esta conta a pagar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_amount">Valor do Pagamento *</Label>
              <Input
                id="payment_amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
              {selectedPayable && (
                <p className="text-xs text-gray-500">
                  Valor restante: {formatCurrency(selectedPayable.remaining_amount)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Data do Pagamento *</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento *</Label>
              <Select 
                value={paymentForm.payment_method} 
                onValueChange={(value: any) => setPaymentForm(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_account">Conta Bancária *</Label>
              <Select 
                value={paymentForm.account_id.toString()} 
                onValueChange={(value) => setPaymentForm(prev => ({ ...prev, account_id: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(accounts) && accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.bank_name} - {formatCurrency(account.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!Array.isArray(accounts) || accounts.length === 0) && (
                <p className="text-xs text-red-500">
                  Nenhuma conta bancária encontrada. Crie uma conta primeiro.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_notes">Observações</Label>
              <Textarea
                id="payment_notes"
                placeholder="Observações sobre o pagamento (opcional)"
                rows={3}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPayment} disabled={addingPayment}>
              {addingPayment ? 'Registrando...' : 'Registrar Pagamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Conta a Pagar</DialogTitle>
            <DialogDescription>
              Informações completas sobre esta conta a pagar
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayable && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                  <p className="text-sm">{selectedPayable.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fornecedor</Label>
                  <p className="text-sm">{selectedPayable.supplier?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                  <p className="text-sm font-medium">{formatCurrency(selectedPayable.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor Restante</Label>
                  <p className="text-sm font-medium">{formatCurrency(selectedPayable.remaining_amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Vencimento</Label>
                  <p className="text-sm">{formatDate(selectedPayable.due_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={`text-xs ${getStatusColor(selectedPayable.status)}`}>
                    {getStatusText(selectedPayable.status)}
                  </Badge>
                </div>
              </div>

              {selectedPayable.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm">{selectedPayable.notes}</p>
                </div>
              )}

              {selectedPayable.payments && selectedPayable.payments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Histórico de Pagamentos</Label>
                  <div className="mt-2 space-y-2">
                    {selectedPayable.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-500">{formatDate(payment.payment_date)}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {payment.payment_method}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payables; 