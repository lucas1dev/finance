import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/axios';

export function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/profile');
        setUser(response.data);
      } catch (error) {
        toast.error('Erro ao carregar perfil');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="space-x-2">
          <Button onClick={() => navigate('/accounts')}>Minhas Contas</Button>
          <Button onClick={() => navigate('/transactions')}>Transações</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Minhas Contas</h2>
          <p className="text-gray-600 mb-4">Gerencie suas contas bancárias</p>
          <Button onClick={() => navigate('/accounts')}>Gerenciar Contas</Button>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Transações</h2>
          <p className="text-gray-600 mb-4">Registre e acompanhe suas transações</p>
          <Button onClick={() => navigate('/transactions')}>Ver Transações</Button>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Relatórios</h2>
          <p className="text-gray-600 mb-4">Visualize relatórios e gráficos</p>
          <Button variant="outline" disabled>Em breve</Button>
        </Card>
      </div>
    </div>
  );
} 