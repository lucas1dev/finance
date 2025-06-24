/**
 * Página de Gerenciamento de Credores
 * @author Lucas
 *
 * @description
 * Interface para gerenciamento de credores com funcionalidades
 * de criação, edição e listagem conforme documentação da API
 *
 * @returns {JSX.Element} Página de credores renderizada
 */
import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw, 
  Loader2,
  AlertTriangle,
  CheckCircle,
  Users,
  UserPlus,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
  Eye,
  Building2,
  User,
  Handshake
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import creditorService, { 
  Creditor,
  CreditorFilters,
  PaginationParams
} from '@/lib/creditorService';

/**
 * Formata documento CPF ou CNPJ
 */
const formatDocument = (document: string, type: 'CPF' | 'CNPJ') => {
  const clean = document.replace(/\D/g, '');
  if (type === 'CPF') {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
};

/**
 * Esquema de validação para credor
 */
const creditorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  document_type: z.enum(['CPF', 'CNPJ'], {
    required_error: 'Tipo de documento é obrigatório'
  }),
  document_number: z.string()
    .min(11, 'Documento deve ter pelo menos 11 caracteres')
    .max(18, 'Documento deve ter no máximo 18 caracteres')
    .refine((value) => {
      // Remove caracteres não numéricos para validação
      const cleanValue = value.replace(/\D/g, '');
      return cleanValue.length >= 11;
    }, 'Documento deve ter pelo menos 11 dígitos'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  phone: z.string().optional(),
  observations: z.string().optional(),
});

type CreditorFormData = z.infer<typeof creditorSchema>;

/**
 * Componente principal de gerenciamento de credores
 * Permite visualizar, criar, editar e gerenciar credores
 * conforme documentação da API
 */
