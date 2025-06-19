import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

interface Account {
  id: number;
  bank_name: string;
  account_type: string;
  balance: number;
  description: string;
}

export function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_type: '',
    balance: '',
    description: ''
  });

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data.accounts);
      setTotalBalance(response.data.totalBalance);
    } catch (error: any) {
      console.error('Erro ao buscar contas:', error.response?.data || error);
      toast.error(error.response?.data?.error || 'Erro ao buscar contas');
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }

    // Adicionar listener para o evento de atualização de transações
    const handleTransactionUpdate = () => {
      fetchAccounts();
    };

    window.addEventListener('transactionUpdated', handleTransactionUpdate);

    return () => {
      window.removeEventListener('transactionUpdated', handleTransactionUpdate);
    };
  }, [user]);

  const handleOpenModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        bank_name: account.bank_name,
        account_type: account.account_type,
        balance: account.balance.toString(),
        description: account.description
      });
    } else {
      setEditingAccount(null);
      setFormData({
        bank_name: '',
        account_type: '',
        balance: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData({
      bank_name: '',
      account_type: '',
      balance: '',
      description: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, formData);
        toast.success('Conta atualizada com sucesso');
      } else {
        await api.post('/accounts', formData);
        toast.success('Conta criada com sucesso');
      }
      handleCloseModal();
      fetchAccounts();
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error.response?.data || error);
      toast.error(error.response?.data?.error || 'Erro ao salvar conta');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      await api.delete(`/accounts/${id}`);
      toast.success('Conta excluída com sucesso');
      fetchAccounts();
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error.response?.data || error);
      toast.error(error.response?.data?.error || 'Erro ao excluir conta');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Minhas Contas</h1>
        <Button onClick={() => handleOpenModal()}>Nova Conta</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Saldo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            R$ {Number(totalBalance).toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle>{account.bank_name}</CardTitle>
              <p className="text-sm text-gray-500">{account.account_type}</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                R$ {Number(account.balance).toFixed(2)}
              </p>
              {account.description && (
                <p className="text-sm text-gray-600 mt-2">{account.description}</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => handleOpenModal(account)}
              >
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(account.id)}
              >
                Excluir
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingAccount ? 'Editar Conta' : 'Nova Conta'}
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nome do Banco
                  </label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo de Conta
                  </label>
                  <Input
                    value={formData.account_type}
                    onChange={(e) =>
                      setFormData({ ...formData, account_type: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Saldo Inicial
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({ ...formData, balance: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descrição
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAccount ? 'Salvar' : 'Criar'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
} 