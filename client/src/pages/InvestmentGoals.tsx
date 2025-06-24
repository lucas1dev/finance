/**
 * Página de Metas de Investimento
 * @author Lucas
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Search, Filter, Download, RefreshCw, Target, Calendar, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import investmentGoalService, { InvestmentGoal, CreateInvestmentGoal, UpdateInvestmentGoal, InvestmentGoalStats } from '@/lib/investmentGoalService';
import categoryService from '@/lib/categoryService';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

/**
 * Componente principal da página de Metas de Investimento
 */
const InvestmentGoals: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);
  const [stats, setStats] = useState<InvestmentGoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativa' | 'concluida' | 'cancelada'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<InvestmentGoal | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; color: string }>>([]);

  // Formulário
  const [formData, setFormData] = useState<CreateInvestmentGoal>({
    title: '',
    description: '',
    target_amount: 0,
    target_date: '',
    current_amount: 0,
    color: '#3B82F6',
    category_id: undefined,
  });

  /**
   * Carrega as metas de investimento
   */
  const loadGoals = async () => {
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
      
      const response = await investmentGoalService.getGoals(params);
      setGoals(response.goals);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast.error('Erro ao carregar metas de investimento');
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
      const statsData = await investmentGoalService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  /**
   * Carrega as categorias
   */
  const loadCategories = async () => {
    if (!user) return;
    
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  /**
   * Carrega dados iniciais
   */
  useEffect(() => {
    if (user) {
      loadGoals();
      loadStats();
      loadCategories();
    }
  }, [user, currentPage, statusFilter]);

  /**
   * Filtra metas por termo de busca
   */
  const filteredGoals = goals.filter(goal =>
    goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  /**
   * Cria uma nova meta
   */
  const handleCreateGoal = async () => {
    try {
      const errors = investmentGoalService.validateGoal(formData);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }

      await investmentGoalService.createGoal(formData);
      toast.success('Meta criada com sucesso!');
      setIsCreateModalOpen(false);
      resetForm();
      loadGoals();
      loadStats();
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast.error('Erro ao criar meta de investimento');
    }
  };

  /**
   * Atualiza uma meta
   */
  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    
    try {
      const errors = investmentGoalService.validateGoal(formData);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }

      await investmentGoalService.updateGoal(editingGoal.id, formData);
      toast.success('Meta atualizada com sucesso!');
      setEditingGoal(null);
      resetForm();
      loadGoals();
      loadStats();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast.error('Erro ao atualizar meta de investimento');
    }
  };

  /**
   * Exclui uma meta
   */
  const handleDeleteGoal = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    
    try {
      await investmentGoalService.deleteGoal(id);
      toast.success('Meta excluída com sucesso!');
      loadGoals();
      loadStats();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast.error('Erro ao excluir meta de investimento');
    }
  };

  /**
   * Calcula valor automaticamente
   */
  const handleCalculateAmount = async (id: number) => {
    try {
      await investmentGoalService.calculateAmount(id);
      toast.success('Valor calculado automaticamente!');
      loadGoals();
      loadStats();
    } catch (error) {
      console.error('Erro ao calcular valor:', error);
      toast.error('Erro ao calcular valor automaticamente');
    }
  };

  /**
   * Atualiza valor manualmente
   */
  const handleUpdateAmount = async (id: number, amount: number) => {
    try {
      await investmentGoalService.updateAmount(id, amount);
      toast.success('Valor atualizado com sucesso!');
      loadGoals();
      loadStats();
    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
      toast.error('Erro ao atualizar valor');
    }
  };

  /**
   * Marca meta como concluída
   */
  const handleCompleteGoal = async (id: number) => {
    try {
      await investmentGoalService.completeGoal(id);
      toast.success('Meta marcada como concluída!');
      loadGoals();
      loadStats();
    } catch (error) {
      console.error('Erro ao concluir meta:', error);
      toast.error('Erro ao concluir meta');
    }
  };

  /**
   * Cancela uma meta
   */
  const handleCancelGoal = async (id: number) => {
    if (!confirm('Tem certeza que deseja cancelar esta meta?')) return;
    
    try {
      await investmentGoalService.cancelGoal(id);
      toast.success('Meta cancelada com sucesso!');
      loadGoals();
      loadStats();
    } catch (error) {
      console.error('Erro ao cancelar meta:', error);
      toast.error('Erro ao cancelar meta');
    }
  };

  /**
   * Reativa uma meta
   */
  const handleReactivateGoal = async (id: number) => {
    try {
      await investmentGoalService.reactivateGoal(id);
      toast.success('Meta reativada com sucesso!');
      loadGoals();
      loadStats();
    } catch (error) {
      console.error('Erro ao reativar meta:', error);
      toast.error('Erro ao reativar meta');
    }
  };

  /**
   * Abre modal de edição
   */
  const openEditModal = (goal: InvestmentGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      target_amount: goal.target_amount,
      target_date: goal.target_date,
      current_amount: goal.current_amount,
      color: goal.color || '#3B82F6',
      category_id: goal.category_id,
    });
  };

  /**
   * Reseta formulário
   */
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target_amount: 0,
      target_date: '',
      current_amount: 0,
      color: '#3B82F6',
      category_id: undefined,
    });
  };

  /**
   * Exporta dados para CSV
   */
  const exportToCSV = () => {
    const headers = ['Título', 'Descrição', 'Valor Alvo', 'Valor Atual', 'Progresso', 'Data Alvo', 'Status', 'Dias Restantes'];
    const csvContent = [
      headers.join(','),
      ...filteredGoals.map(goal => [
        goal.title,
        goal.description || '',
        goal.target_amount,
        goal.current_amount,
        `${goal.progress_percentage.toFixed(1)}%`,
        investmentGoalService.formatDate(goal.target_date),
        goal.status,
        investmentGoalService.getDaysRemaining(goal.target_date)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `metas-investimento-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Obtém ícone de status
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelada':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-blue-500" />;
    }
  };

  /**
   * Obtém cor de status
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas de Investimento</h1>
          <p className="text-muted-foreground">
            Defina e acompanhe suas metas financeiras
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
              <DialogDescription>
                Defina uma nova meta de investimento para acompanhar seu progresso financeiro.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Comprar um carro"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada da meta"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="target_amount">Valor Alvo *</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="current_amount">Valor Atual</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target_date">Data Alvo *</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category_id?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateGoal}>
                Criar Meta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_goals}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_goals} ativas, {stats.completed_goals} concluídas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Alvo</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {investmentGoalService.formatCurrency(stats.total_target_amount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {investmentGoalService.formatCurrency(stats.total_current_amount)} atual
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {investmentGoalService.formatPercentage(stats.average_progress)}
              </div>
              <p className="text-xs text-muted-foreground">
                Média de todas as metas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed_goals}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_goals > 0 ? ((stats.completed_goals / stats.total_goals) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar metas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadGoals}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={exportToCSV}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Metas */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Metas</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas Detalhadas</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Carregando metas...</p>
              </div>
            </div>
          ) : filteredGoals.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">Nenhuma meta encontrada</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Crie sua primeira meta de investimento'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Meta
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredGoals.map((goal) => {
                const goalStatus = investmentGoalService.getGoalStatus(goal);
                const daysRemaining = investmentGoalService.getDaysRemaining(goal.target_date);
                const progressColor = investmentGoalService.getProgressColor(goal.progress_percentage);
                
                return (
                  <Card key={goal.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{goal.title}</h3>
                            {getStatusIcon(goal.status)}
                            <Badge className={getStatusColor(goal.status)}>
                              {goal.status === 'ativa' ? 'Ativa' : 
                               goal.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                            </Badge>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {goal.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{investmentGoalService.formatDate(goal.target_date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Target className="h-4 w-4" />
                              <span>{daysRemaining} dias restantes</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(goal)}
                          >
                            Editar
                          </Button>
                          {goal.status === 'ativa' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCalculateAmount(goal.id)}
                              >
                                Calcular
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCompleteGoal(goal.id)}
                              >
                                Concluir
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelGoal(goal.id)}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                          {goal.status === 'cancelada' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivateGoal(goal.id)}
                            >
                              Reativar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="text-sm font-medium">Valor Alvo</p>
                              <p className="text-lg font-bold">
                                {investmentGoalService.formatCurrency(goal.target_amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Valor Atual</p>
                              <p className="text-lg font-bold">
                                {investmentGoalService.formatCurrency(goal.current_amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Progresso</p>
                              <p className="text-lg font-bold" style={{ color: progressColor }}>
                                {investmentGoalService.formatPercentage(goal.progress_percentage)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progresso</span>
                            <span>{investmentGoalService.formatPercentage(goal.progress_percentage)}</span>
                          </div>
                          <Progress 
                            value={goal.progress_percentage} 
                            className="h-2"
                            style={{ 
                              '--progress-color': progressColor 
                            } as React.CSSProperties}
                          />
                        </div>
                        {goalStatus.status === 'behind' && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              {goalStatus.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid gap-6">
              {/* Distribuição por Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                  <CardDescription>
                    Metas organizadas por status atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.goals_by_status.ativa}</div>
                      <p className="text-sm text-muted-foreground">Ativas</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.goals_by_status.concluida}</div>
                      <p className="text-sm text-muted-foreground">Concluídas</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.goals_by_status.cancelada}</div>
                      <p className="text-sm text-muted-foreground">Canceladas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metas por Categoria */}
              {stats.goals_by_category.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Metas por Categoria</CardTitle>
                    <CardDescription>
                      Distribuição de metas por categoria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.goals_by_category.map((category) => (
                        <div key={category.category_id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.category_name.includes('Investimento') ? '#3B82F6' : '#10B981' }}
                            />
                            <span className="font-medium">{category.category_name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{category.count} metas</div>
                            <div className="text-sm text-muted-foreground">
                              {investmentGoalService.formatCurrency(category.total_target)} alvo
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Edição */}
      {editingGoal && (
        <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Meta</DialogTitle>
              <DialogDescription>
                Atualize os dados da meta de investimento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Comprar um carro"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada da meta"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-target_amount">Valor Alvo *</Label>
                  <Input
                    id="edit-target_amount"
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-current_amount">Valor Atual</Label>
                  <Input
                    id="edit-current_amount"
                    type="number"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-target_date">Data Alvo *</Label>
                <Input
                  id="edit-target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingGoal.status}
                  onValueChange={(value: 'ativa' | 'concluida' | 'cancelada') => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select
                  value={formData.category_id?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Cor</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingGoal(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateGoal}>
                Atualizar Meta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InvestmentGoals; 