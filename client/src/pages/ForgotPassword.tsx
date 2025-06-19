import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/axios';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', {
        email
      });
      toast.success('Instruções de recuperação enviadas para seu email');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao processar recuperação de senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <h2 className="text-2xl font-bold text-center">Recuperar senha</h2>
          <p className="text-center text-muted-foreground">
            Digite seu email para receber as instruções de recuperação
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar instruções'}
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