import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          onValueChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
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
            {accounts.map((account) => (
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
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories
              .filter((category) => category.type === formData.type)
              .map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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