import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Creditor {
  id: number;
  name: string;
  document_type: 'CPF' | 'CNPJ';
  document_number: string;
}

interface Financing {
  id: number;
  name: string;
  creditor_id: number;
  account_id: number;
  category_id?: number;
  amount: number;
  interest_rate: number;
  term_months: number;
  payment_amount: number;
  amortization_type: 'SAC' | 'Price';
  start_date: string;
  end_date: string;
  current_balance: number;
  total_paid: number;
  total_interest: number;
  status: 'active' | 'paid' | 'defaulted';
  description?: string;
  creditor?: Creditor;
  account?: any;
  category?: any;
}

interface FinancingChartsProps {
  financings: Financing[];
}

/**
 * Componente de gráficos para visualização de dados de financiamentos.
 * @param {Object} props - Propriedades do componente.
 * @param {Financing[]} props.financings - Lista de financiamentos para análise.
 * @returns {JSX.Element} Componente com gráficos de financiamentos.
 * @example
 * <FinancingCharts financings={financingsData} />
 */
export function FinancingCharts({ financings }: FinancingChartsProps) {
  // Dados para gráfico de distribuição por status
  const statusData = {
    labels: ['Ativos', 'Pagos', 'Inadimplentes'],
    datasets: [
      {
        data: [
          financings.filter(f => f.status === 'active').length,
          financings.filter(f => f.status === 'paid').length,
          financings.filter(f => f.status === 'defaulted').length,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Verde para ativos
          'rgba(59, 130, 246, 0.8)', // Azul para pagos
          'rgba(239, 68, 68, 0.8)', // Vermelho para inadimplentes
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico de distribuição por credor
  const creditorData = financings.reduce((acc, financing) => {
    const creditorName = financing.creditor?.name || 'Sem credor';
    if (acc[creditorName]) {
      acc[creditorName] += financing.current_balance;
    } else {
      acc[creditorName] = financing.current_balance;
    }
    return acc;
  }, {} as Record<string, number>);

  const creditorChartData = {
    labels: Object.keys(creditorData),
    datasets: [
      {
        label: 'Saldo Devedor por Credor',
        data: Object.values(creditorData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Dados para gráfico de juros vs principal
  const totalPrincipal = financings.reduce((sum, f) => sum + f.amount, 0);
  const totalInterest = financings.reduce((sum, f) => sum + f.total_interest, 0);
  const totalPaid = financings.reduce((sum, f) => sum + f.total_paid, 0);

  const compositionData = {
    labels: ['Principal Pago', 'Juros Pagos', 'Saldo Devedor'],
    datasets: [
      {
        data: [
          totalPaid - totalInterest, // Principal pago
          totalInterest, // Juros pagos
          financings.reduce((sum, f) => sum + f.current_balance, 0), // Saldo devedor
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Verde para principal
          'rgba(245, 158, 11, 0.8)', // Amarelo para juros
          'rgba(239, 68, 68, 0.8)', // Vermelho para saldo devedor
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico de evolução do saldo devedor (últimos 6 meses)
  const activeFinancings = financings.filter(f => f.status === 'active');
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    return month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  }).reverse();

  const balanceEvolutionData = {
    labels: monthlyData,
    datasets: [
      {
        label: 'Saldo Devedor Total',
        data: monthlyData.map(() => {
          // Simulação de evolução do saldo (em um cenário real, isso viria do backend)
          const baseBalance = financings.reduce((sum, f) => sum + f.current_balance, 0);
          return baseBalance * (0.9 + Math.random() * 0.2); // Variação de ±10%
        }),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || context.raw;
            if (typeof value === 'number') {
              return `${label}: ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(value)}`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Distribuição por Status */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={statusData} options={doughnutOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Composição (Principal vs Juros) */}
      <Card>
        <CardHeader>
          <CardTitle>Composição do Financiamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={compositionData} options={doughnutOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Saldo por Credor */}
      <Card>
        <CardHeader>
          <CardTitle>Saldo Devedor por Credor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={creditorChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução do Saldo */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Saldo Devedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={balanceEvolutionData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 