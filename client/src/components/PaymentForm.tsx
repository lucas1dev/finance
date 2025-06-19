import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

const paymentSchema = z.object({
  amount: z.string().min(1, 'Valor é obrigatório'),
  payment_date: z.date({
    required_error: 'Data do pagamento é obrigatória',
  }),
  payment_method: z.string().min(1, 'Método de pagamento é obrigatório'),
  account_id: z.string().min(1, 'Conta é obrigatória'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface Account {
  id: number;
  bank_name: string;
  account_type: string;
  balance: number;
}

interface PaymentFormProps {
  receivableId?: number;
  remainingAmount?: number;
  onSubmit: (data: PaymentFormData) => Promise<void>;
}

export function PaymentForm({
  receivableId,
  remainingAmount = 0,
  onSubmit,
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      payment_date: new Date(),
      payment_method: '',
      account_id: '',
    },
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/accounts');
        setAccounts(Array.isArray(response.data.accounts) ? response.data.accounts : []);
      } catch (error) {
        console.error('Erro ao carregar contas:', error);
        toast.error('Erro ao carregar contas');
        setAccounts([]);
      }
    };

    fetchAccounts();
  }, []);

  const handleSubmit = async (data: PaymentFormData) => {
    try {
      setIsLoading(true);
      const amount = parseFloat(data.amount.replace(',', '.'));
      
      if (amount <= 0) {
        toast.error('O valor do pagamento deve ser maior que zero');
        return;
      }

      if (amount > remainingAmount) {
        toast.error('O valor do pagamento não pode ser maior que o valor restante');
        return;
      }

      const response = await api.post(`/receivables/${receivableId}/payments`, {
        ...data,
        amount: amount,
        payment_date: format(new Date(data.payment_date), 'yyyy-MM-dd')
      });

      toast.success('Pagamento registrado com sucesso');
      onSubmit({
        ...data,
        amount: amount.toString(),
      });
      
      form.reset();
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error(error.response?.data?.error || 'Erro ao registrar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Pagamento</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="0,00"
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d,]/g, '');
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Pagamento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.isArray(accounts) && accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.bank_name} - {account.account_type} (Saldo: {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(account.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Valor Restante: {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(remainingAmount)}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrar Pagamento'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 