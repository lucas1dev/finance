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
import customerService, { Customer } from '@/lib/customerService';
import categoryService, { Category } from '@/lib/categoryService';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const receivableSchema = z.object({
  customer_id: z.number().min(1, 'Cliente é obrigatório'),
  category_id: z.number().min(1, 'Categoria é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  invoice_number: z.string().optional(),
  payment_terms: z.string().optional(),
});

export type ReceivableFormData = z.infer<typeof receivableSchema>;

interface ReceivableFormProps {
  initialData?: {
    id: number;
    customer_id: number;
    category_id?: number;
    amount: number;
    due_date: string;
    description?: string;
    invoice_number?: string;
    payment_terms?: string;
  };
  onSubmit: (data: ReceivableFormData) => Promise<void>;
}

export function ReceivableForm({ initialData, onSubmit }: ReceivableFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReceivableFormData>({
    resolver: zodResolver(receivableSchema),
    defaultValues: initialData
      ? {
          customer_id: initialData.customer_id,
          category_id: initialData.category_id,
          amount: initialData.amount,
          due_date: initialData.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : '',
          description: initialData.description || '',
          invoice_number: initialData.invoice_number || '',
          payment_terms: initialData.payment_terms || '',
        }
      : {
          customer_id: 0,
          category_id: 0,
          amount: 0,
          due_date: '',
          description: '',
          invoice_number: '',
          payment_terms: '',
        },
  });

  // Carregar clientes
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        console.log('🔄 Carregando clientes...');
        
        const customersData = await customerService.getCustomers();
        console.log('✅ Clientes carregados:', customersData);
        
        setCustomers(customersData);
      } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        toast.error('Erro ao carregar clientes');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Carregar categorias de receita
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log('🔄 Carregando categorias...');
        
        const categoriesData = await categoryService.getCategoriesByType('income');
        console.log('✅ Categorias carregadas:', categoriesData);
        
        setCategories(categoriesData);
      } catch (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        toast.error('Erro ao carregar categorias');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Após carregar as categorias, define a primeira como padrão se não houver selecionada
  useEffect(() => {
    if (!loadingCategories && categories.length > 0) {
      const current = watch('category_id');
      if (!current || current === 0) {
        console.log('🎯 Definindo categoria padrão:', categories[0].id);
        setValue('category_id', categories[0].id);
      }
    }
  }, [loadingCategories, categories, setValue, watch]);

  const handleFormSubmit = async (data: ReceivableFormData) => {
    try {
      setIsLoading(true);
      console.log('📝 Dados do formulário:', data);
      
      // Validar se category_id está definido
      if (!data.category_id || data.category_id === 0) {
        toast.error('Por favor, selecione uma categoria');
        return;
      }
      
      const formattedData = {
        ...data,
        due_date: new Date(data.due_date).toISOString(),
        description: data.description || '',
        invoice_number: data.invoice_number || undefined,
        payment_terms: data.payment_terms || undefined,
      };

      console.log('📝 Dados formatados:', formattedData);
      await onSubmit(formattedData);
      reset();
    } catch (error: any) {
      console.error('❌ Erro ao salvar conta a receber:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar conta a receber');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCustomerId = watch('customer_id');
  const selectedCategoryId = watch('category_id');

  return (
    <DialogContent className="max-w-md">
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
        {/* Cliente */}
        <div className="space-y-2">
          <Label htmlFor="customer_id">Cliente *</Label>
          <Select
            value={selectedCustomerId && selectedCustomerId > 0 ? selectedCustomerId.toString() : undefined}
            onValueChange={(value) => {
              console.log('🎯 Cliente selecionado:', value);
              setValue('customer_id', parseInt(value));
            }}
            disabled={loadingCustomers}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingCustomers ? "Carregando..." : "Selecione um cliente"} />
            </SelectTrigger>
            <SelectContent>
              {loadingCustomers ? (
                <SelectItem value="loading" disabled>
                  Carregando clientes...
                </SelectItem>
              ) : customers.length === 0 ? (
                <SelectItem value="no-customers" disabled>
                  Nenhum cliente encontrado
                </SelectItem>
              ) : (
                customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.customer_id && (
            <p className="text-sm text-red-500">{errors.customer_id.message}</p>
          )}
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label htmlFor="category_id">Categoria *</Label>
          <Select
            value={selectedCategoryId && selectedCategoryId > 0 ? selectedCategoryId.toString() : undefined}
            onValueChange={(value) => {
              console.log('🎯 Categoria selecionada:', value);
              setValue('category_id', parseInt(value));
            }}
            disabled={loadingCategories}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingCategories ? "Carregando..." : "Selecione uma categoria"} />
            </SelectTrigger>
            <SelectContent>
              {loadingCategories ? (
                <SelectItem value="loading-categories" disabled>
                  Carregando categorias...
                </SelectItem>
              ) : categories.length === 0 ? (
                <SelectItem value="no-categories" disabled>
                  Nenhuma categoria encontrada
                </SelectItem>
              ) : (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.category_id && (
            <p className="text-sm text-red-500">{errors.category_id.message}</p>
          )}
        </div>

        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="amount">Valor *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0,00"
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Data de Vencimento */}
        <div className="space-y-2">
          <Label htmlFor="due_date">Data de Vencimento *</Label>
          <Input
            id="due_date"
            type="date"
            {...register('due_date')}
          />
          {errors.due_date && (
            <p className="text-sm text-red-500">{errors.due_date.message}</p>
          )}
        </div>

        {/* Número da Nota Fiscal */}
        <div className="space-y-2">
          <Label htmlFor="invoice_number">Número da Nota Fiscal</Label>
          <Input
            id="invoice_number"
            {...register('invoice_number')}
            placeholder="Número da NF (opcional)"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Digite a descrição"
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Termos de Pagamento */}
        <div className="space-y-2">
          <Label htmlFor="payment_terms">Termos de Pagamento</Label>
          <Textarea
            id="payment_terms"
            {...register('payment_terms')}
            placeholder="Digite os termos de pagamento (opcional)"
            rows={2}
          />
        </div>

        {/* Botão de Submit */}
        <Button 
          type="submit" 
          disabled={isLoading || loadingCustomers || loadingCategories}
          className="w-full"
        >
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar Recebível'}
        </Button>
      </form>
    </DialogContent>
  );
} 