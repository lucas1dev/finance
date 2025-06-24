import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
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
import accountService, { Account } from '@/lib/accountService';

/**
 * Props do componente FixedAccountFormSimple
 */
interface FixedAccountFormSimpleProps {
  initialData?: {
    id: number;
    description: string;
    amount: number;
    periodicity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    start_date: string;
    category_id: number;
    supplier_id?: number;
    account_id?: number;
    payment_method?: 'card' | 'boleto' | 'automatic_debit';
    observations?: string;
    reminder_days: number;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

/**
 * Componente de formulário simplificado para criação/edição de conta fixa
 */
export function FixedAccountFormSimple({
  initialData,
  onSubmit,
  onCancel,
}: FixedAccountFormSimpleProps) {
  console.log('🔍 FixedAccountFormSimple - Renderizando componente', { initialData });
  
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Estados do formulário
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || 0);
  const [periodicity, setPeriodicity] = useState(initialData?.periodicity || 'monthly');
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.start_date ? new Date(initialData.start_date) : new Date()
  );
  const [categoryId, setCategoryId] = useState(initialData?.category_id || 0);
  const [supplierId, setSupplierId] = useState(initialData?.supplier_id || 0);
  const [accountId, setAccountId] = useState(initialData?.account_id || 0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'boleto' | 'automatic_debit' | 'none'>(initialData?.payment_method || 'none');
  const [observations, setObservations] = useState(initialData?.observations || '');
  const [reminderDays, setReminderDays] = useState(initialData?.reminder_days || 3);

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log('🔍 FixedAccountFormSimple - Carregando categorias...');
        
        const categoriesData = await categoryService.getCategoriesByType('expense');
        
        console.log('✅ FixedAccountFormSimple - Categorias carregadas:', categoriesData.length);
        setCategories(categoriesData);
        
        // Selecionar primeira categoria por padrão se não houver selecionada
        if (categoriesData.length > 0 && !categoryId) {
          console.log('🎯 FixedAccountFormSimple - Selecionando categoria padrão:', categoriesData[0].id);
          setCategoryId(categoriesData[0].id);
        }
      } catch (error) {
        console.error('❌ FixedAccountFormSimple - Erro ao carregar categorias:', error);
        toast.error('Erro ao carregar categorias');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [categoryId]);

  // Carregar fornecedores
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        console.log('🔍 FixedAccountFormSimple - Carregando fornecedores...');
        
        const response = await supplierService.getSuppliers();
        const suppliersData = Array.isArray(response) ? response : response.data || [];
        
