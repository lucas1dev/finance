import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/axios';

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', {
        name: formData.name,
        email: formData.email,
      });
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    try {
      await api.put('/auth/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Senha atualizada com sucesso');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Erro ao atualizar senha');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e informações da conta
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Perfil</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <Button type="submit">Salvar Alterações</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Senha</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
            <Button type="submit">Atualizar Senha</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Aparência</h2>
          <div className="space-y-4">
            <div>
              <Label>Tema</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                >
                  Claro
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                >
                  Escuro
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 