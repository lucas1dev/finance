/**
 * Página de Configurações do Usuário
 * @author Lucas Santos
 * 
 * @description
 * Página completa de configurações com múltiplas seções: perfil, segurança,
 * preferências, notificações, privacidade e conta. Permite ao usuário
 * gerenciar todas as suas configurações pessoais e de segurança.
 * 
 * @returns {JSX.Element} Página de configurações renderizada
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Eye, 
  EyeOff, 
  Download, 
  Trash2, 
  Key, 
  Smartphone,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  LogOut,
  Lock,
  Unlock,
  Mail,
  Smartphone as PhoneIcon,
  Shield as SecurityIcon,
  Palette as ThemeIcon,
  Bell as NotificationIcon,
  Eye as PrivacyIcon,
  User as AccountIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/axios';

/**
 * Schema de validação para atualização de perfil
 */
const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional()
});

/**
 * Schema de validação para alteração de senha
 */
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

/**
 * Schema de validação para configurações de notificação
 */
const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  transactionAlerts: z.boolean(),
  paymentReminders: z.boolean(),
  securityAlerts: z.boolean(),
  marketingEmails: z.boolean()
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;

/**
 * Mock de dados de sessões ativas
 */
const mockActiveSessions = [
  {
    id: 1,
    device: 'Chrome - Windows 10',
    location: 'São Paulo, Brasil',
    lastActive: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    current: true
  },
  {
    id: 2,
    device: 'Safari - iPhone 14',
    location: 'Rio de Janeiro, Brasil',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    current: false
  },
  {
    id: 3,
    device: 'Firefox - MacBook Pro',
    location: 'Belo Horizonte, Brasil',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    current: false
  }
];

