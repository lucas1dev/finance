/**
 * Página de Financiamentos
 * @author Lucas
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Search, CreditCard, Calculator, Calendar, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye, Edit, Trash, Download } from 'lucide-react';
import financingService, { Financing, CreateFinancing, FinancingStats, AmortizationTable, FinancingPayment, CreateFinancingPayment } from '@/lib/financingService';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Componente principal da página de Financiamentos
 */
export default function Financings() {
  const { user } = useAuth();
  const [financings, setFinancings] = useState<Financing[]>([]);
  const [stats, setStats] = useState<FinancingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAmortizationModal, setShowAmortizationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState<Financing | null>(null);
  const [amortizationTable, setAmortizationTable] = useState<AmortizationTable[]>([]);
  const [payments, setPayments] = useState<FinancingPayment[]>([]);

  // Estados do formulário
  const [formData, setFormData] = useState<CreateFinancing>({
    creditor_id: 0,
    financing_type: 'emprestimo_pessoal',
    total_amount: 0,
    interest_rate: 0,
    term_months: 0,
    start_date: '',
    description: '',
    contract_number: '',
    payment_method: 'boleto',
    observations: '',
    amortization_method: 'SAC',
  });

  const [paymentData, setPaymentData] = useState<CreateFinancingPayment>({
    financing_id: 0,
    account_id: 0,
    installment_number: 1,
    payment_amount: 0,
    principal_amount: 0,
    interest_amount: 0,
    payment_date: '',
    payment_method: 'boleto',
    payment_type: 'parcela',
    observations: '',
  });

  /**
   * Carrega os financiamentos
   */
  const loadFinancings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 50,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (typeFilter !== 'all') {
        params.financing_type = typeFilter;
      }
      
      const response = await financingService.getFinancings(params);
      setFinancings(response.financings);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Erro ao carregar financiamentos:', error);
      toast.error('Erro ao carregar financiamentos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega as estatísticas
   */
  const loadStats = async () => {
    if (!user) return;
    
    try {
      const response = await financingService.getStats();
      setStats(response);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  /**
   * Carrega a tabela de amortização
   */
  const loadAmortizationTable = async (financingId: number) => {
    try {
      const table = await financingService.getAmortizationTable(financingId);
      setAmortizationTable(table);
    } catch (error) {
      console.error('Erro ao carregar tabela de amortização:', error);
      toast.error('Erro ao carregar tabela de amortização');
    }
  };

  /**
   * Carrega os pagamentos de um financiamento
   */
  const loadPayments = async (financingId: number) => {
    try {
      const response = await financingService.getPayments({ financing_id: financingId });
      setPayments(response.payments);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast.error('Erro ao carregar pagamentos');
    }
  };

  /**
   * Cria um novo financiamento
   */
  const handleCreateFinancing = async () => {
    try {
      const errors = financingService.validateFinancing(formData);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }

      await financingService.createFinancing(formData);
      toast.success('Financiamento criado com sucesso');
      setShowCreateModal(false);
      setFormData({
        creditor_id: 0,
        financing_type: 'emprestimo_pessoal',
        total_amount: 0,
        interest_rate: 0,
        term_months: 0,
        start_date: '',
        description: '',
        contract_number: '',
        payment_method: 'boleto',
        observations: '',
        amortization_method: 'SAC',
      });
      loadFinancings();
      loadStats();
    } catch (error) {
      console.error('Erro ao criar financiamento:', error);
      toast.error('Erro ao criar financiamento');
    }
  };

  /**
   * Registra um pagamento
   */
  const handleCreatePayment = async () => {
    try {
      const errors = financingService.validatePayment(paymentData);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }

      await financingService.createPayment(paymentData);
      toast.success('Pagamento registrado com sucesso');
      setShowPaymentModal(false);
      setPaymentData({
        financing_id: 0,
        account_id: 0,
        installment_number: 1,
        payment_amount: 0,
        principal_amount: 0,
        interest_amount: 0,
        payment_date: '',
        payment_method: 'boleto',
        payment_type: 'parcela',
        observations: '',
      });
      loadFinancings();
      loadStats();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
  };

  /**
   * Exclui um financiamento
   */
  const handleDeleteFinancing = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este financiamento?')) return;
    
    try {
      await financingService.deleteFinancing(id);
      toast.success('Financiamento excluído com sucesso');
      loadFinancings();
      loadStats();
    } catch (error) {
      console.error('Erro ao excluir financiamento:', error);
      toast.error('Erro ao excluir financiamento');
    }
  };

  /**
   * Abre modal de tabela de amortização
   */
  const openAmortizationModal = async (financing: Financing) => {
    setSelectedFinancing(financing);
    setShowAmortizationModal(true);
    await loadAmortizationTable(financing.id);
  };

  /**
   * Abre modal de pagamento
   */
  const openPaymentModal = (financing: Financing) => {
    setSelectedFinancing(financing);
    setPaymentData({
      ...paymentData,
      financing_id: financing.id,
    });
    setShowPaymentModal(true);
    loadPayments(financing.id);
  };

  // Carrega dados ao montar o componente
  useEffect(() => {
    loadFinancings();
    loadStats();
  }, [user, currentPage, statusFilter, typeFilter]);

  // Filtra financiamentos por termo de busca
  const filteredFinancings = financings.filter(financing =>
    financing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    financing.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    financing.creditor?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando financiamentos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financiamentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus financiamentos e acompanhe o progresso de pagamento
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Financiamento
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Financiamentos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_financings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_financings} ativos, {stats.paid_financings} quitados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Financiado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financingService.formatCurrency(stats.total_borrowed)}
              </div>
              <p className="text-xs text-muted-foreground">
                {financingService.formatCurrency(stats.total_remaining)} restantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financingService.formatPercentage(stats.average_interest_rate)}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de juros média anual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financingService.formatCurrency(stats.total_paid)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor total já pago
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar financiamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="quitado">Quitados</SelectItem>
            <SelectItem value="inadimplente">Inadimplentes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="hipoteca">Hipoteca</SelectItem>
            <SelectItem value="emprestimo_pessoal">Empréstimo Pessoal</SelectItem>
            <SelectItem value="veiculo">Veículo</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Financiamentos */}
      <div className="space-y-4">
        {filteredFinancings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum financiamento encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie seu primeiro financiamento para começar'}
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Financiamento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredFinancings.map((financing) => {
            const status = financingService.getFinancingStatus(financing);
            const progressPercentage = ((financing.total_amount - financing.remaining_balance) / financing.total_amount) * 100;
            
            return (
              <Card key={financing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {financing.description || 'Financiamento sem descrição'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {financing.creditor?.name} • {financingService.getFinancingTypeLabel(financing.financing_type)}
                          </p>
                        </div>
                        <Badge style={{ backgroundColor: status.color, color: 'white' }}>
                          {status.message}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Total</p>
                          <p className="font-semibold">{financingService.formatCurrency(financing.total_amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Saldo Devedor</p>
                          <p className="font-semibold">{financingService.formatCurrency(financing.remaining_balance)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Taxa de Juros</p>
                          <p className="font-semibold">{financingService.formatPercentage(financing.interest_rate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Prazo</p>
                          <p className="font-semibold">{financing.term_months} meses</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso do pagamento</span>
                          <span>{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Início: {financingService.formatDate(financing.start_date)}</span>
                        <span>•</span>
                        <span>{financingService.getAmortizationMethodLabel(financing.amortization_method)}</span>
                        <span>•</span>
                        <span>{financingService.getPaymentMethodLabel(financing.payment_method)}</span>
                        {financing.contract_number && (
                          <>
                            <span>•</span>
                            <span>Contrato: {financing.contract_number}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAmortizationModal(financing)}
                      >
                        <Calculator className="mr-2 h-4 w-4" />
                        Tabela
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPaymentModal(financing)}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pagar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* TODO: Implementar edição */}}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFinancing(financing.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de Criação */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Financiamento</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo financiamento para começar o acompanhamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditor_id">Credor *</Label>
              <Input
                id="creditor_id"
                type="number"
                placeholder="ID do credor"
                value={formData.creditor_id || ''}
                onChange={(e) => setFormData({ ...formData, creditor_id: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financing_type">Tipo de Financiamento *</Label>
              <Select
                value={formData.financing_type}
                onValueChange={(value: any) => setFormData({ ...formData, financing_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hipoteca">Hipoteca</SelectItem>
                  <SelectItem value="emprestimo_pessoal">Empréstimo Pessoal</SelectItem>
                  <SelectItem value="veiculo">Financiamento de Veículo</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_amount">Valor Total *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.total_amount || ''}
                onChange={(e) => setFormData({ ...formData, total_amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Taxa de Juros Anual (%) *</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.interest_rate || ''}
                onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term_months">Prazo (meses) *</Label>
              <Input
                id="term_months"
                type="number"
                placeholder="12"
                value={formData.term_months || ''}
                onChange={(e) => setFormData({ ...formData, term_months: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: any) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="debito_automatico">Débito Automático</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amortization_method">Método de Amortização *</Label>
              <Select
                value={formData.amortization_method}
                onValueChange={(value: any) => setFormData({ ...formData, amortization_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAC">SAC</SelectItem>
                  <SelectItem value="Price">Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Descrição do financiamento"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contract_number">Número do Contrato</Label>
              <Input
                id="contract_number"
                placeholder="Número do contrato"
                value={formData.contract_number || ''}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Observações adicionais"
                value={formData.observations || ''}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFinancing}>
              Criar Financiamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Tabela de Amortização */}
      <Dialog open={showAmortizationModal} onOpenChange={setShowAmortizationModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tabela de Amortização</DialogTitle>
            <DialogDescription>
              Tabela completa de amortização do financiamento
            </DialogDescription>
          </DialogHeader>
          {selectedFinancing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">{financingService.formatCurrency(selectedFinancing.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Juros</p>
                  <p className="font-semibold">{financingService.formatPercentage(selectedFinancing.interest_rate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prazo</p>
                  <p className="font-semibold">{selectedFinancing.term_months} meses</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método</p>
                  <p className="font-semibold">{selectedFinancing.amortization_method}</p>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor da Parcela</TableHead>
                    <TableHead>Amortização</TableHead>
                    <TableHead>Juros</TableHead>
                    <TableHead>Saldo Devedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {amortizationTable.map((row) => (
                    <TableRow key={row.installment}>
                      <TableCell>{row.installment}</TableCell>
                      <TableCell>{financingService.formatDate(row.payment_date)}</TableCell>
                      <TableCell>{financingService.formatCurrency(row.payment_amount)}</TableCell>
                      <TableCell>{financingService.formatCurrency(row.principal_amount)}</TableCell>
                      <TableCell>{financingService.formatCurrency(row.interest_amount)}</TableCell>
                      <TableCell>{financingService.formatCurrency(row.remaining_balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Registre um pagamento para o financiamento selecionado
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_account_id">Conta *</Label>
              <Input
                id="payment_account_id"
                type="number"
                placeholder="ID da conta"
                value={paymentData.account_id || ''}
                onChange={(e) => setPaymentData({ ...paymentData, account_id: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_installment">Número da Parcela *</Label>
              <Input
                id="payment_installment"
                type="number"
                placeholder="1"
                value={paymentData.installment_number || ''}
                onChange={(e) => setPaymentData({ ...paymentData, installment_number: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_amount">Valor do Pagamento *</Label>
              <Input
                id="payment_amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={paymentData.payment_amount || ''}
                onChange={(e) => setPaymentData({ ...paymentData, payment_amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_date">Data do Pagamento *</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento *</Label>
              <Select
                value={paymentData.payment_method}
                onValueChange={(value: any) => setPaymentData({ ...paymentData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="debito_automatico">Débito Automático</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_type">Tipo de Pagamento *</Label>
              <Select
                value={paymentData.payment_type}
                onValueChange={(value: any) => setPaymentData({ ...paymentData, payment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parcela">Parcela</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="antecipado">Antecipado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="principal_amount">Valor da Amortização</Label>
              <Input
                id="principal_amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={paymentData.principal_amount || ''}
                onChange={(e) => setPaymentData({ ...paymentData, principal_amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest_amount">Valor dos Juros</Label>
              <Input
                id="interest_amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={paymentData.interest_amount || ''}
                onChange={(e) => setPaymentData({ ...paymentData, interest_amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="payment_observations">Observações</Label>
              <Textarea
                id="payment_observations"
                placeholder="Observações do pagamento"
                value={paymentData.observations || ''}
                onChange={(e) => setPaymentData({ ...paymentData, observations: e.target.value })}
              />
            </div>
          </div>
          
          {/* Histórico de Pagamentos */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <Label>Histórico de Pagamentos</Label>
              <div className="max-h-32 overflow-y-auto border rounded-lg p-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center py-1 text-sm">
                    <span>Parcela {payment.installment_number}</span>
                    <span>{financingService.formatCurrency(payment.payment_amount)}</span>
                    <span>{financingService.formatDate(payment.payment_date)}</span>
                    <Badge variant={payment.status === 'pago' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePayment}>
              Registrar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 