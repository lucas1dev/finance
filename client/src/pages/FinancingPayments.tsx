import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import financingService, { FinancingPayment, CreateFinancingPayment } from '../lib/financingService';

/**
 * Página para gerenciamento de pagamentos de financiamentos.
 * Permite listar, filtrar e registrar pagamentos de parcelas de financiamentos.
 * @component
 * @returns {JSX.Element} Página de pagamentos de financiamentos
 * @example <FinancingPayments />
 */
const FinancingPayments: React.FC = () => {
  const [payments, setPayments] = useState<FinancingPayment[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number }>({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<CreateFinancingPayment>>({});

  /**
   * Busca os pagamentos de financiamento com filtros e paginação.
   * @async
   * @returns {Promise<void>}
   */
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { payments, pagination: pag } = await financingService.getPayments({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setPayments(payments);
      setPagination((prev) => ({ ...prev, ...pag }));
    } catch (err) {
      toast.error('Erro ao buscar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line
  }, [filters, pagination.page, pagination.limit]);

  /**
   * Manipula mudança nos filtros.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e
   */
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Manipula mudança no formulário de registro.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e
   */
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Manipula mudança do select de método de pagamento.
   * @param {string} value
   */
  const handlePaymentMethodChange = (value: 'boleto' | 'debito_automatico' | 'cartao' | 'pix' | 'transferencia') => {
    setForm({ ...form, payment_method: value });
  };

  /**
   * Manipula mudança do select de tipo de pagamento.
   * @param {string} value
   */
  const handlePaymentTypeChange = (value: 'parcela' | 'parcial' | 'antecipado') => {
    setForm({ ...form, payment_type: value });
  };

  /**
   * Submete o formulário de registro de pagamento.
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financingService.createPayment(form as CreateFinancingPayment);
      toast.success('Pagamento registrado com sucesso');
      setOpen(false);
      setForm({});
      fetchPayments();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao registrar pagamento');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pagamentos de Financiamentos</h1>
      <div className="flex gap-4 mb-4">
        <Input name="financing_id" placeholder="ID do Financiamento" onChange={handleFilterChange} />
        <Input name="account_id" placeholder="ID da Conta" onChange={handleFilterChange} />
        <Select name="status" onValueChange={value => setFilters({ ...filters, status: value })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}>Filtrar</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Registrar Pagamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <Input name="financing_id" placeholder="ID do Financiamento" onChange={handleFormChange} required />
              <Input name="account_id" placeholder="ID da Conta" onChange={handleFormChange} required />
              <Input name="installment_number" placeholder="Nº Parcela" type="number" onChange={handleFormChange} required />
              <Input name="payment_amount" placeholder="Valor Total" type="number" step="0.01" onChange={handleFormChange} required />
              <Input name="principal_amount" placeholder="Valor Amortização" type="number" step="0.01" onChange={handleFormChange} required />
              <Input name="interest_amount" placeholder="Valor Juros" type="number" step="0.01" onChange={handleFormChange} required />
              <Input name="payment_date" placeholder="Data do Pagamento" type="date" onChange={handleFormChange} required />
              <Select name="payment_method" onValueChange={handlePaymentMethodChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Método de Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="debito_automatico">Débito Automático</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
              <Select name="payment_type" onValueChange={handlePaymentTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo de Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parcela">Parcela</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="antecipado">Antecipado</SelectItem>
                </SelectContent>
              </Select>
              <Input name="observations" placeholder="Observações" onChange={handleFormChange} />
              <Button type="submit">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Financiamento</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Parcela</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Amortização</TableHead>
            <TableHead>Juros</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={9}>Carregando...</TableCell></TableRow>
          ) : payments.length === 0 ? (
            <TableRow><TableCell colSpan={9}>Nenhum pagamento encontrado</TableCell></TableRow>
          ) : (
            payments.map(payment => (
              <TableRow key={payment.id}>
                <TableCell>{payment.id}</TableCell>
                <TableCell>{payment.financing_id}</TableCell>
                <TableCell>{payment.account_id}</TableCell>
                <TableCell>{payment.installment_number}</TableCell>
                <TableCell>{financingService.formatCurrency(payment.payment_amount)}</TableCell>
                <TableCell>{financingService.formatCurrency(payment.principal_amount)}</TableCell>
                <TableCell>{financingService.formatCurrency(payment.interest_amount)}</TableCell>
                <TableCell>{financingService.formatDate(payment.payment_date)}</TableCell>
                <TableCell>{payment.status}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center mt-4">
        <Button disabled={pagination.page === 1} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}>Anterior</Button>
        <span>Página {pagination.page}</span>
        <Button disabled={payments.length < pagination.limit} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}>Próxima</Button>
      </div>
    </div>
  );
};

export default FinancingPayments; 