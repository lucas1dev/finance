import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertTriangle, Clock, Target, BarChart3 } from 'lucide-react';
import { DashboardMetrics } from '../lib/dashboardService';

/**
 * Interface para as props do componente
 */
interface FinancialMetricsProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

/**
 * Função para formatar valores monetários
 * @param value - Valor a ser formatado
 * @returns String formatada em reais
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Função para formatar valores percentuais
 * @param value - Valor a ser formatado
 * @returns String formatada em percentual
 */
const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

/**
 * Função para obter a cor baseada no valor
 * @param value - Valor para determinar a cor
 * @param isPositive - Se o valor positivo é bom
 * @returns Classe CSS para a cor
 */
const getValueColor = (value: number, isPositive: boolean = true): string => {
  if (value === 0) return 'text-gray-500';
  if (isPositive) {
    return value > 0 ? 'text-green-600' : 'text-red-600';
  } else {
    return value > 0 ? 'text-red-600' : 'text-green-600';
  }
};

/**
 * Função para obter o ícone baseado no valor
 * @param value - Valor para determinar o ícone
 * @param isPositive - Se o valor positivo é bom
 * @returns Componente de ícone
 */
const getValueIcon = (value: number, isPositive: boolean = true) => {
  if (value === 0) return null;
  
  if (isPositive) {
    return value > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  } else {
    return value > 0 ? (
      <TrendingDown className="h-4 w-4 text-red-600" />
    ) : (
      <TrendingUp className="h-4 w-4 text-green-600" />
    );
  }
};

/**
 * Componente de métrica individual
 */
interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  loading?: boolean;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  loading = false,
  className = '' 
}) => {
  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          {change && <div className="h-4 bg-gray-200 rounded w-16"></div>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Componente principal de métricas financeiras
 */
export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ 
  metrics, 
  loading = false 
}) => {
  if (!metrics && !loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              Nenhum dado disponível
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cashFlow = metrics ? metrics.monthlyIncome - metrics.monthlyExpenses : 0;
  const cashFlowPercentage = metrics && metrics.monthlyIncome > 0 
    ? ((cashFlow / metrics.monthlyIncome) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Saldo Total */}
      <MetricCard
        title="Saldo Total"
        value={metrics ? formatCurrency(metrics.totalBalance) : 'R$ 0,00'}
        icon={<Wallet className="h-4 w-4 text-blue-600" />}
        loading={loading}
        className="border-l-4 border-l-blue-500"
      />

      {/* Receitas do Mês */}
      <MetricCard
        title="Receitas do Mês"
        value={metrics ? formatCurrency(metrics.monthlyIncome) : 'R$ 0,00'}
        icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        loading={loading}
        className="border-l-4 border-l-green-500"
      />

      {/* Despesas do Mês */}
      <MetricCard
        title="Despesas do Mês"
        value={metrics ? formatCurrency(metrics.monthlyExpenses) : 'R$ 0,00'}
        icon={<TrendingDown className="h-4 w-4 text-red-600" />}
        loading={loading}
        className="border-l-4 border-l-red-500"
      />

      {/* Fluxo de Caixa */}
      <MetricCard
        title="Fluxo de Caixa"
        value={formatCurrency(cashFlow)}
        change={formatPercentage(cashFlowPercentage)}
        icon={<DollarSign className="h-4 w-4 text-purple-600" />}
        loading={loading}
        className={`border-l-4 ${cashFlow >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}
      />

      {/* Recebíveis Pendentes */}
      <MetricCard
        title="Recebíveis Pendentes"
        value={metrics ? formatCurrency(metrics.pendingReceivables) : 'R$ 0,00'}
        icon={<Clock className="h-4 w-4 text-yellow-600" />}
        loading={loading}
        className="border-l-4 border-l-yellow-500"
      />

      {/* Pagáveis Pendentes */}
      <MetricCard
        title="Pagáveis Pendentes"
        value={metrics ? formatCurrency(metrics.pendingPayables) : 'R$ 0,00'}
        icon={<AlertTriangle className="h-4 w-4 text-orange-600" />}
        loading={loading}
        className="border-l-4 border-l-orange-500"
      />

      {/* Total Investimentos */}
      <MetricCard
        title="Total Investimentos"
        value={metrics ? formatCurrency(metrics.investmentTotal) : 'R$ 0,00'}
        icon={<Target className="h-4 w-4 text-indigo-600" />}
        loading={loading}
        className="border-l-4 border-l-indigo-500"
      />

      {/* Total Financiamentos */}
      <MetricCard
        title="Total Financiamentos"
        value={metrics ? formatCurrency(metrics.financingTotal) : 'R$ 0,00'}
        icon={<BarChart3 className="h-4 w-4 text-gray-600" />}
        loading={loading}
        className="border-l-4 border-l-gray-500"
      />
    </div>
  );
};

export default FinancialMetrics; 