import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Plus, Search, DollarSign, History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ReceivableForm } from '@/components/ReceivableForm';
import { PaymentForm } from '@/components/PaymentForm';
import { PaymentDetails } from '@/components/PaymentDetails';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Receivable {
  id: number;
  customer_id: number;
  customer_name?: string;
  category_id?: number;
  category_name?: string;
  amount: number;
  due_date: string;
  description?: string;
  status: 'pending' | 'partially_paid' | 'paid';
  remaining_amount: number;
  invoice_number?: string;
  payment_terms?: string;
}

const statusMap = {
  pending: { label: 'Pendente', variant: 'default' },
  partially_paid: { label: 'Parcialmente Pago', variant: 'secondary' },
  paid: { label: 'Pago', variant: 'outline' },
} as const;

export function Receivables() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);

  const fetchReceivables = async () => {
    try {
      setIsLoading(true);
      console.log('Buscando contas a receber...');
      const response = await api.get('/receivables');
      console.log('Resposta:', response.data);
      setReceivables(response.data);
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
      toast.error('Erro ao carregar contas a receber');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const handleStatusChange = async (receivableId: number, newStatus: string) => {
    try {
      await api.patch(`/receivables/${receivableId}/status`, {
        status: newStatus,
      });
      toast.success('Status atualizado com sucesso');
      fetchReceivables();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleEdit = async (receivable: Receivable) => {
    try {
      const response = await api.get(`/receivables/${receivable.id}`);
      const data = response.data;
      setSelectedReceivable({
        id: Number(data.id),
        customer_id: Number(data.customer_id),
        category_id: Number(data.category_id),
        customer_name: data.customer_name,
        category_name: data.category_name,
        amount: Number(data.amount),
        due_date: data.due_date,
        description: data.description,
        status: data.status,
        remaining_amount: Number(data.remaining_amount),
        invoice_number: data.invoice_number,
        payment_terms: data.payment_terms,
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar dados da conta a receber:', error);
      toast.error('Erro ao carregar dados da conta a receber');
    }
  };

  const handleAddPayment = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setIsPaymentDialogOpen(true);
  };

  const handleViewPayments = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setIsPaymentDetailsOpen(true);
  };

  const filteredReceivables = receivables.filter((receivable) => {
    const matchesSearch =
      (receivable.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (receivable.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (receivable.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || receivable.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (data: any) => {
    try {
      if (selectedReceivable) {
        await api.put(`/receivables/${selectedReceivable.id}`, data);
        toast.success('Conta a receber atualizada com sucesso');
      } else {
        await api.post('/receivables', data);
        toast.success('Conta a receber criada com sucesso');
      }
      setIsDialogOpen(false);
      setSelectedReceivable(null);
      fetchReceivables();
    } catch (error: any) {
      console.error('Erro ao salvar conta a receber:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar conta a receber');
    }
  };

  const handlePaymentSubmit = async (data: any) => {
    try {
      const response = await api.post(`/receivables/${selectedReceivable?.id}/payments`, {
        ...data,
        amount: parseFloat(data.amount),
        payment_date: format(new Date(data.payment_date), 'yyyy-MM-dd')
      });

      toast.success('Pagamento registrado com sucesso');
      setIsPaymentDialogOpen(false);
      fetchReceivables();
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error(error.response?.data?.error || 'Erro ao registrar pagamento');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
        <Button onClick={() => {
          setSelectedReceivable(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por cliente, descrição ou número da nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="partially_paid">Parcialmente Pagos</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Nº Nota</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Valor Restante</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredReceivables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Nenhuma conta a receber encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredReceivables.map((receivable) => (
                <TableRow key={receivable.id}>
                  <TableCell>{receivable.customer_name}</TableCell>
                  <TableCell>{receivable.description}</TableCell>
                  <TableCell>{receivable.invoice_number || '-'}</TableCell>
                  <TableCell>
                    {new Date(receivable.due_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(Number(receivable.amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(Number(receivable.remaining_amount))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        receivable.status === 'paid'
                          ? 'default'
                          : receivable.status === 'partially_paid'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {receivable.status === 'paid'
                        ? 'Pago'
                        : receivable.status === 'partially_paid'
                        ? 'Parcialmente Pago'
                        : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(receivable)}
                      >
                        Editar
                      </Button>
                      {receivable.status !== 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddPayment(receivable)}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Pagamento
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPayments(receivable)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Histórico
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedReceivable ? 'Editar Conta' : 'Nova Conta'}
            </DialogTitle>
            <DialogDescription>
              {selectedReceivable
                ? 'Atualize os dados da conta a receber'
                : 'Preencha os dados para criar uma nova conta a receber'}
            </DialogDescription>
          </DialogHeader>
          <ReceivableForm
            onSubmit={handleSubmit}
            initialData={selectedReceivable ? {
              id: selectedReceivable.id,
              customer_id: selectedReceivable.customer_id,
              category_id: selectedReceivable.category_id,
              amount: selectedReceivable.amount,
              due_date: selectedReceivable.due_date,
              description: selectedReceivable.description || '',
              invoice_number: selectedReceivable.invoice_number,
              payment_terms: selectedReceivable.payment_terms,
            } : undefined}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Pagamento</DialogTitle>
            <DialogDescription>
              Registre um novo pagamento para esta conta
            </DialogDescription>
          </DialogHeader>
          <PaymentForm
            onSubmit={handlePaymentSubmit}
            receivableId={selectedReceivable?.id}
            remainingAmount={selectedReceivable?.remaining_amount}
          />
        </DialogContent>
      </Dialog>

      {selectedReceivable && (
        <PaymentDetails
          receivableId={selectedReceivable.id}
          isOpen={isPaymentDetailsOpen}
          onClose={() => {
            setIsPaymentDetailsOpen(false);
            setSelectedReceivable(null);
          }}
        />
      )}
    </div>
  );
} 