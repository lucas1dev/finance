/**
 * Página de Gerenciamento de Fornecedores
 * @author Lucas
 *
 * @description
 * Interface completa para gerenciamento de fornecedores com funcionalidades
 * de criação, edição, estatísticas, gráficos e relatórios
 *
 * @returns {JSX.Element} Página de fornecedores renderizada
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
import supplierService, { 
  Supplier as ServiceSupplier, 
  SupplierStats as ServiceSupplierStats,
  SupplierFilters,
  PaginationParams
} from '@/lib/supplierService';

/**
 * Esquema de validação para fornecedor
 */
const supplierSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  document_type: z.enum(['CPF', 'CNPJ'], {
    required_error: 'Tipo de documento é obrigatório'
  }),
  document_number: z.string().min(11, 'Documento deve ter pelo menos 11 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

/**
 * Interface para fornecedor local (com campos adicionais para UI)
 */
interface Supplier extends ServiceSupplier {
  // Campos adicionais se necessário
}

/**
 * Interface para estatísticas de fornecedores local
 */
interface SupplierStats extends ServiceSupplierStats {
  // Campos adicionais se necessário
}

/**
 * Componente principal de gerenciamento de fornecedores
 * Permite visualizar, criar, editar e gerenciar fornecedores
 * com funcionalidades de estatísticas e relatórios
 */
export default function Suppliers() {
  const { user } = useAuth();
  
  // Estados principais
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierStats, setSupplierStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [pageSize] = useState(10);

  // Formulário de fornecedor
  const supplierForm = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      document_type: 'CNPJ',
      document_number: '',
      email: '',
      phone: '',
      address: '',
    }
  });

  /**
   * Calcula estatísticas dos fornecedores localmente
   */
  const calculateSupplierStats = useCallback((suppliersData: Supplier[]) => {
    try {
      const total_suppliers = suppliersData.length;
      const active_suppliers = suppliersData.filter(s => s.status === 'ativo').length;
      const inactive_suppliers = suppliersData.filter(s => s.status === 'inativo').length;
      const pending_suppliers = suppliersData.filter(s => s.status === 'pendente').length;
      
      const total_payables = suppliersData.reduce((sum, s) => sum + (s.total_payables || 0), 0);
      const average_payables_per_supplier = total_suppliers > 0 ? total_payables / total_suppliers : 0;
      
      const top_suppliers = suppliersData
        .filter(s => s.total_payables && s.total_payables > 0)
        .sort((a, b) => (b.total_payables || 0) - (a.total_payables || 0))
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          name: s.name,
          total_payables: s.total_payables || 0,
          payables_count: s.payables_count || 0
        }));
      
      const suppliers_by_status = [
        { status: 'ativo', count: active_suppliers, percentage: total_suppliers > 0 ? (active_suppliers / total_suppliers) * 100 : 0 },
        { status: 'inativo', count: inactive_suppliers, percentage: total_suppliers > 0 ? (inactive_suppliers / total_suppliers) * 100 : 0 },
        { status: 'pendente', count: pending_suppliers, percentage: total_suppliers > 0 ? (pending_suppliers / total_suppliers) * 100 : 0 }
      ];
      
      const stats: SupplierStats = {
        total_suppliers,
        active_suppliers,
        inactive_suppliers,
        pending_suppliers,
        total_payables,
        average_payables_per_supplier,
        top_suppliers,
        suppliers_by_status
      };
      
      setSupplierStats(stats);
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  }, []);

  /**
   * Carrega os fornecedores do usuário
   */
  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Chamando SupplierService.getSuppliers()...');
      
      const response = await supplierService.getSuppliers();
      console.log('📋 Resposta do SupplierService.getSuppliers():', response);
      
      let suppliersData: Supplier[] = [];
      
      // Tratar diferentes formatos de resposta
      if (Array.isArray(response)) {
        suppliersData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        const responseObj = response as { data: any };
        suppliersData = Array.isArray(responseObj.data) ? responseObj.data : [];
      }
      
      console.log('📊 Dados finais dos fornecedores:', suppliersData);
      setSuppliers(suppliersData);
      
      // Calcular estatísticas localmente com os dados já carregados
      calculateSupplierStats(suppliersData);
    } catch (error) {
      console.error('❌ Erro ao buscar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  }, [calculateSupplierStats]);

  // Carrega dados iniciais apenas uma vez quando o componente monta
  useEffect(() => {
    if (user) {
      loadSuppliers();
    }
  }, [user, loadSuppliers]);

  /**
   * Filtra e ordena fornecedores
   */
  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = suppliers;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.document_number.includes(searchTerm) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm)
      );
    }

    // Filtro por tipo de documento
    if (documentTypeFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.document_type === documentTypeFilter);
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.status === statusFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Supplier];
      let bValue: any = b[sortBy as keyof Supplier];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [suppliers, searchTerm, documentTypeFilter, statusFilter, sortBy, sortOrder]);

  /**
   * Abre modal para criar novo fornecedor
   */
  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    supplierForm.reset({
      name: '',
      document_type: 'CNPJ',
      document_number: '',
      email: '',
      phone: '',
      address: '',
    });
    setIsModalOpen(true);
  };

  /**
   * Abre modal para editar fornecedor
   */
  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    supplierForm.reset({
      name: supplier.name,
      document_type: supplier.document_type,
      document_number: supplier.document_number,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setIsModalOpen(true);
  };

  /**
   * Fecha modal e limpa formulário
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    supplierForm.reset();
  };

  /**
   * Salva fornecedor (criar ou editar)
   */
  const handleSaveSupplier = useCallback(async (data: SupplierFormData) => {
    try {
      if (editingSupplier) {
        console.log('🔄 Editando fornecedor:', editingSupplier.id, data);
        await supplierService.updateSupplier(editingSupplier.id, data);
        toast.success('Fornecedor atualizado com sucesso');
      } else {
        console.log('🆕 Criando novo fornecedor:', data);
        await supplierService.createSupplier(data);
        toast.success('Fornecedor criado com sucesso');
      }
      
      handleCloseModal();
      loadSuppliers();
    } catch (error: any) {
      console.error('❌ Erro ao salvar fornecedor:', error);
      console.error('❌ Response:', error.response?.data);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erro ao salvar fornecedor');
      }
    }
  }, [editingSupplier, handleCloseModal, loadSuppliers]);

  /**
   * Exclui fornecedor
   */
  const handleDeleteSupplier = useCallback(async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) {
      return;
    }

    try {
      console.log('🗑️ Excluindo fornecedor:', id);
      await supplierService.deleteSupplier(id);
      toast.success('Fornecedor excluído com sucesso');
      loadSuppliers();
    } catch (error: any) {
      console.error('❌ Erro ao excluir fornecedor:', error);
      console.error('❌ Response:', error.response?.data);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erro ao excluir fornecedor');
      }
    }
  }, [loadSuppliers]);

  /**
   * Exporta fornecedores para CSV
   */
  const handleExportSuppliers = async () => {
    try {
      const blob = await supplierService.exportSuppliers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fornecedores_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Exportação realizada com sucesso');
    } catch (error) {
      console.error('Erro ao exportar fornecedores:', error);
      toast.error('Erro ao exportar fornecedores');
    }
  };

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
   * Formata documento (CPF/CNPJ)
   */
  const formatDocument = (documentNumber: string, documentType: 'CPF' | 'CNPJ') => {
    if (documentType === 'CPF') {
      return documentNumber.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return documentNumber.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  /**
   * Retorna cor do status
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Retorna label do status
   */
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'inativo':
        return 'Inativo';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  // Calcula estatísticas gerais
  const totalSuppliersCount = totalSuppliers;
  const activeSuppliers = supplierStats?.active_suppliers || 0;
  const inactiveSuppliers = supplierStats?.inactive_suppliers || 0;
  const pendingSuppliers = supplierStats?.pending_suppliers || 0;
  const totalPayables = supplierStats?.total_payables || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus fornecedores e parceiros comerciais
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportSuppliers}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleCreateSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Fornecedores
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalSuppliersCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Fornecedores cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fornecedores Ativos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeSuppliers}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalSuppliersCount > 0 ? `${((activeSuppliers / totalSuppliersCount) * 100).toFixed(1)}% do total` : '0% do total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fornecedores Inativos
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inactiveSuppliers}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalSuppliersCount > 0 ? `${((inactiveSuppliers / totalSuppliersCount) * 100).toFixed(1)}% do total` : '0% do total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Pagáveis
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalPayables)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total em contas a pagar
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Nome, documento, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentType">Tipo de Documento</Label>
                  <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
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
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Fornecedores */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Fornecedores</CardTitle>
              <CardDescription>
                {totalSuppliersCount} fornecedores encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2">Carregando fornecedores...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-600">{error}</p>
                  <Button onClick={loadSuppliers} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              ) : filteredAndSortedSuppliers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhum fornecedor encontrado</p>
                  <Button onClick={handleCreateSupplier} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Fornecedor
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagáveis</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedSuppliers.map((supplier) => {
                      return (
                        <TableRow key={supplier.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{supplier.name}</div>
                              {supplier.email && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {supplier.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatDocument(supplier.document_number, supplier.document_type)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {supplier.document_type}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {supplier.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {supplier.phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={getStatusColor(supplier.status)}
                            >
                              {getStatusLabel(supplier.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {supplier.payables_count || 0} pagáveis
                              </div>
                              {supplier.total_payables && (
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(supplier.total_payables)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(supplier.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSupplier(supplier)}
                                data-testid="edit-button"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                data-testid="delete-button"
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
                Análise completa dos fornecedores e pagáveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplierStats ? (
                <div className="space-y-6">
                  {/* Distribuição por Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Distribuição por Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Ativos</span>
                          <span className="font-bold">{activeSuppliers}</span>
                        </div>
                        <Progress value={(activeSuppliers / totalSuppliersCount) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Inativos</span>
                          <span className="font-bold">{inactiveSuppliers}</span>
                        </div>
                        <Progress value={(inactiveSuppliers / totalSuppliersCount) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Pendentes</span>
                          <span className="font-bold">{pendingSuppliers}</span>
                        </div>
                        <Progress value={(pendingSuppliers / totalSuppliersCount) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Top Fornecedores */}
                  {supplierStats.top_suppliers && supplierStats.top_suppliers.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Top Fornecedores por Pagáveis</h3>
                      <div className="space-y-2">
                        {supplierStats.top_suppliers.map((supplier, index) => (
                          <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                              </div>
                              <div>
                                <div className="font-medium">{supplier.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {supplier.payables_count} pagáveis
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(supplier.total_payables)}</div>
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

      {/* Modal de Fornecedor */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>
          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit(handleSaveSupplier)} className="space-y-4">
              <FormField
                control={supplierForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo ou razão social" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={supplierForm.control}
                  name="document_type"
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
                  control={supplierForm.control}
                  name="document_number"
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
                control={supplierForm.control}
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
                control={supplierForm.control}
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

              <FormField
                control={supplierForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Endereço completo" {...field} />
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
                  {editingSupplier ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 