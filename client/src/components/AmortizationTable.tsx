import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface AmortizationRow {
  payment_number: number;
  due_date: string;
  payment_amount: number;
  principal_amount: number;
  interest_amount: number;
  remaining_balance: number;
}

interface Financing {
  id: number;
  name: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  payment_amount: number;
  amortization_type: 'SAC' | 'Price';
  start_date: string;
  current_balance: number;
}

interface AmortizationTableProps {
  financing: Financing;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export function AmortizationTable({ financing }: AmortizationTableProps) {
  const [amortizationTable, setAmortizationTable] = useState<AmortizationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 meses por página

  useEffect(() => {
    fetchAmortizationTable();
  }, [financing.id]);

  const fetchAmortizationTable = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/financings/${financing.id}/amortization`);
      setAmortizationTable(response.data);
    } catch (error: any) {
      console.error('Erro ao buscar tabela de amortização:', error);
      toast.error(error.response?.data?.message || 'Erro ao buscar tabela de amortização');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular totais
  const totalPayments = amortizationTable.reduce((sum, row) => sum + row.payment_amount, 0);
  const totalPrincipal = amortizationTable.reduce((sum, row) => sum + row.principal_amount, 0);
  const totalInterest = amortizationTable.reduce((sum, row) => sum + row.interest_amount, 0);

  // Paginação
  const totalPages = Math.ceil(amortizationTable.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = amortizationTable.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando tabela de amortização...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Resumo do Financiamento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm font-medium text-gray-500">Valor Total</div>
          <div className="text-lg font-bold">{formatCurrency(financing.amount)}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Taxa de Juros</div>
          <div className="text-lg font-bold">{financing.interest_rate}% a.m.</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Prazo</div>
          <div className="text-lg font-bold">{financing.term_months} meses</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Sistema</div>
          <div className="text-lg font-bold">{financing.amortization_type}</div>
        </div>
      </div>

      {/* Tabela de Amortização */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Parcela</TableHead>
              <TableHead className="text-center">Vencimento</TableHead>
              <TableHead className="text-right">Valor da Parcela</TableHead>
              <TableHead className="text-right">Amortização</TableHead>
              <TableHead className="text-right">Juros</TableHead>
              <TableHead className="text-right">Saldo Devedor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRows.map((row) => (
              <TableRow key={row.payment_number}>
                <TableCell className="text-center font-medium">
                  {row.payment_number}
                </TableCell>
                <TableCell className="text-center">
                  {formatDate(row.due_date)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.payment_amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.principal_amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.interest_amount)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.remaining_balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
        <div>
          <div className="text-sm font-medium text-gray-600">Total de Parcelas</div>
          <div className="text-lg font-bold text-blue-600">
            {formatCurrency(totalPayments)}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600">Total Amortizado</div>
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(totalPrincipal)}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600">Total de Juros</div>
          <div className="text-lg font-bold text-red-600">
            {formatCurrency(totalInterest)}
          </div>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Informações da Paginação */}
      <div className="text-center text-sm text-gray-500">
        Mostrando {startIndex + 1} a {Math.min(endIndex, amortizationTable.length)} de {amortizationTable.length} parcelas
      </div>
    </div>
  );
} 