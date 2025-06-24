/**
 * Página de recuperação de senha.
 * Permite ao usuário solicitar o envio de instruções de recuperação para o email.
 * Valida o email com Zod e exibe feedback visual.
 * @module ForgotPassword
 * @returns {JSX.Element} Página de recuperação de senha
 * @example
 * <ForgotPassword />
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Manipula a mudança do campo de email, validando e limpando erros.
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de mudança
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Limpar erro se o email for válido
    if (error && newEmail) {
      const result = forgotPasswordSchema.safeParse({ email: newEmail });
      if (result.success) {
        setError('');
      }
    }
  };

  /**
   * Manipula o envio do formulário de recuperação de senha.
   * @param {React.FormEvent} e - Evento do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Instruções de recuperação enviadas para seu email');
      setEmail(''); // Limpar o formulário após sucesso
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
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                aria-invalid={!!error}
                aria-describedby={error ? 'email-error' : undefined}
                autoFocus
              />
              {error && (
                <span id="email-error" className="text-sm text-red-600 block" role="alert">
                  {error}
                </span>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-busy={isLoading}
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