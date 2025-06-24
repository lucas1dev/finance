import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

import accountService, { Account } from '@/lib/accountService';

/**
 * Schema de validação para pagamento de recebível
 */
const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  payment_date: z.date({
    required_error: 'Data do pagamento é obrigatória',
  }),
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer'], {
    errorMap: () => ({ message: 'Método de pagamento é obrigatório' })
  }),
  account_id: z.number().min(1, 'Conta é obrigatória'),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

/**
 * Props do componente PaymentForm
 */
interface PaymentFormProps {
  receivableId: number;
  remainingAmount: number;
  onSubmit: (data: {
    amount: number;
    payment_date: string;
    payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
    account_id: number;
    description?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

/**
 * Componente de formulário para registro de pagamento de recebível
 */
export function PaymentForm({
  receivableId,
  remainingAmount = 0,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remainingAmount,
      payment_date: new Date(),
      payment_method: undefined,
      account_id: undefined,
      description: '',
    },
  });

  // Carregar contas
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true);
        console.log('🔍 PaymentForm - Iniciando carregamento de contas...');
        console.log('🔍 PaymentForm - Token no localStorage:', !!localStorage.getItem('token'));
        
        const accountsData = await accountService.getAccounts();
        
        console.log('✅ PaymentForm - Contas carregadas:', accountsData.length);
        console.log('✅ PaymentForm - Dados das contas:', JSON.stringify(accountsData, null, 2));
        
        setAccounts(accountsData);
        
        // Selecionar primeira conta por padrão
        if (accountsData.length > 0 && !form.getValues('account_id')) {
          console.log('🎯 PaymentForm - Selecionando primeira conta:', accountsData[0].id);
          form.setValue('account_id', accountsData[0].id);
        }
      } catch (error) {
        console.error('❌ PaymentForm - Erro ao carregar contas:', error);
        toast.error('Erro ao carregar contas');
        setAccounts([]);
      } finally {
        setLoadingAccounts(false);
        console.log('🏁 PaymentForm - Carregamento de contas finalizado');
      }
    };

    fetchAccounts();
  }, [form]);

  const handleSubmit = async (data: PaymentFormData) => {
    try {
      setIsLoading(true);
      console.log('🔍 PaymentForm - Submetendo pagamento:', JSON.stringify(data, null, 2));
      
      // Validações adicionais
      if (data.amount <= 0) {
        toast.error('O valor do pagamento deve ser maior que zero');
        return;
      }

      if (data.amount > remainingAmount) {
        toast.error('O valor do pagamento não pode ser maior que o valor restante');
        return;
      }

      // Formatar dados para envio
      const paymentData = {
        ...data,
        payment_date: format(data.payment_date, 'yyyy-MM-dd'),
        amount: Number(data.amount),
        account_id: Number(data.account_id),
      };

      console.log('🔍 PaymentForm - Dados formatados:', JSON.stringify(paymentData, null, 2));
      
      await onSubmit(paymentData);
      
      toast.success('Pagamento registrado com sucesso');
      form.reset({
        amount: remainingAmount,
        payment_date: new Date(),
        payment_method: undefined,
        account_id: accounts.length > 0 ? accounts[0].id : undefined,
        description: '',
      });
    } catch (error: any) {
      console.error('❌ PaymentForm - Erro ao registrar pagamento:', error);
      toast.error(error.message || 'Erro ao registrar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Valor do Pagamento */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Pagamento *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  placeholder="0,00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                Valor restante: {formatCurrency(remainingAmount)}
              </p>
            </FormItem>
          )}
        />

        {/* Data do Pagamento */}
        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Pagamento *</FormLabel>
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

        {/* Método de Pagamento */}
        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pagamento *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conta */}
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta *</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                value={field.value?.toString()}
                disabled={loadingAccounts}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAccounts ? "Carregando..." : "Selecione a conta"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingAccounts ? (
                    <SelectItem value="loading" disabled>
                      Carregando contas...
                    </SelectItem>
                  ) : accounts.length === 0 ? (
                    <SelectItem value="no-accounts" disabled>
                      Nenhuma conta encontrada
                    </SelectItem>
                  ) : (
                    accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.bank_name} - {account.account_type} (Saldo: {formatCurrency(account.balance)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição adicional do pagamento"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading || loadingAccounts}>
            {isLoading ? 'Registrando...' : 'Registrar Pagamento'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 