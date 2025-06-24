/**
 * Dashboard principal da aplicação
 * @author Lucas
 *
 * @description
 * Dashboard avançado com gráficos interativos, métricas em tempo real, alertas inteligentes,
 * widgets personalizáveis e análise financeira detalhada
 *
 * @returns {JSX.Element} Dashboard renderizado
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Wallet, 
  Receipt, 
  CreditCard, 
  Building2, 
  Users, 
  FileText, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  LineChart,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Activity,
  Target,
  Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { FinancingDashboardCharts } from '@/components/FinancingDashboardCharts';
import { FinancialMetrics } from '@/components/FinancialMetrics';
import { AlertWidget } from '@/components/AlertWidget';
import { ActivityFeed } from '@/components/ActivityFeed';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { useChartData } from '@/hooks/useChartData';
import { RevenueExpenseChart } from '@/components/charts/RevenueExpenseChart';
import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente de skeleton loading para o dashboard
 */
const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-10 w-[180px] bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Alertas Skeleton */}
      <div className="bg-gray-200 rounded-lg p-6">
        <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>

      {/* Métricas Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg p-6">
            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-gray-200 rounded-lg p-4">
        <div className="flex space-x-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-300 rounded w-20"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

/**
 * Componente de ação rápida para navegação
 */
const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  badge,
  color = 'blue'
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  badge?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
    orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${colorClasses[color]}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-110">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm opacity-80">{description}</p>
            </div>
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              {badge}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Componente de meta financeira
 */
const GoalCard = ({ goal }: { goal: any }) => {
  const progress = (goal.current / goal.target) * 100;
  const GoalIcon = goal.icon;

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <GoalIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">{goal.name}</h3>
            <p className="text-sm text-muted-foreground">
              {goal.current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {goal.target.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Componente principal do Dashboard com dados reais e gráficos interativos.
 * Exibe métricas financeiras, gráficos, alertas e atividades em tempo real.
 * @returns Componente do Dashboard
 * @example
 * <Dashboard />
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estados do dashboard
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showProjection, setShowProjection] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [widgetVisibility, setWidgetVisibility] = useState({
    metrics: true,
    revenueExpense: true,
    cashFlow: true,
    investmentDistribution: true,
    alerts: true,
    activity: true
  });

  // Hooks para dados
  const { 
    metrics, 
    loading: metricsLoading, 
    error: metricsError, 
    loadAllData,
    markAlertAsRead,
    alerts,
    recentTransactions,
    loading,
    error
  } = useFinancialMetrics();

  // Hook para dados de gráficos
  const { 
    revenueExpense, 
    cashFlow, 
    investmentDistribution, 
    loading: chartsLoading, 
    error: chartsError, 
    refreshData 
  } = useChartData();

  // Carrega configurações salvas
  useEffect(() => {
    const savedPeriod = localStorage.getItem('dashboard-period');
    const savedVisibility = localStorage.getItem('dashboard-widgets');
    const savedProjection = localStorage.getItem('dashboard-projection');

    if (savedPeriod) setSelectedPeriod(savedPeriod);
    if (savedVisibility) setWidgetVisibility(JSON.parse(savedVisibility));
    if (savedProjection) setShowProjection(JSON.parse(savedProjection));
  }, []);

  // Salva configurações quando mudam
  useEffect(() => {
    localStorage.setItem('dashboard-period', selectedPeriod);
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgetVisibility));
    localStorage.setItem('dashboard-projection', JSON.stringify(showProjection));
  }, [selectedPeriod, widgetVisibility, showProjection]);

  /**
   * Atualiza todos os dados do dashboard
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadAllData(),
        refreshData()
      ]);
      toast.success('Dashboard atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Reseta configurações para padrão
   */
  const handleResetSettings = () => {
    setSelectedPeriod('month');
    setShowProjection(true);
    setWidgetVisibility({
      metrics: true,
      revenueExpense: true,
      cashFlow: true,
      investmentDistribution: true,
      alerts: true,
      activity: true
    });
    toast.success('Configurações resetadas!');
  };

  // Dados mock para componentes que ainda não foram implementados
  const mockCategoryData = [
    { name: 'Alimentação', percentage: 25, color: '#3B82F6' },
    { name: 'Transporte', percentage: 20, color: '#10B981' },
    { name: 'Moradia', percentage: 35, color: '#F59E0B' },
    { name: 'Lazer', percentage: 15, color: '#EF4444' },
    { name: 'Outros', percentage: 5, color: '#8B5CF6' }
  ];

  const mockTrends = {
    income: 12.5,
    expense: -5.2
  };

  // Converte dados ChartData para formato dos componentes de gráfico
  const convertChartData = (chartData: any, type: string) => {
    if (!chartData) return null;

    switch (type) {
      case 'revenueExpense':
        return {
          revenues: chartData.datasets[0]?.data?.map((value: number, index: number) => ({
            category: chartData.labels[index] || `Categoria ${index + 1}`,
            amount: value,
            color: chartData.datasets[0]?.backgroundColor?.[index] || '#22c55e'
          })) || [],
          expenses: chartData.datasets[1]?.data?.map((value: number, index: number) => ({
            category: chartData.labels[index] || `Categoria ${index + 1}`,
            amount: value,
            color: chartData.datasets[1]?.backgroundColor?.[index] || '#ef4444'
          })) || [],
          monthly: chartData.datasets[0]?.data?.map((value: number, index: number) => ({
            month: chartData.labels[index] || `Mês ${index + 1}`,
            revenue: value,
            expense: chartData.datasets[1]?.data?.[index] || 0
          })) || []
        };

      case 'cashFlow':
        return {
          daily: chartData.datasets[0]?.data?.map((value: number, index: number) => ({
            date: chartData.labels[index] || `Dia ${index + 1}`,
            income: value,
            expense: chartData.datasets[1]?.data?.[index] || 0,
            balance: chartData.datasets[2]?.data?.[index] || 0
          })) || [],
          monthly: chartData.datasets[0]?.data?.map((value: number, index: number) => ({
            month: chartData.labels[index] || `Mês ${index + 1}`,
            income: value,
            expense: chartData.datasets[1]?.data?.[index] || 0,
            balance: chartData.datasets[2]?.data?.[index] || 0
          })) || [],
          projection: []
        };

      default:
        return null;
    }
  };

  const revenueExpenseData = convertChartData(revenueExpense, 'revenueExpense');
  const cashFlowData = convertChartData(cashFlow, 'cashFlow');

  // Verifica se os dados convertidos têm o formato correto
  const isValidRevenueExpenseData = revenueExpenseData && 'revenues' in revenueExpenseData && 'expenses' in revenueExpenseData;
  const isValidCashFlowData = cashFlowData && 'daily' in cashFlowData && 'monthly' in cashFlowData;

  // Verifica se está carregando
  const isLoading = metricsLoading || chartsLoading.revenueExpense || chartsLoading.cashFlow;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header do Dashboard */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard Financeiro
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Visão geral das suas finanças em tempo real
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Seletor de Período */}
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="quarter">Este Trimestre</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                </SelectContent>
              </Select>

              {/* Botão de Atualizar */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={metricsLoading || chartsLoading.revenueExpense || chartsLoading.cashFlow}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(metricsLoading || chartsLoading.revenueExpense || chartsLoading.cashFlow) ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              {/* Botão de Configurações */}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs de Navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span>Gráficos</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Atividades</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Métricas Financeiras */}
            {widgetVisibility.metrics && (
              <FinancialMetrics 
                metrics={metrics} 
                loading={metricsLoading} 
              />
            )}

            {/* Gráficos em Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Receitas vs Despesas */}
              {widgetVisibility.revenueExpense && isValidRevenueExpenseData && (
                <RevenueExpenseChart
                  data={revenueExpenseData as any}
                  loading={chartsLoading.revenueExpense}
                  error={chartsError.revenueExpense}
                  chartType="doughnut"
                  period={selectedPeriod === 'month' ? 'Este mês' : 'Período selecionado'}
                />
              )}

              {/* Gráfico de Fluxo de Caixa */}
              {widgetVisibility.cashFlow && isValidCashFlowData && (
                <CashFlowChart
                  data={cashFlowData as any}
                  loading={chartsLoading.cashFlow}
                  error={chartsError.cashFlow}
                  periodType="daily"
                  showProjection={showProjection}
                  period="Últimos 30 dias"
                />
              )}
            </div>

            {/* Widgets Inferiores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alertas */}
              {widgetVisibility.alerts && (
                <AlertWidget 
                  alerts={alerts} 
                  loading={metricsLoading} 
                  onMarkAsRead={markAlertAsRead} 
                />
              )}

              {/* Feed de Atividades */}
              {widgetVisibility.activity && (
                <ActivityFeed 
                  transactions={recentTransactions} 
                  loading={metricsLoading} 
                  onViewAll={() => setActiveTab('activity')} 
                />
              )}
            </div>
          </TabsContent>

          {/* Tab: Gráficos */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Receitas vs Despesas - Versão Barras */}
              {isValidRevenueExpenseData && (
                <RevenueExpenseChart
                  data={revenueExpenseData as any}
                  loading={chartsLoading.revenueExpense}
                  error={chartsError.revenueExpense}
                  chartType="bar"
                  period="Comparativo mensal"
                />
              )}

              {/* Gráfico de Fluxo de Caixa - Versão Mensal */}
              {isValidCashFlowData && (
                <CashFlowChart
                  data={cashFlowData as any}
                  loading={chartsLoading.cashFlow}
                  error={chartsError.cashFlow}
                  periodType="monthly"
                  showProjection={showProjection}
                  period="Últimos 12 meses"
                />
              )}
            </div>

            {/* Gráfico de Distribuição de Investimentos */}
            {widgetVisibility.investmentDistribution && investmentDistribution && (
              <ChartWrapper
                title="Distribuição de Investimentos"
                subtitle="Portfólio atual"
                loading={chartsLoading.investmentDistribution}
                error={chartsError.investmentDistribution}
                height="400px"
              >
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Gráfico de distribuição de investimentos será implementado em breve
                </div>
              </ChartWrapper>
            )}
          </TabsContent>

          {/* Tab: Atividades */}
          <TabsContent value="activity" className="space-y-6">
            <ActivityFeed transactions={recentTransactions} loading={metricsLoading} onViewAll={() => {}} />
          </TabsContent>

          {/* Tab: Configurações */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações do Dashboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visibilidade de Widgets */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Visibilidade de Widgets</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(widgetVisibility).map(([key, visible]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={key}
                          checked={visible}
                          onChange={(e) => 
                            setWidgetVisibility(prev => ({ ...prev, [key]: e.target.checked }))
                          }
                          className="rounded"
                        />
                        <label htmlFor={key} className="text-sm font-medium">
                          {key === 'metrics' && 'Métricas Financeiras'}
                          {key === 'revenueExpense' && 'Receitas vs Despesas'}
                          {key === 'cashFlow' && 'Fluxo de Caixa'}
                          {key === 'investmentDistribution' && 'Distribuição de Investimentos'}
                          {key === 'alerts' && 'Alertas'}
                          {key === 'activity' && 'Feed de Atividades'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configurações de Gráficos */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Configurações de Gráficos</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="projection"
                        checked={showProjection}
                        onChange={(e) => setShowProjection(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="projection" className="text-sm font-medium">
                        Mostrar projeções no fluxo de caixa
                      </label>
                    </div>
                  </div>
                </div>

                {/* Botão de Reset */}
                <div className="pt-4 border-t">
                  <Button variant="outline" onClick={handleResetSettings}>
                    Restaurar Configurações Padrão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 