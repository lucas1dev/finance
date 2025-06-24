/**
 * Página de Gerenciamento de Contas
 * @author Lucas
 *
 * @description
 * Interface completa para gerenciamento de contas bancárias com funcionalidades
 * de criação, edição, transferências, histórico de movimentações e relatórios
 *
 * @returns {JSX.Element} Página de contas renderizada
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet,
  PiggyBank,
  Building2,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Filter,
  DollarSign,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Target,
  Activity
} from 'lucide-react';
import accountService, { Account as ServiceAccount, AccountStats, BalanceEvolution } from '@/lib/accountService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Esquema de validação para conta bancária
 */
const accountSchema = z.object({
  bank_name: z.string().min(2, 'Nome da conta deve ter pelo menos 2 caracteres'),
  account_type: z.enum(['checking', 'savings', 'investment'], {
    required_error: 'Tipo de conta é obrigatório'
  }),
  balance: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Saldo deve ser um número válido maior ou igual a zero'
  }),
  description: z.string().optional()
});

/**
 * Esquema de validação para transferência
 */
const transferSchema = z.object({
  from_account_id: z.string().min(1, 'Conta de origem é obrigatória'),
  to_account_id: z.string().min(1, 'Conta de destino é obrigatória'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Valor deve ser maior que zero'
  }),
  description: z.string().min(1, 'Descrição é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória')
});

type AccountFormData = z.infer<typeof accountSchema>;
type TransferFormData = z.infer<typeof transferSchema>;

/**
 * Interface para conta local (com campos adicionais para UI)
 */
interface Account extends ServiceAccount {
  // Campos adicionais se necessário
}

/**
 * Interface para movimentação de conta
 */
interface AccountMovement {
  id: number;
  account_id: number;
  type: 'transfer_in' | 'transfer_out' | 'transaction' | 'adjustment';
  amount: number;
  description: string;
  date: string;
  created_at: string;
  related_transaction_id?: number;
  related_transfer_id?: number;
}

/**
 * Interface para estatísticas de conta
 */
interface AccountStatsLocal extends AccountStats {
  // Campos adicionais se necessário
}

/**
 * Componente principal de gerenciamento de contas bancárias
 * Permite visualizar, criar, editar e gerenciar contas bancárias
 * com funcionalidades de transferência e histórico de movimentações
 */
