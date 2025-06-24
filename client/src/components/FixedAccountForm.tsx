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

import categoryService, { Category } from '@/lib/categoryService';
import supplierService, { Supplier } from '@/lib/supplierService';
import { CreateFixedAccountData, UpdateFixedAccountData } from '@/lib/fixedAccountService';

/**
 * Schema de validação para conta fixa
 */
const fixedAccountSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  periodicity: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Periodicidade é obrigatória' })
  }),
  start_date: z.date({
    required_error: 'Data de início é obrigatória',
  }),
  category_id: z.number().min(1, 'Categoria é obrigatória'),
  supplier_id: z.number().optional(),
  payment_method: z.enum(['card', 'boleto', 'automatic_debit']).optional(),
  observations: z.string().optional(),
  reminder_days: z.number().min(0).max(30, 'Máximo 30 dias').describe('Dias de antecedência para lembrete'),
});

type FixedAccountFormData = z.infer<typeof fixedAccountSchema>;

/**
 * Props do componente FixedAccountForm
 */
interface FixedAccountFormProps {
  initialData?: {
    id: number;
    description: string;
    amount: number;
    periodicity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    start_date: string;
    category_id: number;
    supplier_id?: number;
    payment_method?: 'card' | 'boleto' | 'automatic_debit';
    observations?: string;
    reminder_days: number;
  };
  onSubmit: (data: CreateFixedAccountData | UpdateFixedAccountData) => Promise<void>;
  onCancel?: () => void;
}

/**
 * Componente de formulário para criação/edição de conta fixa
 */
export function FixedAccountForm({
  initialData,
  onSubmit,
  onCancel,
}: FixedAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const form = useForm<FixedAccountFormData>({
    resolver: zodResolver(fixedAccountSchema),
    defaultValues: {
      description: initialData?.description || '',
      amount: initialData?.amount || 0,
      periodicity: initialData?.periodicity || 'monthly',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
      category_id: initialData?.category_id || 1,
      supplier_id: initialData?.supplier_id ? initialData.supplier_id : undefined,
      payment_method: initialData?.payment_method ? initialData.payment_method : undefined,
      observations: initialData?.observations || '',
      reminder_days: initialData?.reminder_days !== undefined ? initialData.reminder_days : 3,
    },
  });

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log('🔍 FixedAccountForm - Carregando categorias...');
        
        const categoriesData = await categoryService.getCategoriesByType('expense');
        
        console.log('✅ FixedAccountForm - Categorias carregadas:', categoriesData.length);
        setCategories(categoriesData);
        
        // Selecionar primeira categoria por padrão se não houver selecionada
        if (categoriesData.length > 0 && !form.getValues('category_id')) {
          console.log('🎯 FixedAccountForm - Selecionando categoria padrão:', categoriesData[0].id);
          form.setValue('category_id', categoriesData[0].id);
        }
      } catch (error) {
        console.error('❌ FixedAccountForm - Erro ao carregar categorias:', error);
        toast.error('Erro ao carregar categorias');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [form]);

  // Garante que category_id nunca seja undefined após carregar categorias
  useEffect(() => {
    if (!form.getValues('category_id') && categories.length > 0) {
      form.setValue('category_id', categories[0].id);
    }
  }, [categories, form]);

  // Carregar fornecedores
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        console.log('🔍 FixedAccountForm - Carregando fornecedores...');
        
        const response = await supplierService.getSuppliers();
        const suppliersData = Array.isArray(response) ? response : response.data || [];
        
        console.log('✅ FixedAccountForm - Fornecedores carregados:', suppliersData.length);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('❌ FixedAccountForm - Erro ao carregar fornecedores:', error);
        toast.error('Erro ao carregar fornecedores');
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSubmit = async (data: FixedAccountFormData) => {
    try {
      setIsLoading(true);
      console.log('🔍 FixedAccountForm - Submetendo dados:', JSON.stringify(data, null, 2));
      
      // Formatar dados para envio
      const formData = {
        ...data,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        amount: Number(data.amount),
        category_id: Number(data.category_id),
        supplier_id: data.supplier_id ? Number(data.supplier_id) : undefined,
        reminder_days: Number(data.reminder_days),
      };

      console.log('🔍 FixedAccountForm - Dados formatados:', JSON.stringify(formData, null, 2));
      
      await onSubmit(formData);
      
      toast.success(initialData ? 'Conta fixa atualizada com sucesso' : 'Conta fixa criada com sucesso');
      
      if (!initialData) {
        form.reset({
          description: '',
          amount: 0,
          periodicity: 'monthly',
          start_date: new Date(),
          category_id: categories.length > 0 ? categories[0].id : 0,
          supplier_id: undefined,
          payment_method: undefined,
          observations: '',
          reminder_days: 3,
        });
      }
    } catch (error: any) {
      console.error('❌ FixedAccountForm - Erro ao salvar conta fixa:', error);
      toast.error(error.message || 'Erro ao salvar conta fixa');
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

  const getPeriodicityLabel = (periodicity: string) => {
    const labels: Record<string, string> = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual'
    };
    return labels[periodicity] || periodicity;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      card: 'Cartão',
      boleto: 'Boleto',
      automatic_debit: 'Débito Automático'
    };
    return labels[method] || method;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Aluguel, Internet, Academia..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Valor */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Periodicidade */}
        <FormField
          control={form.control}
          name="periodicity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Periodicidade *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a periodicidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Data de Início */}
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Início *</FormLabel>
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
                      date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria *</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                value={field.value?.toString()}
                disabled={loadingCategories}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCategories ? "Carregando..." : "Selecione a categoria"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingCategories ? (
                    <SelectItem value="loading" disabled>
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fornecedor */}
        <FormField
          control={form.control}
          name="supplier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor (Opcional)</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                value={field.value !== undefined ? field.value.toString() : "none"}
                disabled={loadingSuppliers}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingSuppliers ? "Carregando..." : "Selecione o fornecedor"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum fornecedor</SelectItem>
                  {loadingSuppliers ? (
                    <SelectItem value="loading" disabled>
                      Carregando fornecedores...
                    </SelectItem>
                  ) : suppliers.length === 0 ? (
                    <SelectItem value="no-suppliers" disabled>
                      Nenhum fornecedor encontrado
                    </SelectItem>
                  ) : (
                    suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
              <FormLabel>Método de Pagamento (Opcional)</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} value={field.value ?? "none"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Não especificado</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="automatic_debit">Débito Automático</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dias de Lembrete */}
        <FormField
          control={form.control}
          name="reminder_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dias de Antecedência para Lembretes</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  placeholder="3"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                Quantos dias antes do vencimento você quer ser lembrado
              </p>
            </FormItem>
          )}
        />

        {/* Observações */}
        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações adicionais sobre esta conta fixa"
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
          <Button type="submit" disabled={isLoading || loadingCategories || loadingSuppliers}>
            {isLoading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </form>
    </Form>
  );
} 