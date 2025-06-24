/**
 * Página de Gerenciamento de Categorias
 * @author Lucas
 *
 * @description
 * Interface completa para gerenciamento de categorias financeiras com funcionalidades
 * de criação, edição, estatísticas, gráficos e relatórios
 *
 * @returns {JSX.Element} Página de categorias renderizada
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
  Palette,
  Eye,
  EyeOff,
  DollarSign
} from 'lucide-react';
import categoryService, { Category as ServiceCategory, CategoryStats } from '@/lib/categoryService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Esquema de validação para categoria
 */
const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Tipo é obrigatório'
  }),
  color: z.string().min(1, 'Cor é obrigatória')
});

type CategoryFormData = z.infer<typeof categorySchema>;

/**
 * Interface para categoria local (com campos adicionais para UI)
 */
interface Category extends ServiceCategory {
  // Campos adicionais se necessário
}

/**
 * Interface para estatísticas de categoria local
 */
interface CategoryStatsLocal extends CategoryStats {
  // Campos adicionais se necessário
}

/**
 * Componente principal de gerenciamento de categorias
 * Permite visualizar, criar, editar e gerenciar categorias financeiras
 * com funcionalidades de estatísticas e relatórios
 */
export function Categories() {
  const { user } = useAuth();
  
  // Estados principais
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStatsLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [statsPeriod, setStatsPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Formulário de categoria
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
      color: '#3b82f6'
    }
  });

  /**
   * Busca categorias do usuário
   */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await categoryService.getCategories();
      setCategories(response || []);
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error);
      setError('Erro ao carregar categorias. Tente novamente.');
      toast.error('Erro ao buscar categorias');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca estatísticas das categorias
   */
  const fetchCategoryStats = useCallback(async () => {
    try {
      const response = await categoryService.getCategoryStats('expense', statsPeriod);
      setCategoryStats(response || []);
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao buscar estatísticas das categorias');
    }
  }, [statsPeriod]);

  // Carrega dados iniciais
  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchCategoryStats();
    }
  }, [user, fetchCategories, fetchCategoryStats]);

  /**
   * Filtra categorias por busca e tipo
   */
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(category => category.type === typeFilter);
    }

    return filtered;
  }, [categories, searchTerm, typeFilter]);

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
   * Obtém nome do tipo de categoria
   */
  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      income: 'Receita',
      expense: 'Despesa'
    };
    return typeMap[type] || type;
  };

  /**
   * Obtém cor baseada no tipo de categoria
   */
  const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      income: 'text-green-600',
      expense: 'text-red-600'
    };
    return colorMap[type] || 'text-gray-600';
  };

  /**
   * Obtém variante do badge baseada no tipo de categoria
   */
  const getTypeBadgeVariant = (type: string) => {
    const variantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      income: 'default',
      expense: 'destructive'
    };
    return variantMap[type] || 'secondary';
  };

  /**
   * Obtém ícone baseado no tipo de categoria
   */
  const getTypeIcon = (type: string) => {
    const iconMap: { [key: string]: React.ElementType } = {
      income: TrendingUp,
      expense: TrendingDown
    };
    return iconMap[type] || Activity;
  };

  /**
   * Abre modal para criar/editar categoria
   */
  const handleOpenModal = useCallback((category?: Category) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        name: category.name,
        type: category.type,
        color: category.color
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset();
    }
    setIsModalOpen(true);
  }, [categoryForm]);

  /**
   * Fecha modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
    categoryForm.reset();
  }, [categoryForm]);

  /**
   * Submete formulário de categoria
   */
  const onSubmitCategory = useCallback(async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: data.name,
          type: data.type,
          color: data.color
        });
        toast.success('Categoria atualizada com sucesso');
      } else {
        await categoryService.createCategory({
          name: data.name,
          type: data.type,
          color: data.color
        });
        toast.success('Categoria criada com sucesso');
      }
      
      handleCloseModal();
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  }, [editingCategory, handleCloseModal, fetchCategories, fetchCategoryStats]);

  /**
   * Exclui categoria
   */
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      await categoryService.deleteCategory(id);
      toast.success('Categoria excluída com sucesso');
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  }, [fetchCategories, fetchCategoryStats]);

  /**
   * Restaura categorias padrão
   */
  const handleRestoreDefaults = useCallback(async () => {
    if (!confirm('Tem certeza que deseja restaurar as categorias padrão? Isso irá substituir suas categorias personalizadas.')) {
      return;
    }

    try {
      await categoryService.restoreDefaultCategories();
      toast.success('Categorias padrão restauradas com sucesso');
      fetchCategories();
      fetchCategoryStats();
    } catch (error: any) {
      console.error('Erro ao restaurar categorias padrão:', error);
      toast.error('Erro ao restaurar categorias padrão');
    }
  }, [fetchCategories, fetchCategoryStats]);

  /**
   * Exporta estatísticas de categorias
   */
  const handleExportStats = useCallback(async () => {
    try {
      const blob = await categoryService.exportCategoryStats('expense', statsPeriod);
      
      // Cria link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `estatisticas-categorias-${statsPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Estatísticas exportadas com sucesso');
    } catch (error) {
      console.error('Erro ao exportar estatísticas:', error);
      toast.error('Erro ao exportar estatísticas');
    }
  }, [statsPeriod]);

  // Calcula estatísticas gerais
  const totalCategories = categories.length;
  const incomeCategories = categories.filter(c => c.type === 'income').length;
  const expenseCategories = categories.filter(c => c.type === 'expense').length;
  const totalAmount = categoryStats.reduce((sum, stat) => sum + stat.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas categorias financeiras
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRestoreDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button variant="outline" onClick={handleExportStats}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Estatísticas
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Categorias
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              Categorias cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias de Receita
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {incomeCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              Para receitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias de Despesa
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {expenseCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              Para despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gasto
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs e Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="income">Receitas</SelectItem>
                      <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Categorias ({filteredCategories.length})</CardTitle>
              <CardDescription>
                Lista de todas as categorias filtradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Carregando categorias...</p>
                  </div>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhuma categoria encontrada</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => handleOpenModal()}
                  >
                    Criar Primeira Categoria
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => {
                    const TypeIcon = getTypeIcon(category.type);
                    return (
                      <Card key={category.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              <CardTitle className="text-lg">{category.name}</CardTitle>
                            </div>
                            <Badge variant={getTypeBadgeVariant(category.type)}>
                              {getTypeLabel(category.type)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TypeIcon className={`h-4 w-4 ${getTypeColor(category.type)}`} />
                            <span className={getTypeColor(category.type)}>{getTypeLabel(category.type)}</span>
                          </div>
                          
                          <div className="flex justify-between mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(category)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {/* Tabela de Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Todas as Categorias</CardTitle>
              <CardDescription>
                Tabela completa com todas as categorias
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
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Padrão</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => {
                      const TypeIcon = getTypeIcon(category.type);
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTypeBadgeVariant(category.type)}>
                              <TypeIcon className={`h-3 w-3 mr-1 ${category.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                              {getTypeLabel(category.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border" 
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-xs font-mono">{category.color}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {category.is_default ? (
                              <Badge variant="outline">Padrão</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(category.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenModal(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(category.id)}
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
          {/* Filtros de Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period">Período</Label>
                  <Select value={statsPeriod} onValueChange={(value: 'month' | 'quarter' | 'year') => setStatsPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Último Mês</SelectItem>
                      <SelectItem value="quarter">Último Trimestre</SelectItem>
                      <SelectItem value="year">Último Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas por Categoria</CardTitle>
              <CardDescription>
                Despesas por categoria no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryStats.length > 0 ? (
                <div className="space-y-4">
                  {categoryStats.map((stat) => (
                    <div key={stat.category_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: stat.category_color }}
                          />
                          <span className="font-medium">{stat.category_name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(stat.total_amount)}</div>
                          <div className="text-sm text-muted-foreground">
                            {stat.transaction_count} transações
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{stat.percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={stat.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
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

      {/* Modal de Categoria */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Alimentação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          {...field}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          placeholder="#3b82f6"
                          {...field}
                          className="flex-1"
                        />
                      </div>
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
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 