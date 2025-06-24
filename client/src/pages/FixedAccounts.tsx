import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Clock,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import fixedAccountService, {
  FixedAccount,
  FixedAccountFilters,
  FixedAccountStats,
} from '@/lib/fixedAccountService';
import categoryService, { Category } from '@/lib/categoryService';
import supplierService, { Supplier } from '@/lib/supplierService';
import { FixedAccountFormSimple } from '@/components/FixedAccountFormSimple';

/**
 * Página de gerenciamento de contas fixas
 */
export default function FixedAccounts() {
  const [fixedAccounts, setFixedAccounts] = useState<FixedAccount[]>([]);
  const [stats, setStats] = useState<FixedAccountStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFixedAccount, setSelectedFixedAccount] = useState<FixedAccount | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState<number | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingStats(true);

      console.log('🔍 FixedAccounts - Carregando dados...');

      // Carregar dados em paralelo
      const [fixedAccountsData, statsData, categoriesData, suppliersData] = await Promise.all([
        fixedAccountService.getFixedAccounts(),
        fixedAccountService.getFixedAccountStats(),
        categoryService.getCategoriesByType('expense'),
        supplierService.getSuppliers(),
      ]);

      console.log('✅ FixedAccounts - Dados carregados:', {
        fixedAccounts: fixedAccountsData.data.length,
        categories: categoriesData.length,
        suppliers: Array.isArray(suppliersData) ? suppliersData.length : suppliersData.data?.length || 0,
      });

      setFixedAccounts(fixedAccountsData.data);
      setStats(statsData);
      setCategories(categoriesData);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.data || []);
    } catch (error) {
      console.error('❌ FixedAccounts - Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  };

  // Filtrar contas fixas
  const filteredFixedAccounts = fixedAccounts.filter((account) => {
    const matchesSearch = account.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriodicity = selectedPeriodicity === 'all' || account.periodicity === selectedPeriodicity;
    const matchesCategory = selectedCategory === 'all' || account.category_id.toString() === selectedCategory;
    const matchesSupplier = selectedSupplier === 'all' || account.supplier_id?.toString() === selectedSupplier;
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'active' && account.is_active) ||
      (selectedStatus === 'inactive' && !account.is_active) ||
      (selectedStatus === 'paid' && account.is_paid) ||
      (selectedStatus === 'unpaid' && !account.is_paid);

    return matchesSearch && matchesPeriodicity && matchesCategory && matchesSupplier && matchesStatus;
  });

  // Criar conta fixa
  const handleCreateFixedAccount = async (data: any) => {
    try {
      console.log('🔍 FixedAccounts - Criando conta fixa:', data);
      const newFixedAccount = await fixedAccountService.createFixedAccount(data);
      setFixedAccounts(prev => [newFixedAccount, ...prev]);
      setShowCreateDialog(false);
      toast.success('Conta fixa criada com sucesso');
      loadData(); // Recarregar estatísticas
    } catch (error: any) {
      console.error('❌ FixedAccounts - Erro ao criar conta fixa:', error);
      toast.error(error.message || 'Erro ao criar conta fixa');
    }
  };

  // Atualizar conta fixa
  const handleUpdateFixedAccount = async (data: any) => {
    if (!selectedFixedAccount) return;
    
    try {
      console.log('🔍 FixedAccounts - Atualizando conta fixa:', selectedFixedAccount.id, data);
      const updatedFixedAccount = await fixedAccountService.updateFixedAccount(selectedFixedAccount.id, data);
      setFixedAccounts(prev => prev.map(account => 
        account.id === selectedFixedAccount.id ? updatedFixedAccount : account
      ));
      setShowEditDialog(false);
      setSelectedFixedAccount(null);
      toast.success('Conta fixa atualizada com sucesso');
      loadData(); // Recarregar estatísticas
    } catch (error: any) {
      console.error('❌ FixedAccounts - Erro ao atualizar conta fixa:', error);
      toast.error(error.message || 'Erro ao atualizar conta fixa');
    }
  };

  // Excluir conta fixa
  const handleDeleteFixedAccount = async (id: number) => {
    try {
      setProcessingAction(id);
      console.log('🔍 FixedAccounts - Excluindo conta fixa:', id);
      await fixedAccountService.deleteFixedAccount(id);
      setFixedAccounts(prev => prev.filter(account => account.id !== id));
      toast.success('Conta fixa excluída com sucesso');
      loadData(); // Recarregar estatísticas
    } catch (error: any) {
      console.error('❌ FixedAccounts - Erro ao excluir conta fixa:', error);
      toast.error(error.message || 'Erro ao excluir conta fixa');
    } finally {
      setProcessingAction(null);
    }
  };

  // Ativar/desativar conta fixa
  const handleToggleFixedAccount = async (id: number, isActive: boolean) => {
    try {
      setProcessingAction(id);
      console.log('🔍 FixedAccounts - Alterando status da conta fixa:', id, isActive);
      const updatedFixedAccount = await fixedAccountService.toggleFixedAccount(id, isActive);
      setFixedAccounts(prev => prev.map(account => 
        account.id === id ? updatedFixedAccount : account
      ));
      toast.success(`Conta fixa ${isActive ? 'ativada' : 'desativada'} com sucesso`);
      loadData(); // Recarregar estatísticas
    } catch (error: any) {
      console.error('❌ FixedAccounts - Erro ao alterar status da conta fixa:', error);
      toast.error(error.message || 'Erro ao alterar status da conta fixa');
    } finally {
      setProcessingAction(null);
    }
  };

  // Marcar como paga
  const handlePayFixedAccount = async (id: number) => {
    try {
      setProcessingAction(id);
      console.log('🔍 FixedAccounts - Marcando conta fixa como paga:', id);
      await fixedAccountService.payFixedAccount(id);
      setFixedAccounts(prev => prev.map(account => 
        account.id === id ? { ...account, is_paid: true } : account
      ));
      toast.success('Conta fixa marcada como paga');
      loadData(); // Recarregar estatísticas
    } catch (error: any) {
      console.error('❌ FixedAccounts - Erro ao marcar conta fixa como paga:', error);
      toast.error(error.message || 'Erro ao marcar conta fixa como paga');
    } finally {
      setProcessingAction(null);
    }
  };

  // Exportar dados
  const handleExport = async () => {
    try {
      console.log('🔍 FixedAccounts - Exportando dados...');
      const filters: FixedAccountFilters = {
        search: searchTerm || undefined,
        periodicity: selectedPeriodicity === 'all' ? undefined : selectedPeriodicity || undefined,
        category_id: selectedCategory === 'all' ? undefined : selectedCategory ? parseInt(selectedCategory) : undefined,
        supplier_id: selectedSupplier === 'all' ? undefined : selectedSupplier ? parseInt(selectedSupplier) : undefined,
        is_active: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
        is_paid: selectedStatus === 'paid' ? true : selectedStatus === 'unpaid' ? false : undefined,
      };

      const blob = await fixedAccountService.exportFixedAccounts(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contas-fixas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('❌ FixedAccounts - Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPeriodicity('all');
    setSelectedCategory('all');
    setSelectedSupplier('all');
    setSelectedStatus('all');
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Verificar se está em atraso
  const isOverdue = (nextDueDate: string) => {
    return fixedAccountService.isOverdue(nextDueDate);
  };

  // Obter cor do status
  const getStatusColor = (isPaid: boolean, isOverdue: boolean) => {
    return fixedAccountService.getStatusColor(isPaid, isOverdue);
  };

  // Obter label do status
  const getStatusLabel = (isPaid: boolean, isOverdue: boolean) => {
    return fixedAccountService.getStatusLabel(isPaid, isOverdue);
  };

  // Obter label da periodicidade
  const getPeriodicityLabel = (periodicity: string) => {
    return fixedAccountService.getPeriodicityLabel(periodicity);
  };

  // Obter label do método de pagamento
  const getPaymentMethodLabel = (method: string) => {
    return fixedAccountService.getPaymentMethodLabel(method);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas Fixas</h1>
          <p className="text-muted-foreground">
            Gerencie suas despesas recorrentes e contas fixas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => {
            console.log('🔍 FixedAccounts - Botão Nova Conta Fixa clicado');
            setShowCreateDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta Fixa
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {!loadingStats && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalAmount)} em valor total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <p className="text-xs text-muted-foreground">
                Contas fixas ativas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.unpaid}
              </div>
              <p className="text-xs text-muted-foreground">
                A pagar este mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.overdue}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.overdue} conta(s) em atraso
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Periodicidade</label>
              <Select value={selectedPeriodicity} onValueChange={setSelectedPeriodicity}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fornecedor</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
                  <SelectItem value="unpaid">Não Pagas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Fixas ({filteredFixedAccounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : filteredFixedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma conta fixa encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Periodicidade</TableHead>
                    <TableHead>Próximo Vencimento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFixedAccounts.map((account) => {
                    const category = categories.find(c => c.id === account.category_id);
                    const supplier = suppliers.find(s => s.id === account.supplier_id);
                    const overdue = isOverdue(account.next_due_date);
                    
                    return (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{account.description}</div>
                            {supplier && (
                              <div className="text-sm text-muted-foreground">
                                {supplier.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(account.amount)}
                        </TableCell>
                        <TableCell>
                          {getPeriodicityLabel(account.periodicity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(account.next_due_date)}
                            {overdue && (
                              <Badge variant="destructive" className="text-xs">
                                {fixedAccountService.calculateDaysOverdue(account.next_due_date)} dias
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {category && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(account.is_paid, overdue)}>
                              {getStatusLabel(account.is_paid, overdue)}
                            </Badge>
                            {!account.is_active && (
                              <Badge variant="secondary">Inativa</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedFixedAccount(account);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedFixedAccount(account);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!account.is_paid && (
                                <DropdownMenuItem
                                  onClick={() => handlePayFixedAccount(account.id)}
                                  disabled={processingAction === account.id}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como Paga
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleToggleFixedAccount(account.id, !account.is_active)}
                                disabled={processingAction === account.id}
                              >
                                {account.is_active ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a conta fixa "{account.description}"?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteFixedAccount(account.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogos */}
      {/* Diálogo de Criação */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        console.log('🔍 FixedAccounts - Diálogo de criação:', open);
        setShowCreateDialog(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Conta Fixa</DialogTitle>
            <DialogDescription>
              Crie uma nova conta fixa para gerenciar despesas recorrentes.
            </DialogDescription>
          </DialogHeader>
          <FixedAccountFormSimple
            onSubmit={handleCreateFixedAccount}
            onCancel={() => {
              console.log('🔍 FixedAccounts - Cancelando criação');
              setShowCreateDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Conta Fixa</DialogTitle>
            <DialogDescription>
              Edite os dados da conta fixa selecionada.
            </DialogDescription>
          </DialogHeader>
          {selectedFixedAccount && (
            <FixedAccountFormSimple
              initialData={selectedFixedAccount}
              onSubmit={handleUpdateFixedAccount}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedFixedAccount(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Conta Fixa</DialogTitle>
            <DialogDescription>
              Visualize os detalhes completos da conta fixa.
            </DialogDescription>
          </DialogHeader>
          {selectedFixedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="text-sm">{selectedFixedAccount.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor</label>
                  <p className="text-sm font-medium">{formatCurrency(selectedFixedAccount.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Periodicidade</label>
                  <p className="text-sm">{getPeriodicityLabel(selectedFixedAccount.periodicity)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                  <p className="text-sm">{formatDate(selectedFixedAccount.start_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Próximo Vencimento</label>
                  <p className="text-sm">{formatDate(selectedFixedAccount.next_due_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedFixedAccount.is_paid, isOverdue(selectedFixedAccount.next_due_date))}>
                      {getStatusLabel(selectedFixedAccount.is_paid, isOverdue(selectedFixedAccount.next_due_date))}
                    </Badge>
                    {!selectedFixedAccount.is_active && (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  {categories.find(c => c.id === selectedFixedAccount.category_id) && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: categories.find(c => c.id === selectedFixedAccount.category_id)?.color }}
                      />
                      <span className="text-sm">{categories.find(c => c.id === selectedFixedAccount.category_id)?.name}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fornecedor</label>
                  <p className="text-sm">
                    {suppliers.find(s => s.id === selectedFixedAccount.supplier_id)?.name || 'Não especificado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Método de Pagamento</label>
                  <p className="text-sm">
                    {selectedFixedAccount.payment_method ? getPaymentMethodLabel(selectedFixedAccount.payment_method) : 'Não especificado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dias de Lembrete</label>
                  <p className="text-sm">{selectedFixedAccount.reminder_days} dias</p>
                </div>
              </div>
              
              {selectedFixedAccount.observations && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="text-sm">{selectedFixedAccount.observations}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setSelectedFixedAccount(null);
                  }}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setShowEditDialog(true);
                  }}
                >
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 