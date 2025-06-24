import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinancingCharts } from '../../src/components/FinancingCharts';

// Mock do Chart.js para evitar erros de canvas
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
}));

// Mock dos componentes de gráfico
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-labels={JSON.stringify(data.labels)}>
      Line Chart
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-labels={JSON.stringify(data.labels)}>
      Bar Chart
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-labels={JSON.stringify(data.labels)}>
      Doughnut Chart
    </div>
  ),
}));

const mockFinancings = [
  {
    id: 1,
    name: 'Financiamento Casa',
    creditor_id: 1,
    account_id: 1,
    amount: 200000,
    interest_rate: 0.8,
    term_months: 240,
    payment_amount: 1500,
    amortization_type: 'SAC' as const,
    start_date: '2024-01-01',
    end_date: '2044-01-01',
    current_balance: 180000,
    total_paid: 20000,
    total_interest: 5000,
    status: 'active' as const,
    description: 'Financiamento da casa própria',
    creditor: {
      id: 1,
      name: 'Banco ABC',
      document_type: 'CNPJ' as const,
      document_number: '12.345.678/0001-90',
    },
  },
  {
    id: 2,
    name: 'Financiamento Carro',
    creditor_id: 2,
    account_id: 1,
    amount: 50000,
    interest_rate: 1.2,
    term_months: 60,
    payment_amount: 1200,
    amortization_type: 'Price' as const,
    start_date: '2024-06-01',
    end_date: '2029-06-01',
    current_balance: 40000,
    total_paid: 10000,
    total_interest: 3000,
    status: 'active' as const,
    description: 'Financiamento do carro',
    creditor: {
      id: 2,
      name: 'Banco XYZ',
      document_type: 'CNPJ' as const,
      document_number: '98.765.432/0001-10',
    },
  },
  {
    id: 3,
    name: 'Financiamento Antigo',
    creditor_id: 1,
    account_id: 1,
    amount: 100000,
    interest_rate: 1.0,
    term_months: 120,
    payment_amount: 1500,
    amortization_type: 'SAC' as const,
    start_date: '2020-01-01',
    end_date: '2030-01-01',
    current_balance: 0,
    total_paid: 100000,
    total_interest: 20000,
    status: 'paid' as const,
    description: 'Financiamento já quitado',
    creditor: {
      id: 1,
      name: 'Banco ABC',
      document_type: 'CNPJ' as const,
      document_number: '12.345.678/0001-90',
    },
  },
];

/**
 * Testes para o componente FinancingCharts
 */
describe('FinancingCharts', () => {
  it('deve renderizar o componente com gráficos', () => {
    render(<FinancingCharts financings={mockFinancings} />);
    
    // Verifica se os títulos dos gráficos estão presentes
    expect(screen.getByText('Distribuição por Status')).toBeInTheDocument();
    expect(screen.getByText('Composição do Financiamento')).toBeInTheDocument();
    expect(screen.getByText('Saldo Devedor por Credor')).toBeInTheDocument();
    expect(screen.getByText('Evolução do Saldo Devedor')).toBeInTheDocument();
  });

  it('deve renderizar todos os tipos de gráficos', () => {
    render(<FinancingCharts financings={mockFinancings} />);
    
    // Verifica se todos os gráficos estão sendo renderizados
    expect(screen.getAllByTestId('doughnut-chart')).toHaveLength(2);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('deve calcular corretamente os dados de distribuição por status', () => {
    render(<FinancingCharts financings={mockFinancings} />);
    
    const doughnutCharts = screen.getAllByTestId('doughnut-chart');
    const statusChart = doughnutCharts[0];
    
    // Verifica se os labels estão corretos
    const labels = JSON.parse(statusChart.getAttribute('data-labels') || '[]');
    expect(labels).toEqual(['Ativos', 'Pagos', 'Inadimplentes']);
  });

  it('deve calcular corretamente os dados de composição', () => {
    render(<FinancingCharts financings={mockFinancings} />);
    
    const doughnutCharts = screen.getAllByTestId('doughnut-chart');
    const compositionChart = doughnutCharts[1];
    
    // Verifica se os labels estão corretos
    const labels = JSON.parse(compositionChart.getAttribute('data-labels') || '[]');
    expect(labels).toEqual(['Principal Pago', 'Juros Pagos', 'Saldo Devedor']);
  });

  it('deve calcular corretamente os dados de saldo por credor', () => {
    render(<FinancingCharts financings={mockFinancings} />);
    
    const barChart = screen.getByTestId('bar-chart');
    
    // Verifica se os labels estão corretos (incluindo "Sem credor" para casos sem credor)
    const labels = JSON.parse(barChart.getAttribute('data-labels') || '[]');
    expect(labels).toContain('Banco ABC');
    expect(labels).toContain('Banco XYZ');
  });

  it('deve renderizar gráfico de evolução do saldo', () => {
    render(<FinancingCharts financings={mockFinancings} />);
    
    const lineChart = screen.getByTestId('line-chart');
    expect(lineChart).toBeInTheDocument();
  });

  it('deve lidar com lista vazia de financiamentos', () => {
    render(<FinancingCharts financings={[]} />);
    
    // Verifica se o componente ainda renderiza sem dados
    expect(screen.getByText('Distribuição por Status')).toBeInTheDocument();
    expect(screen.getByText('Composição do Financiamento')).toBeInTheDocument();
    expect(screen.getByText('Saldo Devedor por Credor')).toBeInTheDocument();
    expect(screen.getByText('Evolução do Saldo Devedor')).toBeInTheDocument();
  });

  it('deve lidar com financiamentos sem credor', () => {
    const financingsWithoutCreditor = [
      {
        ...mockFinancings[0],
        creditor: undefined,
      },
    ];
    
    render(<FinancingCharts financings={financingsWithoutCreditor} />);
    
    const barChart = screen.getByTestId('bar-chart');
    const labels = JSON.parse(barChart.getAttribute('data-labels') || '[]');
    expect(labels).toContain('Sem credor');
  });

  it('deve ter estrutura de grid responsiva', () => {
    const { container } = render(<FinancingCharts financings={mockFinancings} />);
    
    // Verifica se o container tem as classes de grid do Tailwind
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
  });

  it('deve ter cards com altura fixa para os gráficos', () => {
    const { container } = render(<FinancingCharts financings={mockFinancings} />);
    
    // Verifica se os containers dos gráficos têm altura fixa
    const chartContainers = container.querySelectorAll('.h-64');
    expect(chartContainers).toHaveLength(4);
  });
}); 