export default function Creditors() {
  const { user } = useAuth();
  
  // Estados principais
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCreditor, setEditingCreditor] = useState<Creditor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Formulário de credor
  const creditorForm = useForm<CreditorFormData>({
    resolver: zodResolver(creditorSchema),
    defaultValues: {
      name: '',
      document_type: 'CNPJ',
      document_number: '',
      email: '',
      phone: '',
      address: '',
      observations: '',
    }
  });

  /**
   * Busca credores do usuário
   */
  const fetchCreditors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: CreditorFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (documentTypeFilter !== 'all') filters.document_type = documentTypeFilter as 'CPF' | 'CNPJ';

      const pagination: PaginationParams = {
        page: currentPage,
        limit: pageSize
      };

      const response = await creditorService.getCreditors(filters, pagination);
      
      // Garantir que creditors seja sempre um array
      let creditorsData: Creditor[] = [];
      
      if (Array.isArray(response)) {
        creditorsData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        const responseObj = response as { data: any };
        creditorsData = Array.isArray(responseObj.data) ? responseObj.data : [];
      }
      
      setCreditors(creditorsData);
    } catch (error: any) {
      console.error('Erro ao buscar credores:', error);
      setError('Erro ao carregar credores. Tente novamente.');
      toast.error('Erro ao buscar credores');
      setCreditors([]); // Garantir que seja um array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  }, [searchTerm, documentTypeFilter, currentPage, pageSize]);

  /**
   * Carrega dados iniciais
   */
  useEffect(() => {
    fetchCreditors();
  }, [fetchCreditors]);

  /**
   * Abre modal para criar novo credor
   */
  const handleCreateCreditor = () => {
    setEditingCreditor(null);
    creditorForm.reset({
      name: '',
      document_type: 'CNPJ',
      document_number: '',
      email: '',
      phone: '',
      address: '',
      observations: '',
    });
    setIsModalOpen(true);
  };

  /**
   * Abre modal para editar credor
   */
  const handleEditCreditor = (creditor: Creditor) => {
    setEditingCreditor(creditor);
    creditorForm.reset({
      name: creditor.name,
      document_type: creditor.document_type,
      document_number: creditor.document_number,
      email: creditor.email || '',
      phone: creditor.phone || '',
      address: creditor.address || '',
      observations: creditor.observations || '',
    });
    setIsModalOpen(true);
  };

  /**
   * Submete formulário de credor
   */
  const onSubmit = async (data: CreditorFormData) => {
    // Limpar dados antes de enviar
    const cleanData = {
      name: data.name.trim(),
      document_type: data.document_type,
      document_number: data.document_number.replace(/\D/g, ''), // Remove caracteres não numéricos
      address: data.address.trim(), // Campo obrigatório
      email: data.email.trim(), // Campo obrigatório
      phone: data.phone?.trim() || '',
      observations: data.observations?.trim() || '',
    };
    
    try {
      if (editingCreditor) {
        await creditorService.updateCreditor(editingCreditor.id, cleanData);
        toast.success('Credor atualizado com sucesso!');
      } else {
        const result = await creditorService.createCreditor(cleanData);
        toast.success('Credor criado com sucesso!');
      }
      
      setIsModalOpen(false);
      fetchCreditors();
    } catch (error: any) {
      console.error('Erro ao salvar credor:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar credor');
    }
  };

  /**
   * Exclui credor
   */
  const handleDeleteCreditor = async (creditor: Creditor) => {
    if (!confirm(`Tem certeza que deseja excluir o credor "${creditor.name}"?`)) {
      return;
    }

    try {
      await creditorService.deleteCreditor(creditor.id);
      toast.success('Credor excluído com sucesso!');
      fetchCreditors();
    } catch (error: any) {
      console.error('Erro ao excluir credor:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir credor');
    }
  };

  /**
   * Valida documento antes de submeter
   */
  const validateDocument = (documentNumber: string, documentType: 'CPF' | 'CNPJ') => {
    if (documentType === 'CPF') {
      return creditorService.validateCPF(documentNumber);
    } else {
      return creditorService.validateCNPJ(documentNumber);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Credores
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie seus credores e instituições financeiras
          </p>
        </div>
        <Button onClick={handleCreateCreditor} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Credor
        </Button>
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
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
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
            <div className="flex items-end">
              <Button 
                onClick={fetchCreditors} 
                variant="outline" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Estatísticas Simples */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Credores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Array.isArray(creditors) ? creditors.length : 0}</div>
                <p className="text-xs text-muted-foreground">
                  Credores cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPFs</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(creditors) ? creditors.filter(c => c.document_type === 'CPF').length : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pessoas físicas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CNPJs</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(creditors) ? creditors.filter(c => c.document_type === 'CNPJ').length : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pessoas jurídicas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Credores */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Credores</CardTitle>
              <CardDescription>
                {loading ? 'Carregando...' : `${Array.isArray(creditors) ? creditors.length : 0} credores encontrados`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="flex items-center justify-center p-8 text-red-600">
                  <AlertTriangle className="h-8 w-8 mr-2" />
                  {error}
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !Array.isArray(creditors) || creditors.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <Users className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">Nenhum credor encontrado</p>
                  <p className="text-sm">Comece criando seu primeiro credor</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditors.map((creditor) => (
                        <TableRow key={creditor.id}>
                          <TableCell>
                            <div className="font-medium">{creditor.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {creditor.document_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {formatDocument(creditor.document_number, creditor.document_type)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">
                              {creditor.address}
                            </div>
                          </TableCell>
                          <TableCell>
                            {creditor.phone || '-'}
                          </TableCell>
                          <TableCell>
                            {creditor.email || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={creditor.status === 'ativo' ? 'default' : 'secondary'}>
                              {creditor.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCreditor(creditor)}
                                data-testid="edit-button"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCreditor(creditor)}
                                className="text-red-600 hover:text-red-700"
                                data-testid="delete-button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Credor */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCreditor ? 'Editar Credor' : 'Novo Credor'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...creditorForm}>
            <form onSubmit={creditorForm.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={creditorForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do credor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={creditorForm.control}
                  name="document_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento *</FormLabel>
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
                  control={creditorForm.control}
                  name="document_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Documento *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={creditorForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Rua, número, bairro, cidade"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={creditorForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={creditorForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={creditorForm.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creditorForm.formState.isSubmitting}>
                  {creditorForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {editingCreditor ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 