/**
 * Página de Gerenciamento de Clientes
 * @author Lucas
 *
 * @description
 * Interface completa para gerenciamento de clientes com funcionalidades
 * de criação, edição, estatísticas, gráficos e relatórios
 *
 * @returns {JSX.Element} Página de clientes renderizada
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
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  DollarSign,
  Calendar,
  Building2,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import customerService, { Customer as ServiceCustomer, CustomerStats as ServiceCustomerStats } from '@/lib/customerService';

/**
 * Esquema de validação para cliente
 */
const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  documentType: z.enum(['CPF', 'CNPJ'], {
    required_error: 'Tipo de documento é obrigatório'
  }),
  document: z.string().min(11, 'Documento deve ter pelo menos 11 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

/**
 * Interface para cliente local (com campos adicionais para UI)
 */
interface Customer extends ServiceCustomer {
  // Campos adicionais se necessário
}

/**
 * Interface para estatísticas de clientes local
 */
interface CustomerStats extends ServiceCustomerStats {
  // Campos adicionais se necessário
}

/**
 * Componente principal de gerenciamento de clientes
 * Permite visualizar, criar, editar e gerenciar clientes
 * com funcionalidades de estatísticas e relatórios
 */
export function Customers() {
  const { user } = useAuth();
  
  // Estados principais
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Formulário de cliente
  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      documentType: 'CPF',
      document: '',
      email: '',
      phone: '',
    }
  });

  /**
   * Calcula estatísticas dos clientes localmente
   */
  const calculateCustomerStats = useCallback((customersData: Customer[]) => {
    try {
      const total_customers = customersData.length;
      const active_customers = customersData.filter(c => c.status === 'ativo').length;
      const inactive_customers = customersData.filter(c => c.status === 'inativo').length;
      const pending_customers = customersData.filter(c => c.status === 'pendente').length;
      
      const total_receivables = customersData.reduce((sum, c) => sum + (c.total_receivables || 0), 0);
      const average_receivables_per_customer = total_customers > 0 ? total_receivables / total_customers : 0;
      
      const top_customers = customersData
        .filter(c => c.total_receivables && c.total_receivables > 0)
        .sort((a, b) => (b.total_receivables || 0) - (a.total_receivables || 0))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          total_receivables: c.total_receivables || 0,
          receivables_count: c.receivables_count || 0
        }));
      
      const customers_by_status = [
        { status: 'ativo', count: active_customers, percentage: total_customers > 0 ? (active_customers / total_customers) * 100 : 0 },
        { status: 'inativo', count: inactive_customers, percentage: total_customers > 0 ? (inactive_customers / total_customers) * 100 : 0 },
        { status: 'pendente', count: pending_customers, percentage: total_customers > 0 ? (pending_customers / total_customers) * 100 : 0 }
      ];
      
      const stats: CustomerStats = {
        total_customers,
        active_customers,
        inactive_customers,
        pending_customers,
        total_receivables,
        average_receivables_per_customer,
        top_customers,
        customers_by_status
      };
      
      setCustomerStats(stats);
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  }, []);

  /**
   * Carrega os clientes do usuário
   */
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Chamando CustomerService.getCustomers()...');
      const response = await customerService.getCustomers();
      console.log('📋 Resposta do CustomerService.getCustomers():', response);
      
      let customersData: Customer[] = [];
      
      // Tratar diferentes formatos de resposta
      if (Array.isArray(response)) {
        customersData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        const responseObj = response as { data: any };
        customersData = Array.isArray(responseObj.data) ? responseObj.data : [];
      }
      
      console.log('📊 Dados finais dos clientes:', customersData);
      setCustomers(customersData);
      
      // Calcular estatísticas localmente com os dados já carregados
      calculateCustomerStats(customersData);
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, [calculateCustomerStats]);

  // Carrega dados iniciais apenas uma vez quando o componente monta
  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user, loadCustomers]);

  /**
   * Filtra e ordena clientes
   */
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.document.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    // Filtro por tipo de documento
    if (documentTypeFilter !== 'all') {
      filtered = filtered.filter(customer => customer.documentType === documentTypeFilter);
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Customer];
      let bValue: any = b[sortBy as keyof Customer];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [customers, searchTerm, documentTypeFilter, statusFilter, sortBy, sortOrder]);

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
   * Formata documento
   */
  const formatDocument = (document: string, documentType: 'CPF' | 'CNPJ') => {
    if (!document) return '-';
    
    return documentType === 'CPF'
      ? customerService.formatCPF(document)
      : customerService.formatCNPJ(document);
  };

  /**
   * Obtém cor do status
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-red-100 text-red-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Obtém label do status
   */
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'pendente': return 'Pendente';
      default: return 'Desconhecido';
    }
  };

  /**
   * Abre modal para criar/editar cliente
   */
  const handleOpenModal = useCallback((customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      customerForm.reset({
        name: customer.name,
        documentType: customer.documentType,
        document: customer.document,
        email: customer.email || '',
        phone: customer.phone || '',
      });
    } else {
      setEditingCustomer(null);
      customerForm.reset();
    }
    setIsModalOpen(true);
  }, [customerForm]);

  /**
   * Fecha modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    customerForm.reset();
  }, [customerForm]);

  /**
   * Submete formulário de cliente
   */
  const onSubmitCustomer = useCallback(async (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, data);
        toast.success('Cliente atualizado com sucesso');
      } else {
        await customerService.createCustomer(data);
        toast.success('Cliente criado com sucesso');
      }
      
      handleCloseModal();
      loadCustomers();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  }, [editingCustomer, handleCloseModal, loadCustomers]);

  /**
   * Exclui cliente
   */
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await customerService.deleteCustomer(id);
      toast.success('Cliente excluído com sucesso');
      loadCustomers();
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  }, [loadCustomers]);

  /**
   * Exporta dados dos clientes
   */
  const handleExport = useCallback(async () => {
    try {
      const blob = await customerService.exportCustomers();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    }
  }, []);

  // Calcula estatísticas gerais
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'ativo').length;
  const inactiveCustomers = customers.filter(c => c.status === 'inativo').length;
  const pendingCustomers = customers.filter(c => c.status === 'pendente').length;
  const totalReceivables = customers.reduce((sum, customer) => sum + (customer.total_receivables || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus clientes e recebíveis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Ativos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              Com recebíveis ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Inativos
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inactiveCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              Sem atividade recente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebíveis
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalReceivables)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total a receber
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs e Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                  <Input
                    id="search"
                    placeholder="Buscar por nome, documento, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentType">Tipo de Documento</Label>
                  <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes ({filteredAndSortedCustomers.length})</CardTitle>
              <CardDescription>
                Lista de todos os clientes filtrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Carregando clientes...</p>
                  </div>
                </div>
              ) : filteredAndSortedCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhum cliente encontrado</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => handleOpenModal()}
                  >
                    Criar Primeiro Cliente
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedCustomers.map((customer) => (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <CardTitle className="text-lg">{customer.name}</CardTitle>
                          </div>
                          <Badge className={getStatusColor(customer.status)}>
                            {getStatusLabel(customer.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{formatDocument(customer.document, customer.documentType)}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.total_receivables && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>{formatCurrency(customer.total_receivables)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(customer)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {/* Tabela de Clientes */}
          <Card>
            <CardHeader>
              <CardTitle>Todos os Clientes</CardTitle>
              <CardDescription>
                Tabela completa com todos os clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recebíveis</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          {formatDocument(customer.document, customer.documentType)}
                        </TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(customer.status)}>
                            {getStatusLabel(customer.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {customer.total_receivables ? formatCurrency(customer.total_receivables) : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                Análise completa dos clientes e recebíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerStats ? (
                <div className="space-y-6">
                  {/* Distribuição por Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Distribuição por Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Ativos</span>
                          <span className="font-bold">{activeCustomers}</span>
                        </div>
                        <Progress value={(activeCustomers / totalCustomers) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Inativos</span>
                          <span className="font-bold">{inactiveCustomers}</span>
                        </div>
                        <Progress value={(inactiveCustomers / totalCustomers) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Pendentes</span>
                          <span className="font-bold">{pendingCustomers}</span>
                        </div>
                        <Progress value={(pendingCustomers / totalCustomers) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Top Clientes */}
                  {customerStats.top_customers && customerStats.top_customers.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Top Clientes por Recebíveis</h3>
                      <div className="space-y-2">
                        {customerStats.top_customers.map((customer, index) => (
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

      {/* Modal de Cliente */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(onSubmitCustomer)} className="space-y-4">
              <FormField
                control={customerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={customerForm.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CPF">CPF</SelectItem>
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={customerForm.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Documento</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={customerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
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
                  {editingCustomer ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 