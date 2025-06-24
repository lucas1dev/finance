import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Account {
  id: number;
  bankName: string;
  accountType: string;
  balance: number;
}

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

interface Transaction {
  id: number;
  account_id: number;
  category_id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  bank_name: string;
  account_type: string;
  category_name: string;
}

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  transaction?: Transaction | null;
  onSuccess: () => void;
}

export default function TransactionForm({ accounts, categories, transaction, onSuccess }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    account_id: transaction?.account_id || '',
    category_id: transaction?.category_id || '',
    type: transaction?.type || 'expense',
    amount: transaction?.amount || '',
    description: transaction?.description || '',
    date: transaction?.date || new Date().toISOString().split('T')[0]
  });

  // Filtrar categorias baseado no tipo selecionado
  const filteredCategories = categories.filter((category) => category.type === formData.type);

  // Verificar se a categoria selecionada é compatível com o tipo atual
  const isCategoryCompatible = formData.category_id && 
    categories.find(cat => cat.id === formData.category_id)?.type === formData.type;

  // Limpar categoria se não há categorias disponíveis ou se não é compatível
  useEffect(() => {
    if (filteredCategories.length === 0 || !isCategoryCompatible) {
      setFormData(prev => ({
        ...prev,
        category_id: ''
      }));
    }
  }, [formData.type, filteredCategories.length, isCategoryCompatible]);

  const handleTypeChange = (value: 'income' | 'expense') => {
    setFormData(prev => {
      // Se mudou o tipo e a categoria atual não é compatível, limpar a categoria
      const newCategoryId = isCategoryCompatible ? prev.category_id : '';
      
      return {
        ...prev,
        type: value,
        category_id: newCategoryId
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação adicional
    if (!isCategoryCompatible) {
      toast.error('Selecione uma categoria compatível com o tipo de transação');
      return;
    }
    
    try {
      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, formData);
        toast.success('Transação atualizada com sucesso');
      } else {
        await api.post('/transactions', formData);
        toast.success('Transação criada com sucesso');
      }
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar transação');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleTypeChange(value as 'income' | 'expense')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Receita</SelectItem>
            <SelectItem value="expense">Despesa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="account_id">Conta</Label>
        <Select
          value={formData.account_id.toString()}
          onValueChange={(value) => setFormData({ ...formData, account_id: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma conta" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(accounts) && accounts.map((account) => (
              <SelectItem key={account.id} value={account.id.toString()}>
                {account.bankName} - {account.accountType} (Saldo: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(account.balance)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="category_id">Categoria</Label>
        <Select
          value={formData.category_id.toString()}
          onValueChange={(value) => setFormData({ ...formData, category_id: parseInt(value) })}
          disabled={filteredCategories.length === 0}
        >
          <SelectTrigger className={!isCategoryCompatible && formData.category_id ? 'border-red-500' : ''}>
            <SelectValue placeholder={
              filteredCategories.length === 0 
                ? `Nenhuma categoria de ${formData.type === 'income' ? 'receita' : 'despesa'} disponível`
                : "Selecione uma categoria"
            } />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isCategoryCompatible && formData.category_id && (
          <p className="text-sm text-red-500 mt-1">
            A categoria selecionada não é compatível com o tipo de transação
          </p>
        )}
        {filteredCategories.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            Crie categorias de {formData.type === 'income' ? 'receita' : 'despesa'} na página de Categorias
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="amount">Valor</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="date">Data</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        {transaction ? 'Atualizar' : 'Criar'} Transação
      </Button>
    </form>
  );
} 