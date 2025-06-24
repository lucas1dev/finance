/**
 * @jest-environment jsdom
 */

/**
 * Testes unitários para a página Payables
 * @module __tests__/pages/Payables.test.tsx
 * @description Testes para funcionalidades de gerenciamento de contas a pagar
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Payables from '../../src/pages/Payables';

// @ts-nocheck - Ignorar erros de TypeScript relacionados ao Jest

// Mock simples dos componentes UI
jest.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../../src/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}));

jest.mock('../../src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('../../src/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('../../src/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
}));

jest.mock('../../src/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('../../src/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../src/components/ui/form', () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ children }: any) => <div>{children}</div>,
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormMessage: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../src/components/ui/textarea', () => ({
  Textarea: ({ ...props }: any) => <textarea {...props} />,
}));

jest.mock('../../src/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../src/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div>
      <div data-testid="tabs-value">{value}</div>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-${value}`}>{children}</button>,
  TabsContent: ({ children, value }: any) => <div data-testid={`content-${value}`}>{children}</div>,
}));

// Mock dos utilitários
jest.mock('../../src/lib/utils', () => ({
  formatCurrency: jest.fn((value) => `R$ ${value.toFixed(2)}`),
  formatDate: jest.fn((date) => date.toLocaleDateString('pt-BR')),
}));

// Mock dos ícones do Lucide
jest.mock('lucide-react', () => ({
  Plus: () => <span>Plus</span>,
  Search: () => <span>Search</span>,
  Filter: () => <span>Filter</span>,
  Download: () => <span>Download</span>,
  Eye: () => <span>Eye</span>,
  Edit: () => <span>Edit</span>,
  Trash2: () => <span>Trash2</span>,
  Calendar: () => <span>Calendar</span>,
  DollarSign: () => <span>DollarSign</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Clock: () => <span>Clock</span>,
  XCircle: () => <span>XCircle</span>,
}));

// Mock do react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {} },
    reset: jest.fn(),
    setValue: jest.fn(),
    watch: jest.fn(),
    control: {},
  })),
}));

// Mock do @hookform/resolvers/zod
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(),
}));

// Mock do sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

/**
 * Wrapper para renderizar o componente com as dependências necessárias
 */
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

/**
 * Testes da página Payables
 */
describe('Payables Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Testes de renderização básica
   */
  describe('Renderização', () => {
    it('deve renderizar o título da página', () => {
      renderWithRouter(<Payables />);
      expect(screen.getByRole('heading', { name: 'Contas a Pagar' })).toBeInTheDocument();
    });

    it('deve renderizar a descrição da página', () => {
      renderWithRouter(<Payables />);
      expect(screen.getByText('Gerencie suas contas a pagar e controle de fluxo de caixa')).toBeInTheDocument();
    });

    it('deve renderizar os botões de ação', () => {
      renderWithRouter(<Payables />);
      expect(screen.getAllByText('Exportar').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nova Conta a Pagar').length).toBeGreaterThan(0);
    });

    it('deve renderizar os cards de estatísticas', () => {
      renderWithRouter(<Payables />);
      expect(screen.getByText('Total de Contas')).toBeInTheDocument();
      expect(screen.getByText('Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Vencidas')).toBeInTheDocument();
      expect(screen.getByText('Pagas')).toBeInTheDocument();
    });

    it('deve renderizar as abas', () => {
      renderWithRouter(<Payables />);
      expect(screen.getAllByText('Visão Geral').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Contas a Pagar').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Relatórios').length).toBeGreaterThan(0);
    });

    it('deve renderizar a tabela de contas a pagar', () => {
      renderWithRouter(<Payables />);
      expect(screen.getAllByText('Lista de Contas a Pagar').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Descrição').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Fornecedor').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Categoria').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Valor').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Restante').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Vencimento').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ações').length).toBeGreaterThan(0);
    });

    it('deve renderizar os dados mockados na tabela', () => {
      renderWithRouter(<Payables />);
      expect(screen.getByText('Aluguel do escritório')).toBeInTheDocument();
      expect(screen.getByText('Serviços de limpeza')).toBeInTheDocument();
      expect(screen.getByText('Material de escritório')).toBeInTheDocument();
      expect(screen.getByText('Impostos municipais')).toBeInTheDocument();
      expect(screen.getByText('Internet e telefone')).toBeInTheDocument();
    });
  });

  /**
   * Testes de funcionalidades básicas
   */
  describe('Funcionalidades', () => {
    it('deve mostrar toast de sucesso ao exportar dados', () => {
      const { toast } = require('sonner');
      renderWithRouter(<Payables />);
      const exportButton = screen.getAllByText('Exportar')[0];
      exportButton.click();
      expect(toast.success).toHaveBeenCalledWith('Dados exportados com sucesso');
    });

    it('deve mostrar contador correto de contas encontradas', () => {
      renderWithRouter(<Payables />);
      expect(screen.getByText('5 conta(s) encontrada(s)')).toBeInTheDocument();
    });

    it('deve mostrar status corretos nas contas a pagar', () => {
      renderWithRouter(<Payables />);
      expect(screen.getAllByText('Pendente').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pago').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Vencido').length).toBeGreaterThan(0);
    });
  });

  /**
   * Testes de acessibilidade
   */
  describe('Acessibilidade', () => {
    it('deve ter placeholders informativos nos campos de busca', () => {
      renderWithRouter(<Payables />);
      expect(screen.getByPlaceholderText('Descrição, fornecedor...')).toBeInTheDocument();
    });

    it('deve ter botões com texto descritivo', () => {
      renderWithRouter(<Payables />);
      expect(screen.getAllByText('Nova Conta a Pagar').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Exportar').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Limpar').length).toBeGreaterThan(0);
    });

    it('deve ter títulos de seção claros', () => {
      renderWithRouter(<Payables />);
      expect(screen.getAllByText('Filtros').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Lista de Contas a Pagar').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Resumo de Contas a Pagar').length).toBeGreaterThan(0);
    });
  });
}); 