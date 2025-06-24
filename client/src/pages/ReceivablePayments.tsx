/**
 * Página de Pagamentos de Recebíveis
 * Permite visualizar e gerenciar pagamentos vinculados a recebíveis do sistema.
 *
 * @module pages/ReceivablePayments
 * @description Interface para controle de pagamentos de recebíveis, com histórico, filtros, ações e relatórios.
 *
 * @example
 * // Navegação para a página
 * <Link to="/receivable-payments">Pagamentos de Recebíveis</Link>
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';
import receivablePaymentService, { 
  ReceivablePayment, 
  ReceivablePaymentFilters, 
  ReceivablePaymentStats,
  PaginationParams 
} from '../lib/receivablePaymentService';
import accountService from '../lib/accountService';
import { Account } from '../lib/accountService';

/**
 * Componente principal da página de Pagamentos de Recebíveis
 * @returns {JSX.Element} Página de pagamentos de recebíveis
 */
export default function ReceivablePayments() {
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<ReceivablePayment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<ReceivablePayment[]>([]);
  const [stats, setStats] = useState<ReceivablePaymentStats | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sort_by: 'payment_date',
    sort_order: 'desc'
  });

  /**
   * Carrega os dados iniciais
   */
  useEffect(() => {
    loadData();
    loadAccounts();
  }, []);

  /**
   * Carrega os pagamentos e estatísticas
   */
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 ReceivablePayments - Carregando dados...');

      // Carregar pagamentos
      const filters: ReceivablePaymentFilters = {};
      if (search) filters.receivable_id = parseInt(search) || undefined;
      if (dateFrom) filters.start_date = dateFrom;
      if (dateTo) filters.end_date = dateTo;

      const paymentsResponse = await receivablePaymentService.getPayments(filters, pagination);
      setPayments(paymentsResponse.data);

      // Carregar estatísticas
      const statsData = await receivablePaymentService.getPaymentStats('month');
      setStats(statsData);

      console.log('✅ ReceivablePayments - Dados carregados com sucesso');
    } catch (error: any) {
      console.error('❌ ReceivablePayments - Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados dos pagamentos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega as contas bancárias
   */
  const loadAccounts = async () => {
    try {
      console.log('🔍 ReceivablePayments - Carregando contas bancárias...');
      const accountsData = await accountService.getAccounts();
      setAccounts(accountsData);
      console.log('✅ ReceivablePayments - Contas bancárias carregadas:', accountsData.length);
    } catch (error: any) {
      console.error('❌ ReceivablePayments - Erro ao carregar contas bancárias:', error);
      toast.error('Erro ao carregar contas bancárias');
    }
  };

  /**
   * Exporta relatório de pagamentos
   */
  const handleExport = async () => {
    try {
      setLoadingExport(true);
      console.log('🔍 ReceivablePayments - Exportando pagamentos...');

      const filters: ReceivablePaymentFilters = {};
      if (search) filters.receivable_id = parseInt(search) || undefined;
      if (dateFrom) filters.start_date = dateFrom;
      if (dateTo) filters.end_date = dateTo;

      const blob = await receivablePaymentService.exportPayments(filters);
      
      // Criar link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pagamentos-recebiveis-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Relatório exportado com sucesso');
      console.log('✅ ReceivablePayments - Relatório exportado com sucesso');
    } catch (error: any) {
      console.error('❌ ReceivablePayments - Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setLoadingExport(false);
    }
  };

  /**
   * Confirma pagamento manual
   * @param paymentId - ID do pagamento
   */
  const handleConfirmPayment = async (paymentId: number) => {
    try {
      console.log(`🔍 ReceivablePayments - Confirmando pagamento ID: ${paymentId}`);
      // Aqui você pode implementar a lógica para confirmar o pagamento
      // Por exemplo, atualizar o status do pagamento
      toast.success('Pagamento confirmado com sucesso');
      setConfirmDialogOpen(false);
      loadData(); // Recarregar dados
    } catch (error: any) {
      console.error('❌ ReceivablePayments - Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    }
  };

  /**
   * Abre modal de detalhes do pagamento
   * @param payment - Pagamento selecionado
   */
  const handleViewDetails = (payment: ReceivablePayment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  /**
   * Filtro de busca e filtros para pagamentos
   */
  const filteredPayments = useMemo(() => {
    let result = payments;
    
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(p =>
        p.receivable?.description?.toLowerCase().includes(term) ||
        p.receivable?.customer?.name?.toLowerCase().includes(term) ||
        p.receivable?.customer?.email?.toLowerCase().includes(term) ||
        p.notes?.toLowerCase().includes(term) ||
        p.reference?.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter) {
      result = result.filter(p => p.receivable?.status === statusFilter);
    }
    
    return result;
  }, [payments, search, statusFilter]);

  /**
   * Formata valor monetário
   */
  function formatCurrency(value: number) {
    return receivablePaymentService.formatCurrency(value);
  }

  /**
   * Formata data
   */
  function formatDate(date: string) {
    return receivablePaymentService.formatDate(date);
  }

  /**
   * Retorna variante do badge baseado no status
   */
  function getStatusVariant(status: string) {
    switch (status) {
      case 'paid':
        return 'default';
      case 'partially_paid':
        return 'secondary';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  /**
   * Retorna texto do status
   */
  function getStatusText(status: string) {
    return receivablePaymentService.getStatusLabel(status);
  }

  /**
   * Obtém nome da conta bancária
   */
  function getAccountName(accountId: number): string {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.bank_name} - ${account.account_type}` : 'N/A';
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos de Recebíveis</h1>
          <p className="text-muted-foreground">
            Gerencie pagamentos de contas a receber e controle de fluxo de caixa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={loadingExport}>
            {loadingExport ? 'Exportando...' : 'Exportar'}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats?.total_payments || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Este mês
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : formatCurrency(stats?.total_amount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Este mês
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : formatCurrency(stats?.average_amount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por pagamento
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats?.top_customers?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Com mais pagamentos
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos por Método</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <div className="space-y-2">
                    {stats?.payments_by_method?.map((method) => (
                      <div key={method.method} className="flex justify-between items-center">
                        <span className="text-sm">
                          {receivablePaymentService.getPaymentMethodLabel(method.method)}
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(method.amount)} ({method.count})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pagamentos por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <div className="space-y-2">
                    {stats?.payments_by_month?.slice(0, 6).map((month) => (
                      <div key={month.month} className="flex justify-between items-center">
                        <span className="text-sm">
                          {new Date(month.month + '-01').toLocaleDateString('pt-BR', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(month.amount)} ({month.count})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Buscar por cliente, descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="">Todos os status</option>
              <option value="paid">Pago</option>
              <option value="partially_paid">Parcialmente Pago</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Vencido</option>
            </select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Data inicial"
              className="sm:max-w-xs"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Data final"
              className="sm:max-w-xs"
            />
            <Button onClick={loadData} disabled={loading}>
              {loading ? 'Carregando...' : 'Filtrar'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Lista de todos os pagamentos recebidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando pagamentos...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Nenhum pagamento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {payment.receivable?.customer?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payment.receivable?.customer?.email || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.receivable?.description || 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {formatDate(payment.payment_date)}
                          </TableCell>
                          <TableCell>
                            {receivablePaymentService.getPaymentMethodLabel(payment.payment_method)}
                          </TableCell>
                          <TableCell>
                            {getAccountName(payment.account_id)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(payment.receivable?.status || '')}>
                              {getStatusText(payment.receivable?.status || '')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(payment)}
                              >
                                Detalhes
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Clientes</CardTitle>
              <CardDescription>
                Clientes com maior volume de pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="space-y-4">
                  {stats?.top_customers?.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.total_payments} pagamentos
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(customer.total_amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total recebido
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Pagamento */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o pagamento selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <p className="text-sm">{selectedPayment.receivable?.customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm">{selectedPayment.receivable?.customer?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor</label>
                  <p className="text-sm font-medium">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Data do Pagamento</label>
                  <p className="text-sm">{formatDate(selectedPayment.payment_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Método</label>
                  <p className="text-sm">
                    {receivablePaymentService.getPaymentMethodLabel(selectedPayment.payment_method)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Conta</label>
                  <p className="text-sm">{getAccountName(selectedPayment.account_id)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Referência</label>
                  <p className="text-sm">{selectedPayment.reference || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm">
                    <Badge variant={getStatusVariant(selectedPayment.receivable?.status || '')}>
                      {getStatusText(selectedPayment.receivable?.status || '')}
                    </Badge>
                  </p>
                </div>
              </div>
              {selectedPayment.notes && (
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <p className="text-sm">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja confirmar este pagamento? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedPayment && handleConfirmPayment(selectedPayment.id)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
