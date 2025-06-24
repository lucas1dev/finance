import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

/**
 * Página de Registro
 * @author Lucas
 *
 * @description
 * Página de criação de conta com validação Zod e melhor UX
 *
 * @example
 * // Rota: /register
 * // Acesso: Público
 */
export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      await register(data.name, data.email, data.password);
      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      navigate('/login');
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar força da senha
  const password = form.watch('password');
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, color: 'gray', text: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const colors = ['red', 'orange', 'yellow', 'lightgreen', 'green'];
    const texts = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
    
    return {
      strength: Math.min(strength, 5),
      color: colors[strength - 1] || 'gray',
      text: texts[strength - 1] || ''
    };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-xl font-bold">F</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Criar conta</h2>
          <p className="text-gray-600">
            Preencha os dados abaixo para criar sua conta
          </p>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Seu nome completo"
                        disabled={isLoading}
                        className="transition-all focus:ring-2 focus:ring-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        disabled={isLoading}
                        className="transition-all focus:ring-2 focus:ring-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Sua senha"
                          disabled={isLoading}
                          className="pr-10 transition-all focus:ring-2 focus:ring-green-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                passwordStrength.color === 'red' ? 'bg-red-500' :
                                passwordStrength.color === 'orange' ? 'bg-orange-500' :
                                passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                                passwordStrength.color === 'lightgreen' ? 'bg-lime-500' :
                                passwordStrength.color === 'green' ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            passwordStrength.color === 'red' ? 'text-red-600' :
                            passwordStrength.color === 'orange' ? 'text-orange-600' :
                            passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                            passwordStrength.color === 'lightgreen' ? 'text-lime-600' :
                            passwordStrength.color === 'green' ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          A senha deve conter pelo menos 6 caracteres, incluindo letra maiúscula, minúscula e número.
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirme sua senha"
                          disabled={isLoading}
                          className="pr-10 transition-all focus:ring-2 focus:ring-green-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Eu aceito os{' '}
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-green-600 hover:text-green-700"
                          onClick={() => window.open('/terms', '_blank')}
                        >
                          termos de uso
                        </Button>
                        {' '}e{' '}
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-green-600 hover:text-green-700"
                          onClick={() => window.open('/privacy', '_blank')}
                        >
                          política de privacidade
                        </Button>
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Criar conta
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Button
              variant="link"
              onClick={() => navigate('/login')}
              className="p-0 h-auto text-green-600 hover:text-green-700"
              disabled={isLoading}
            >
              Faça login
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 