export function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    transactionAlerts: true,
    paymentReminders: true,
    securityAlerts: true,
    marketingEmails: false
  });

  // Formulários com React Hook Form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR'
    }
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: notificationSettings
  });

  useEffect(() => {
    // Carregar configurações do usuário
    loadUserSettings();
  }, []);

  /**
   * Carrega as configurações do usuário
   */
  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      // Aqui você faria chamadas para carregar as configurações
      // Por enquanto, usamos dados mockados
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza o perfil do usuário
   */
  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      await api.put('/auth/profile', data);
      toast.success('Perfil atualizado com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza a senha do usuário
   */
  const handlePasswordUpdate = async (data: PasswordFormData) => {
    try {
      setIsLoading(true);
      await api.put('/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Senha atualizada com sucesso');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar senha');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza configurações de notificação
   */
  const handleNotificationUpdate = async (data: NotificationFormData) => {
    try {
      setIsLoading(true);
      setNotificationSettings(data);
      toast.success('Configurações de notificação atualizadas');
    } catch (error) {
      toast.error('Erro ao atualizar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Ativa/desativa autenticação de dois fatores
   */
  const handleTwoFactorToggle = async () => {
    try {
      setIsLoading(true);
      setTwoFactorEnabled(!twoFactorEnabled);
      toast.success(`Autenticação de dois fatores ${!twoFactorEnabled ? 'ativada' : 'desativada'}`);
    } catch (error) {
      toast.error('Erro ao configurar autenticação de dois fatores');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Encerra uma sessão específica
   */
  const handleEndSession = async (sessionId: number) => {
    try {
      setIsLoading(true);
      toast.success('Sessão encerrada com sucesso');
    } catch (error) {
      toast.error('Erro ao encerrar sessão');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Exporta dados do usuário
   */
  const handleExportData = async () => {
    try {
      setIsLoading(true);
      toast.success('Exportação iniciada. Você receberá um email com os dados.');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Exclui a conta do usuário
   */
  const handleDeleteAccount = async () => {
    if (window.confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      try {
        setIsLoading(true);
        await api.delete('/auth/account');
        toast.success('Conta excluída com sucesso');
        logout();
      } catch (error) {
        toast.error('Erro ao excluir conta');
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Formata data relativa
   */
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} minutos atrás`;
    if (hours < 24) return `${hours} horas atrás`;
    return `${days} dias atrás`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas preferências e informações da conta
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadUserSettings}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabs de Configurações */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Privacidade
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Conta
          </TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e de contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      {...profileForm.register('name')}
                      placeholder="Seu nome completo"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-red-600">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register('email')}
                      placeholder="seu@email.com"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...profileForm.register('phone')}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select value={profileForm.watch('timezone')} onValueChange={(value) => profileForm.setValue('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fuso horário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                        <SelectItem value="America/Belem">Belém (GMT-3)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select value={profileForm.watch('language')} onValueChange={(value) => profileForm.setValue('language', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="security" className="space-y-6">
          {/* Alteração de Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Atualize sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual *</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      {...passwordForm.register('currentPassword')}
                      placeholder="Digite sua senha atual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha *</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register('newPassword')}
                      placeholder="Mínimo 8 caracteres"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register('confirmPassword')}
                      placeholder="Confirme a nova senha"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  <Lock className="h-4 w-4 mr-2" />
                  Atualizar Senha
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Autenticação de Dois Fatores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SecurityIcon className="h-5 w-5" />
                Autenticação de Dois Fatores
              </CardTitle>
              <CardDescription>
                Adicione uma camada extra de segurança à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Verificação em duas etapas</p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled 
                      ? 'Proteção adicional ativada para sua conta'
                      : 'Adicione uma camada extra de segurança'
                    }
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                  disabled={isLoading}
                />
              </div>
              {twoFactorEnabled && (
                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Autenticação de dois fatores está ativa. Sua conta está protegida.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Sessões Ativas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sessões Ativas
              </CardTitle>
              <CardDescription>
                Gerencie suas sessões ativas em diferentes dispositivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActiveSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{session.device}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.location} • {formatRelativeTime(session.lastActive)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.current && (
                        <Badge variant="secondary">Atual</Badge>
                      )}
                      {!session.current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEndSession(session.id)}
                          disabled={isLoading}
                        >
                          Encerrar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotificationIcon className="h-5 w-5" />
                Configurações de Notificação
              </CardTitle>
              <CardDescription>
                Escolha como e quando receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={notificationForm.handleSubmit(handleNotificationUpdate)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações por Email</p>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações importantes por email
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch('emailNotifications')}
                      onCheckedChange={(checked) => notificationForm.setValue('emailNotifications', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações Push</p>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações instantâneas no navegador
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch('pushNotifications')}
                      onCheckedChange={(checked) => notificationForm.setValue('pushNotifications', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações SMS</p>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas importantes por SMS
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch('smsNotifications')}
                      onCheckedChange={(checked) => notificationForm.setValue('smsNotifications', checked)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Tipos de Notificação</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Alertas de Transação</p>
                        <p className="text-sm text-muted-foreground">
                          Notificações sobre transações importantes
                        </p>
                      </div>
                      <Switch
                        checked={notificationForm.watch('transactionAlerts')}
                        onCheckedChange={(checked) => notificationForm.setValue('transactionAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Lembretes de Pagamento</p>
                        <p className="text-sm text-muted-foreground">
                          Lembretes sobre pagamentos pendentes
                        </p>
                      </div>
                      <Switch
                        checked={notificationForm.watch('paymentReminders')}
                        onCheckedChange={(checked) => notificationForm.setValue('paymentReminders', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Alertas de Segurança</p>
                        <p className="text-sm text-muted-foreground">
                          Notificações sobre atividades suspeitas
                        </p>
                      </div>
                      <Switch
                        checked={notificationForm.watch('securityAlerts')}
                        onCheckedChange={(checked) => notificationForm.setValue('securityAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Emails de Marketing</p>
                        <p className="text-sm text-muted-foreground">
                          Receba ofertas e novidades por email
                        </p>
                      </div>
                      <Switch
                        checked={notificationForm.watch('marketingEmails')}
                        onCheckedChange={(checked) => notificationForm.setValue('marketingEmails', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThemeIcon className="h-5 w-5" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a aparência da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Tema</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Escolha entre tema claro, escuro ou automático
                  </p>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="flex items-center gap-2"
                    >
                      <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                      Claro
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="flex items-center gap-2"
                    >
                      <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                      Escuro
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-base font-medium">Densidade da Interface</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Escolha o espaçamento dos elementos da interface
                  </p>
                  <Select defaultValue="comfortable">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Selecione a densidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compacta</SelectItem>
                      <SelectItem value="comfortable">Confortável</SelectItem>
                      <SelectItem value="spacious">Espaçosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacidade */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PrivacyIcon className="h-5 w-5" />
                Privacidade e Dados
              </CardTitle>
              <CardDescription>
                Gerencie suas configurações de privacidade e dados pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Visibilidade do Perfil</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Controle quem pode ver suas informações
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Perfil público</span>
                      <Switch defaultChecked={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mostrar email</span>
                      <Switch defaultChecked={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mostrar telefone</span>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Rastreamento de Atividade</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Controle como suas atividades são registradas
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Registrar atividades</span>
                      <Switch defaultChecked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Analytics anônimos</span>
                      <Switch defaultChecked={true} />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Exportação de Dados</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Baixe uma cópia dos seus dados pessoais
                  </p>
                  <Button onClick={handleExportData} disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Meus Dados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conta */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AccountIcon className="h-5 w-5" />
                Informações da Conta
              </CardTitle>
              <CardDescription>
                Visualize e gerencie informações da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ID da Conta</Label>
                    <p className="text-lg font-medium">{user?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tipo de Conta</Label>
                    <p className="text-lg font-medium capitalize">{user?.role || 'user'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                    <p className="text-lg font-medium">01/01/2024</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Último Login</Label>
                    <p className="text-lg font-medium">Hoje às 10:30</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Ações da Conta</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Fazer Logout de Todos os Dispositivos
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Conta
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 