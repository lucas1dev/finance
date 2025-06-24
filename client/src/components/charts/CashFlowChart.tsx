import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartWrapper } from './ChartWrapper';

// Registra os componentes necessários do Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/**
 * Dados para o gráfico de fluxo de caixa
 */
interface CashFlowData {
  /** Dados diários do fluxo de caixa */
  daily: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  /** Dados mensais do fluxo de caixa */
  monthly: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  /** Projeção para próximos dias */
  projection: Array<{
    date: string;
    projectedBalance: number;
  }>;
}

/**
 * Props para o componente CashFlowChart
 */
interface CashFlowChartProps {
  /** Dados do gráfico */
  data: CashFlowData;
  /** Estado de carregamento */
  loading?: boolean;
  /** Estado de erro */
  error?: string | null;
  /** Tipo de período (daily ou monthly) */
  periodType?: 'daily' | 'monthly';
  /** Se deve mostrar projeção */
  showProjection?: boolean;
  /** Período do gráfico */
  period?: string;
}

/**
 * Componente de gráfico de fluxo de caixa com dados reais.
 * Mostra evolução do saldo ao longo do tempo com projeções.
 * @param props - Propriedades do componente
 * @returns Componente de gráfico de fluxo de caixa
 * @example
 * <CashFlowChart 
 *   data={cashFlowData} 
 *   periodType="daily" 
 *   showProjection={true}
 * />
 */
export function CashFlowChart({
  data,
  loading = false,
  error = null,
  periodType = 'daily',
  showProjection = false,
  period = 'Últimos 30 dias'
}: CashFlowChartProps) {
  // Seleciona dados baseado no tipo de período
  const chartData = periodType === 'daily' ? data.daily : data.monthly;
  
  // Configuração do gráfico
  const lineData = {
    labels: chartData.map(item => {
      if (periodType === 'daily') {
        return (item as any).date;
      } else {
        return (item as any).month;
      }
    }),
    datasets: [
      {
        label: 'Receitas',
        data: chartData.map(item => item.income),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        label: 'Despesas',
        data: chartData.map(item => item.expense),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        label: 'Saldo',
        data: chartData.map(item => item.balance),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      // Dataset de projeção (se habilitado)
      ...(showProjection && data.projection.length > 0 ? [{
        label: 'Projeção',
        data: [
          ...Array(chartData.length - data.projection.length).fill(null),
          ...data.projection.map(item => item.projectedBalance)
        ],
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }] : [])
    ]
  };

  // Opções do gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: periodType === 'daily' ? 'Data' : 'Mês'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Valor (R$)'
        },
        ticks: {
          callback: function(value: any) {
            return `R$ ${value.toLocaleString('pt-BR')}`;
          }
        }
      }
    }
  };

  // Calcula estatísticas
  const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = chartData.reduce((sum, item) => sum + item.expense, 0);
  const currentBalance = chartData[chartData.length - 1]?.balance || 0;
  const averageDailyBalance = chartData.reduce((sum, item) => sum + item.balance, 0) / chartData.length;

  return (
    <ChartWrapper
      title="Fluxo de Caixa"
      subtitle={period}
      loading={loading}
      error={error}
      height="400px"
    >
      <div className="space-y-4">
        {/* Estatísticas do fluxo de caixa */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Total Receitas</p>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">Total Despesas</p>
            <p className="text-lg font-semibold text-red-700 dark:text-red-300">
              R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">Saldo Atual</p>
            <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400">Média Diária</p>
            <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
              R$ {averageDailyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="h-64">
          <Line data={lineData} options={options} />
        </div>

        {/* Legenda da projeção */}
        {showProjection && data.projection.length > 0 && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
            Linha pontilhada representa projeção para os próximos {data.projection.length} dias
          </div>
        )}
      </div>
    </ChartWrapper>
  );
} 