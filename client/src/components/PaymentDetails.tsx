import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/axios';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  description?: string;
}

interface PaymentDetailsProps {
  receivableId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentDetails({ receivableId, isOpen, onClose }: PaymentDetailsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/receivables/${receivableId}/payments`);
      setPayments(response.data);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen, receivableId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Dinheiro',
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      bank_transfer: 'Transferência Bancária'
    };
    return methods[method] || method;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Histórico de Pagamentos</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhum pagamento registrado
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                    <TableCell>{payment.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
} 