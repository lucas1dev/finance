import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import TransactionForm from '@/components/TransactionForm';
import { toast } from 'sonner';
import api from '@/lib/axios';

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

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    categoryId: '',
    accountId: ''
  });

  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      toast.error('Erro ao carregar transações');
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data.accounts);
    } catch (error) {
      toast.error('Erro ao carregar contas');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transação excluída com sucesso');
      fetchTransactions();
      fetchAccounts();
    } catch (error) {
      toast.error('Erro ao excluir transação');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSuccess = () => {
    setShowForm(false);
    fetchTransactions();
    fetchAccounts();
    // Disparar evento de atualização de transações
    window.dispatchEvent(new Event('transactionUpdated'));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transações</h1>
        <Button onClick={() => {
          setSelectedTransaction(null);
          setShowForm(true);
        }}>
          Nova Transação
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h2>
            <TransactionForm
              accounts={accounts}
              categories={categories}
              transaction={selectedTransaction}
              onSuccess={handleSuccess}
            />
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{transaction.description}</h3>
                <p className="text-sm text-gray-500">
                  {transaction.bank_name} - {transaction.account_type}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-sm text-gray-500">{transaction.category_name}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTransaction(transaction);
                  setShowForm(true);
                }}
              >
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(transaction.id)}
              >
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 