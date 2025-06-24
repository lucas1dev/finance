import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { ChartWrapper } from './ChartWrapper';

// Registra os componentes necessários do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

/**
 * Dados para o gráfico de receitas vs despesas
 */
interface RevenueExpenseData {
  /** Receitas por categoria */
  revenues: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
  /** Despesas por categoria */
  expenses: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
  /** Dados mensais para gráfico de barras */
  monthly: Array<{
    month: string;
    revenue: number;
    expense: number;
  }>;
}

/**
 * Props para o componente RevenueExpenseChart
 */
interface RevenueExpenseChartProps {
  /** Dados do gráfico */
  data: RevenueExpenseData;
  /** Estado de carregamento */
  loading?: boolean;
  /** Estado de erro */
  error?: string | null;
  /** Tipo de gráfico (doughnut ou bar) */
  chartType?: 'doughnut' | 'bar';
  /** Período do gráfico */
  period?: string;
}

/**
 * Componente de gráfico de receitas vs despesas com dados reais.
 * Suporta gráficos de rosca (doughnut) e barras (bar).
 * @param props - Propriedades do componente
 * @returns Componente de gráfico de receitas vs despesas
 * @example
 * <RevenueExpenseChart 
 *   data={chartData} 
 *   chartType="doughnut" 
 *   period="Este mês"
 * />
 */
export function RevenueExpenseChart({
  data,
  loading = false,
  error = null,
  chartType = 'doughnut',
  period = 'Este mês'
}: RevenueExpenseChartProps) {
  // Configuração do gráfico de rosca
  const doughnutData = {
    labels: [
      ...data.revenues.map(item => `${item.category} (Receita)`),
      ...data.expenses.map(item => `${item.category} (Despesa)`)
    ],
    datasets: [
      {
        data: [
          ...data.revenues.map(item => item.amount),
          ...data.expenses.map(item => item.amount)
        ],
        backgroundColor: [
          ...data.revenues.map(item => item.color),
          ...data.expenses.map(item => item.color)
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Configuração do gráfico de barras
  const barData = {
    labels: data.monthly.map(item => item.month),
    datasets: [
      {
        label: 'Receitas',
        data: data.monthly.map(item => item.revenue),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      },
      {
        label: 'Despesas',
        data: data.monthly.map(item => item.expense),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  };

  // Opções do gráfico de rosca
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    }
  };

  // Opções do gráfico de barras
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `R$ ${value.toLocaleString('pt-BR')}`;
          }
        }
      }
    }
  };

  // Calcula totais para exibição
  const totalRevenue = data.revenues.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = data.expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalRevenue - totalExpense;

  return (
    <ChartWrapper
      title="Receitas vs Despesas"
      subtitle={period}
      loading={loading}
      error={error}
      height="400px"
    >
      <div className="space-y-4">
        {/* Resumo dos totais */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Receitas</p>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">Despesas</p>
            <p className="text-lg font-semibold text-red-700 dark:text-red-300">
              R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            balance >= 0 
              ? 'bg-blue-50 dark:bg-blue-900/20' 
              : 'bg-orange-50 dark:bg-orange-900/20'
          }`}>
            <p className={`text-sm ${
              balance >= 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              Saldo
            </p>
            <p className={`text-lg font-semibold ${
              balance >= 0 
                ? 'text-blue-700 dark:text-blue-300' 
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="h-64">
          {chartType === 'doughnut' ? (
            <Doughnut data={doughnutData} options={doughnutOptions} />
          ) : (
            <Bar data={barData} options={barOptions} />
          )}
        </div>
      </div>
    </ChartWrapper>
  );
} 