        console.log('✅ FixedAccountFormSimple - Fornecedores carregados:', suppliersData.length);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('❌ FixedAccountFormSimple - Erro ao carregar fornecedores:', error);
        toast.error('Erro ao carregar fornecedores');
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Carregar contas bancárias
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true);
        console.log('🔍 FixedAccountFormSimple - Carregando contas bancárias...');
        
        const accountsData = await accountService.getAccounts();
        
        console.log('✅ FixedAccountFormSimple - Contas bancárias carregadas:', accountsData.length);
        setAccounts(accountsData);
      } catch (error) {
        console.error('❌ FixedAccountFormSimple - Erro ao carregar contas bancárias:', error);
        toast.error('Erro ao carregar contas bancárias');
        setAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }
    
    if (amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    
    if (!startDate) {
      toast.error('Data de início é obrigatória');
      return;
    }
    
    if (!categoryId) {
      toast.error('Categoria é obrigatória');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 FixedAccountFormSimple - Submetendo dados:', {
        description,
        amount,
        periodicity,
        start_date: format(startDate, 'yyyy-MM-dd'),
        category_id: categoryId,
        supplier_id: supplierId && supplierId > 0 ? supplierId : undefined,
        account_id: accountId && accountId > 0 ? accountId : undefined,
        payment_method: paymentMethod === 'none' ? undefined : paymentMethod,
        observations,
        reminder_days: reminderDays,
      });
      
      // Formatar dados para envio
      const formData = {
        description: description.trim(),
        amount: Number(amount),
        periodicity,
        start_date: format(startDate, 'yyyy-MM-dd'),
        category_id: Number(categoryId),
        supplier_id: supplierId && supplierId > 0 ? supplierId : undefined,
        account_id: accountId && accountId > 0 ? accountId : undefined,
        payment_method: paymentMethod === 'none' ? undefined : paymentMethod,
        observations: observations.trim(),
        reminder_days: Number(reminderDays),
      };

      console.log('🔍 FixedAccountFormSimple - Dados formatados:', formData);
      
      await onSubmit(formData);
      
      toast.success(initialData ? 'Conta fixa atualizada com sucesso' : 'Conta fixa criada com sucesso');
      
      if (!initialData) {
        // Resetar formulário apenas se for criação
        setDescription('');
        setAmount(0);
        setPeriodicity('monthly');
        setStartDate(new Date());
        setCategoryId(categories.length > 0 ? categories[0].id : 0);
        setSupplierId(0);
        setAccountId(0);
        setPaymentMethod('none');
        setObservations('');
        setReminderDays(3);
      }
    } catch (error: any) {
      console.error('❌ FixedAccountFormSimple - Erro ao salvar conta fixa:', error);
      toast.error(error.message || 'Erro ao salvar conta fixa');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Descrição */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Descrição *</label>
        <Input
          placeholder="Ex: Aluguel, Internet, Academia..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Valor */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Valor *</label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          required
        />
      </div>

      {/* Periodicidade */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Periodicidade *</label>
        <Select value={periodicity} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => setPeriodicity(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a periodicidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="quarterly">Trimestral</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
            <SelectItem value="daily">Diário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data de Início */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Data de Início *</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full pl-3 text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              {startDate ? (
                format(startDate, 'PPP', { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              disabled={(date) =>
                date < new Date('1900-01-01')
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Categoria *</label>
        <Select 
          value={categoryId.toString()} 
          onValueChange={(value) => setCategoryId(parseInt(value))}
          disabled={loadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCategories ? "Carregando..." : "Selecione a categoria"} />
          </SelectTrigger>
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
      </div>

      {/* Fornecedor */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Fornecedor (Opcional)</label>
        <Select 
          value={supplierId.toString()} 
          onValueChange={(value) => setSupplierId(parseInt(value))}
          disabled={loadingSuppliers}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingSuppliers ? "Carregando..." : "Selecione o fornecedor"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Nenhum fornecedor</SelectItem>
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
      </div>

      {/* Conta Bancária */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Conta Bancária (Opcional)</label>
        <Select 
          value={accountId.toString()} 
          onValueChange={(value) => setAccountId(parseInt(value))}
          disabled={loadingAccounts}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingAccounts ? "Carregando..." : "Selecione a conta bancária"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Nenhuma conta</SelectItem>
            {loadingAccounts ? (
              <SelectItem value="loading" disabled>
                Carregando contas...
              </SelectItem>
            ) : accounts.length === 0 ? (
              <SelectItem value="no-accounts" disabled>
                Nenhuma conta bancária encontrada
              </SelectItem>
            ) : (
              accounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  <div className="flex items-center justify-between">
                    <span>{account.bank_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {account.account_type === 'checking' ? 'Corrente' : 
                       account.account_type === 'savings' ? 'Poupança' : 'Investimento'}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Método de Pagamento */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Método de Pagamento (Opcional)</label>
        <Select value={paymentMethod} onValueChange={(value: 'card' | 'boleto' | 'automatic_debit' | 'none') => setPaymentMethod(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o método de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Não especificado</SelectItem>
            <SelectItem value="card">Cartão</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
            <SelectItem value="automatic_debit">Débito Automático</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dias de Lembrete */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Dias de Antecedência para Lembretes</label>
        <Input
          type="number"
          min="0"
          max="30"
          placeholder="3"
          value={reminderDays}
          onChange={(e) => setReminderDays(parseInt(e.target.value) || 3)}
        />
        <p className="text-sm text-muted-foreground">
          Quantos dias antes do vencimento você quer ser lembrado
        </p>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Observações (Opcional)</label>
        <Textarea
          placeholder="Observações adicionais sobre esta conta fixa"
          className="resize-none"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading || loadingCategories || loadingSuppliers || loadingAccounts}>
          {isLoading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
} 