export function Accounts() {
  const { user, loading: authLoading } = useAuth();
  
  // Estados principais
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountStats, setAccountStats] = useState<AccountStatsLocal | null>(null);
  const [selectedAccountMovements, setSelectedAccountMovements] = useState<AccountMovement[]>([]);
  const [selectedAccountBalanceEvolution, setSelectedAccountBalanceEvolution] = useState<BalanceEvolution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Formulário de conta
  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      bank_name: '',
      account_type: 'checking',
      balance: '',
      description: ''
    }
  });

  // Formulário de transferência
  const transferForm = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_account_id: '',
      to_account_id: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  /**
   * Busca contas do usuário
   */
  const fetchAccounts = useCallback(async () => {
    console.log('🔍 [Accounts] Iniciando busca de contas...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await accountService.getAccounts();
      console.log('✅ [Accounts] Contas obtidas:', response);
      setAccounts(response || []);
    } catch (error: any) {
      console.error('❌ [Accounts] Erro ao buscar contas:', error);
      setError('Erro ao carregar contas. Tente novamente.');
      toast.error('Erro ao buscar contas');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca estatísticas das contas
   */
  const fetchAccountStats = useCallback(async () => {
    console.log('🔍 [Accounts] Iniciando busca de estatísticas...');
    try {
      const response = await accountService.getAccountStats();
      console.log('✅ [Accounts] Estatísticas obtidas:', response);
      setAccountStats(response);
    } catch (error: any) {
      console.error('❌ [Accounts] Erro ao buscar estatísticas:', error);
      toast.error('Erro ao buscar estatísticas das contas');
    }
  }, []);

  /**
   * Busca movimentações de uma conta específica
   */
  const fetchAccountMovements = useCallback(async (accountId: number) => {
    try {
      const response = await accountService.getAccountMovements(accountId, {
        limit: 50
      });
      setSelectedAccountMovements(response || []);
    } catch (error: any) {
      console.error('Erro ao buscar movimentações:', error);
      toast.error('Erro ao buscar histórico de movimentações');
    }
  }, []);

  /**
   * Busca evolução do saldo de uma conta
   */
  const fetchBalanceEvolution = useCallback(async (accountId: number) => {
    try {
      const response = await accountService.getBalanceEvolution(accountId, 30);
      setSelectedAccountBalanceEvolution(response || []);
    } catch (error: any) {
      console.error('Erro ao buscar evolução do saldo:', error);
      toast.error('Erro ao buscar evolução do saldo');
    }
  }, []);

  // Carrega dados iniciais
  useEffect(() => {
    console.log('🔄 [Accounts] useEffect executado - user:', user, 'authLoading:', authLoading);
    
    if (user && !authLoading) {
      console.log('✅ [Accounts] Usuário autenticado, carregando dados...');
      fetchAccounts();
      fetchAccountStats();
    } else {
      console.log('⏳ [Accounts] Aguardando autenticação...');
    }
  }, [user, authLoading, fetchAccounts, fetchAccountStats]);

  /**
   * Filtra contas por tipo
   */
  const filteredAccounts = useMemo(() => {
    if (filterType === 'all') return accounts;
    return accounts.filter(account => account.account_type === filterType);
  }, [accounts, filterType]);

  /**
   * Calcula saldo total consolidado
   */
  const totalBalance: number = useMemo(() => {
    const total = accounts.reduce((sum, account) => {
      const balance = Number(account.balance) || 0;
      return sum + balance;
    }, 0);
    
    // Garantir que o resultado é um número válido
    const result = typeof total === 'number' && !isNaN(total) ? total : 0;
    console.log('💰 [Accounts] Saldo total calculado:', result, 'de', accounts.length, 'contas');
    return result;
  }, [accounts]);

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
   * Obtém ícone baseado no tipo de conta
   */
  const getAccountIcon = (type: string) => {
    const iconMap: { [key: string]: React.ElementType } = {
      checking: Wallet,
      savings: PiggyBank,
      investment: TrendingUp
    };
    return iconMap[type] || Building2;
  };

  /**
   * Obtém cor baseada no tipo de conta
   */
  const getAccountColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      checking: 'text-blue-600',
      savings: 'text-green-600',
      investment: 'text-purple-600'
    };
    return colorMap[type] || 'text-gray-600';
  };

  /**
   * Obtém nome do tipo de conta
   */
  const getAccountTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      checking: 'Conta Corrente',
      savings: 'Conta Poupança',
      investment: 'Conta Investimento'
    };
    return typeMap[type] || type;
  };

  /**
   * Abre modal para criar/editar conta
   */
  const handleOpenModal = useCallback((account?: Account) => {
    if (account) {
      setEditingAccount(account);
      accountForm.reset({
        bank_name: account.bank_name,
        account_type: account.account_type,
        balance: account.balance.toString(),
        description: account.description || ''
      });
    } else {
      setEditingAccount(null);
      accountForm.reset();
    }
    setIsModalOpen(true);
  }, [accountForm]);

  /**
   * Fecha modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingAccount(null);
    accountForm.reset();
  }, [accountForm]);

  /**
   * Submete formulário de conta
   */
  const onSubmitAccount = useCallback(async (data: AccountFormData) => {
    try {
      if (editingAccount) {
        await accountService.updateAccount(editingAccount.id, {
          bank_name: data.bank_name,
          account_type: data.account_type,
          balance: parseFloat(data.balance),
          description: data.description
        });
        toast.success('Conta atualizada com sucesso');
      } else {
        await accountService.createAccount({
          bank_name: data.bank_name,
          account_type: data.account_type,
          balance: parseFloat(data.balance),
          description: data.description
        });
        toast.success('Conta criada com sucesso');
      }
      
      handleCloseModal();
      fetchAccounts();
      fetchAccountStats();
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error);
      toast.error('Erro ao salvar conta');
    }
  }, [editingAccount, handleCloseModal, fetchAccounts, fetchAccountStats]);

  /**
   * Exclui conta
   */
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) {
      return;
    }

    try {
      await accountService.deleteAccount(id);
      toast.success('Conta excluída com sucesso');
      fetchAccounts();
      fetchAccountStats();
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
    }
  }, [fetchAccounts, fetchAccountStats]);

  /**
   * Submete formulário de transferência
   */
  const onSubmitTransfer = useCallback(async (data: TransferFormData) => {
    try {
      await accountService.transferBetweenAccounts({
        from_account_id: parseInt(data.from_account_id),
        to_account_id: parseInt(data.to_account_id),
        amount: parseFloat(data.amount),
        description: data.description,
        date: data.date
      });
      
      toast.success('Transferência realizada com sucesso');
      setIsTransferModalOpen(false);
      transferForm.reset();
      fetchAccounts();
      fetchAccountStats();
    } catch (error: any) {
      console.error('Erro ao realizar transferência:', error);
      toast.error('Erro ao realizar transferência');
    }
  }, [transferForm, fetchAccounts, fetchAccountStats]);

  /**
   * Exporta movimentações de uma conta
   */
  const handleExportMovements = useCallback(async (accountId: number) => {
    try {
      const blob = await accountService.exportAccountMovements(accountId);
      
      // Cria link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `movimentacoes-conta-${accountId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Movimentações exportadas com sucesso');
    } catch (error) {
      console.error('Erro ao exportar movimentações:', error);
      toast.error('Erro ao exportar movimentações');
    }
  }, []);

  /**
   * Seleciona conta para visualizar detalhes
   */
  const handleSelectAccount = useCallback((account: Account) => {
    setSelectedAccount(account);
    fetchAccountMovements(account.id);
    fetchBalanceEvolution(account.id);
    setActiveTab('details');
  }, [fetchAccountMovements, fetchBalanceEvolution]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minhas Contas</h1>
          <p className="text-muted-foreground">Gerencie suas contas bancárias e transferências</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBalances(!showBalances)}>
            {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showBalances ? 'Ocultar' : 'Mostrar'} Saldos
          </Button>
          <Button variant="outline" onClick={() => handleExportMovements(selectedAccount?.id || 0)}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Movimentações
          </Button>
          <Button onClick={() => setIsTransferModalOpen(true)}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Transferir
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalances ? 
                (typeof totalBalance === 'number' && !isNaN(totalBalance) ? 
                  `R$ ${totalBalance.toFixed(2)}` : 
                  'R$ 0,00'
                ) : 
                '••••••'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Correntes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.filter(a => a.account_type === 'checking').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Poupanças</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.filter(a => a.account_type === 'savings').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas de reserva
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.filter(a => a.account_type === 'investment').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas de investimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            <SelectItem value="checking">Contas Correntes</SelectItem>
            <SelectItem value="savings">Poupanças</SelectItem>
            <SelectItem value="investment">Investimentos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((account) => (
          <Card key={account.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${getAccountColor(account.account_type)} text-white`}>
                    {React.createElement(getAccountIcon(account.account_type))}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{account.bank_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getAccountTypeName(account.account_type)}</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {account.account_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {showBalances && (
                <div className="mt-4">
                  <div className="text-2xl font-bold">
                    {formatCurrency(account.balance)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Saldo atual
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAccount(account)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Detalhes
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(account)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Conta */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </DialogTitle>
          </DialogHeader>
          <Form {...accountForm}>
            <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="space-y-4">
              <FormField
                control={accountForm.control}
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Conta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Banco do Brasil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={accountForm.control}
                name="account_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Conta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Conta Corrente</SelectItem>
                        <SelectItem value="savings">Conta Poupança</SelectItem>
                        <SelectItem value="investment">Conta Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={accountForm.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Inicial</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={accountForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição da conta..." {...field} />
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
                  {editingAccount ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Transferência */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transferência</DialogTitle>
          </DialogHeader>
          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit(onSubmitTransfer)} className="space-y-4">
              <FormField
                control={transferForm.control}
                name="from_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de Origem</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta de origem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.bank_name} - {getAccountTypeName(account.account_type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transferForm.control}
                name="to_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de Destino</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta de destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.bank_name} - {getAccountTypeName(account.account_type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transferForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transferForm.control}
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

              <FormField
                control={transferForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição da transferência..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Transferir
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Conta */}
      {selectedAccount && (
        <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Conta - {selectedAccount.bank_name}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="transactions">Transações</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Informações da Conta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nome:</span>
                        <span className="text-sm font-medium">{selectedAccount.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tipo:</span>
                        <span className="text-sm font-medium">{getAccountTypeName(selectedAccount.account_type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Saldo:</span>
                        <span className="text-sm font-medium">{showBalances ? `R$ ${selectedAccount.balance.toFixed(2)}` : '••••••'}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Saldo Atual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        R$ {selectedAccount.balance.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="transactions" className="space-y-4">
                <div className="space-y-2">
                  {selectedAccountMovements.length > 0 ? (
                    selectedAccountMovements.map((movement) => (
                      <Card key={movement.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{movement.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(movement.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${
                                movement.type === 'transfer_in' ? 'text-green-600' : 
                                movement.type === 'transfer_out' ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {movement.type === 'transfer_in' ? '+' : '-'}
                                {formatCurrency(movement.amount)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {movement.type === 'transfer_in' ? 'Receita' : 
                                 movement.type === 'transfer_out' ? 'Despesa' : 'Transferência'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma transação encontrada para esta conta.
                    </p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Ações da Conta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedAccount(null);
                        handleOpenModal(selectedAccount);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Conta
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedAccount(null);
                        setIsTransferModalOpen(true);
                      }}
                    >
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Fazer Transferência
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedAccount(null);
                        handleDelete(selectedAccount.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Conta
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando contas...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAccounts.length === 0 && (
        <div className="text-center py-8">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Nenhuma conta encontrada</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => handleOpenModal()}
          >
            Criar Primeira Conta
          </Button>
        </div>
      )}
    </div>
  );
}

export default Accounts; 