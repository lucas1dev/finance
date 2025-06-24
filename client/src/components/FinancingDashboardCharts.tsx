/**
 * Componente de gráficos de financiamentos para o dashboard.
 * Mostra total financiado por mês (linha), distribuição por status (pizza) e saldo devedor total.
 *
 * @returns {JSX.Element} Gráficos de resumo dos financiamentos.
 * @example
 * <FinancingDashboardCharts />
 */
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import api from '@/lib/axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface Financing {
  id: number;
  name: string;
  amount: number;
  current_balance: number;
  status: 'active' | 'paid' | 'defaulted';
  start_date: string;
}

export function FinancingDashboardCharts() {
  const [financings, setFinancings] = useState<Financing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancings();
  }, []);

  const fetchFinancings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financings');
      setFinancings(response.data.financings || response.data);
    } catch (error) {
      // Silenciar erro para dashboard
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por mês de início
  const monthlyTotals: Record<string, number> = {};
  financings.forEach(f => {
    const month = new Date(f.start_date).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    monthlyTotals[month] = (monthlyTotals[month] || 0) + f.amount;
  });
  const months = Object.keys(monthlyTotals).sort((a, b) => new Date('01 ' + a).getTime() - new Date('01 ' + b).getTime());
  const monthlyData = months.map(m => monthlyTotals[m]);

  // Distribuição por status
  const statusTotals = {
    Ativo: financings.filter(f => f.status === 'active').length,
    Pago: financings.filter(f => f.status === 'paid').length,
    Inadimplente: financings.filter(f => f.status === 'defaulted').length,
  };

  // Saldo devedor total
  const totalBalance = financings.reduce((sum, f) => sum + f.current_balance, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
      <Card>
        <CardHeader>
          <CardTitle>Total Financiado por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <Line
            data={{
              labels: months,
              datasets: [
                {
                  label: 'Total Financiado',
                  data: monthlyData,
                  borderColor: '#2563eb',
                  backgroundColor: 'rgba(37,99,235,0.2)',
                  tension: 0.4,
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Pie
            data={{
              labels: Object.keys(statusTotals),
              datasets: [
                {
                  data: Object.values(statusTotals),
                  backgroundColor: ['#2563eb', '#22c55e', '#ef4444'],
                },
              ],
            }}
            options={{
              plugins: {
                legend: { position: 'bottom' },
              },
            }}
          />
        </CardContent>
      </Card>
      <Card className="flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>Saldo Devedor Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-700">
            {loading ? '...' : totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 