import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Creditor {
  id: number;
  name: string;
  document_type: 'CPF' | 'CNPJ';
  document_number: string;
}

interface Account {
  id: number;
  bank_name: string;
  account_type: string;
  balance: number;
}

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

interface Financing {
  id?: number;
  name: string;
  creditor_id: number;
  account_id: number;
  category_id?: number;
  amount: number;
  interest_rate: number;
  term_months: number;
  payment_amount: number;
  amortization_type: 'SAC' | 'Price';
  start_date: string;
  end_date: string;
  current_balance: number;
  total_paid: number;
  total_interest: number;
  status: 'active' | 'paid' | 'defaulted';
  description?: string;
}

interface FinancingFormProps {
  financing?: Financing;
  onSuccess: () => void;
}

export function FinancingForm({ financing, onSuccess }: FinancingFormProps) {
  const [formData, setFormData] = useState<Financing>({
    name: '',
    creditor_id: 0,
    account_id: 0,
    category_id: undefined,
    amount: 0,
    interest_rate: 0,
    term_months: 0,
    payment_amount: 0,
    amortization_type: 'SAC',
    start_date: '',
    end_date: '',
    current_balance: 0,
    total_paid: 0,
    total_interest: 0,
    status: 'active',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCreditors();
    fetchAccounts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (financing) {
      setFormData({
        id: financing.id,
        name: financing.name,
        creditor_id: financing.creditor_id,
        account_id: financing.account_id,
        category_id: financing.category_id,
        amount: financing.amount,
        interest_rate: financing.interest_rate,
        term_months: financing.term_months,
        payment_amount: financing.payment_amount,
        amortization_type: financing.amortization_type,
        start_date: financing.start_date,
        end_date: financing.end_date,
        current_balance: financing.current_balance,
        total_paid: financing.total_paid,
        total_interest: financing.total_interest,
        status: financing.status,
        description: financing.description || '',
      });
    }
  }, [financing]);

  const fetchCreditors = async () => {
    try {
      const response = await api.get('/creditors');
      setCreditors(response.data.creditors || response.data);
    } catch (error) {
      console.error('Erro ao buscar credores:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data.accounts || response.data);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || response.data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.creditor_id) {
      newErrors.creditor_id = 'Credor é obrigatório';
    }

    if (!formData.account_id) {
      newErrors.account_id = 'Conta é obrigatória';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.interest_rate || formData.interest_rate <= 0) {
      newErrors.interest_rate = 'Taxa de juros deve ser maior que zero';
    }

    if (!formData.term_months || formData.term_months <= 0) {
      newErrors.term_months = 'Prazo deve ser maior que zero';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Data de início é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        creditor_id: formData.creditor_id,
        account_id: formData.account_id,
        category_id: formData.category_id || undefined,
        amount: formData.amount,
        interest_rate: formData.interest_rate,
        term_months: formData.term_months,
        amortization_type: formData.amortization_type,
        start_date: formData.start_date,
        description: formData.description?.trim() || undefined,
      };

      if (financing?.id) {
        await api.put(`/financings/${financing.id}`, payload);
        toast.success('Financiamento atualizado com sucesso');
      } else {
        await api.post('/financings', payload);
        toast.success('Financiamento criado com sucesso');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar financiamento:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao salvar financiamento';
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Financing, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {financing ? 'Editar Financiamento' : 'Novo Financiamento'}
        </DialogTitle>
        <DialogDescription>
          {financing 
            ? 'Atualize as informações do financiamento'
            : 'Preencha as informações do novo financiamento'
          }
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Financiamento *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ex: Financiamento Imobiliário"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="creditor_id">Credor *</Label>
            <Select
              value={formData.creditor_id.toString()}
              onValueChange={(value) => handleInputChange('creditor_id', parseInt(value))}
            >
              <SelectTrigger className={errors.creditor_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione o credor" />
              </SelectTrigger>
              <SelectContent>
                {creditors.map((creditor) => (
                  <SelectItem key={creditor.id} value={creditor.id.toString()}>
                    {creditor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.creditor_id && <p className="text-red-500 text-sm mt-1">{errors.creditor_id}</p>}
          </div>

          <div>
            <Label htmlFor="account_id">Conta *</Label>
            <Select
              value={formData.account_id.toString()}
              onValueChange={(value) => handleInputChange('account_id', parseInt(value))}
            >
              <SelectTrigger className={errors.account_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(accounts) && accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.bank_name} - {account.account_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_id && <p className="text-red-500 text-sm mt-1">{errors.account_id}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="amount">Valor Total *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          <div>
            <Label htmlFor="interest_rate">Taxa de Juros (% a.m.) *</Label>
            <Input
              id="interest_rate"
              type="number"
              step="0.01"
              value={formData.interest_rate}
              onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              className={errors.interest_rate ? 'border-red-500' : ''}
            />
            {errors.interest_rate && <p className="text-red-500 text-sm mt-1">{errors.interest_rate}</p>}
          </div>

          <div>
            <Label htmlFor="term_months">Prazo (meses) *</Label>
            <Input
              id="term_months"
              type="number"
              value={formData.term_months}
              onChange={(e) => handleInputChange('term_months', parseInt(e.target.value) || 0)}
              placeholder="0"
              className={errors.term_months ? 'border-red-500' : ''}
            />
            {errors.term_months && <p className="text-red-500 text-sm mt-1">{errors.term_months}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amortization_type">Tipo de Amortização *</Label>
            <Select
              value={formData.amortization_type}
              onValueChange={(value: 'SAC' | 'Price') => handleInputChange('amortization_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAC">SAC (Sistema de Amortização Constante)</SelectItem>
                <SelectItem value="Price">Price (Sistema Francês)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start_date">Data de Início *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className={errors.start_date ? 'border-red-500' : ''}
            />
            {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="category_id">Categoria (Opcional)</Label>
          <Select
            value={formData.category_id?.toString() || ''}
            onValueChange={(value) => handleInputChange('category_id', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter(category => category.type === 'expense')
                .map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descrição adicional do financiamento"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? 'Salvando...' : (financing ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
} 