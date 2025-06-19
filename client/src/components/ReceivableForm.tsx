import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const receivableSchema = z.object({
  customer_id: z.number().min(1, 'Cliente é obrigatório'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  payment_terms: z.string().optional(),
});

export type ReceivableFormData = z.infer<typeof receivableSchema>;

interface ReceivableFormProps {
  initialData?: {
    id: number;
    customer_id: number;
    amount: number;
    due_date: string;
    description?: string;
    payment_terms?: string;
  };
  onSubmit: (data: ReceivableFormData) => Promise<void>;
}

interface Customer {
  id: number;
  name: string;
}

export function ReceivableForm({ initialData, onSubmit }: ReceivableFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ReceivableFormData>({
    resolver: zodResolver(receivableSchema),
    defaultValues: initialData
      ? {
          customer_id: initialData.customer_id,
          amount: initialData.amount,
          due_date: initialData.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : '',
          description: initialData.description,
          payment_terms: initialData.payment_terms,
        }
      : {
          customer_id: 0,
          amount: 0,
          due_date: '',
          description: '',
        },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersResponse = await api.get('/customers');
        setCustomers(customersResponse.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      }
    };

    fetchData();
  }, []);

  const handleFormSubmit = async (data: ReceivableFormData) => {
    try {
      setIsLoading(true);
      const formattedData = {
        ...data,
        due_date: new Date(data.due_date).toISOString(),
        description: data.description || '',
      };

      await onSubmit(formattedData);
      reset();
    } catch (error: any) {
      console.error('Erro ao salvar conta a receber:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar conta a receber');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {initialData ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
        </DialogTitle>
        <DialogDescription>
          {initialData
            ? 'Atualize as informações da conta a receber.'
            : 'Preencha as informações para criar uma nova conta a receber.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer_id">Cliente</Label>
          <Select
            defaultValue={initialData?.customer_id ? initialData.customer_id.toString() : undefined}
            onValueChange={(value) => setValue('customer_id', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.customer_id && (
            <p className="text-sm text-red-500">{errors.customer_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0,00"
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Data de Vencimento</Label>
          <Input
            id="due_date"
            type="date"
            {...register('due_date')}
          />
          {errors.due_date && (
            <p className="text-sm text-red-500">{errors.due_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Digite a descrição"
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_terms">Termos de Pagamento</Label>
          <Textarea
            id="payment_terms"
            {...register('payment_terms')}
            placeholder="Digite os termos de pagamento"
          />
          {errors.payment_terms && (
            <p className="text-sm text-red-500">{errors.payment_terms.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
        </Button>
      </form>
    </DialogContent>
  );
} 