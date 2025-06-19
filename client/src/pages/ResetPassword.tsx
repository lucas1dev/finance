import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/axios';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        token,
        password
      });
      toast.success('Senha redefinida com sucesso');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <h2 className="text-2xl font-bold text-center">Token inválido</h2>
            <p className="text-center text-muted-foreground">
              O link de redefinição de senha é inválido ou expirou
            </p>
          </CardHeader>
          <CardFooter>
            <div className="text-center text-sm w-full">
              <Button
                variant="link"
                onClick={() => navigate('/forgot-password')}
                className="w-full"
              >
                Solicitar novo link
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <h2 className="text-2xl font-bold text-center">Redefinir senha</h2>
          <p className="text-center text-muted-foreground">
            Digite sua nova senha
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm w-full">
            <Button
              variant="link"
              onClick={() => navigate('/login')}
              className="w-full"
              disabled={isLoading}
            >
              Voltar para o login
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 