/**
 * Modal de Configuração de Verificações
 * @author Lucas
 *
 * @description
 * Modal para configurar verificações de integridade de dados, incluindo agendamento,
 * timeout, correção automática e outras opções.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Clock, 
  Zap, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

interface CheckConfiguration {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  schedule?: string;
  timeout?: number;
  autoFix: boolean;
  retryCount?: number;
  retryDelay?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  notifications?: boolean;
  emailNotifications?: boolean;
  webhookUrl?: string;
}

interface CheckConfigurationModalProps {
  check: CheckConfiguration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: Partial<CheckConfiguration>) => Promise<void>;
  loading?: boolean;
}

/**
 * Modal de configuração de verificações
 * @param {Object} props - Propriedades do componente
 * @returns {JSX.Element} Modal de configuração
 */
export function CheckConfigurationModal({
  check,
  open,
  onOpenChange,
  onSave,
  loading = false
}: CheckConfigurationModalProps) {
  const [config, setConfig] = useState<Partial<CheckConfiguration>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (check) {
      setConfig({
        enabled: check.enabled,
        schedule: check.schedule || '',
        timeout: check.timeout || 300,
        autoFix: check.autoFix,
        retryCount: check.retryCount || 3,
        retryDelay: check.retryDelay || 60,
        priority: check.priority || 'medium',
        notifications: check.notifications ?? true,
        emailNotifications: check.emailNotifications ?? false,
        webhookUrl: check.webhookUrl || ''
      });
      setErrors({});
    }
  }, [check]);

  const handleConfigChange = (key: keyof CheckConfiguration, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));

    // Limpa erro do campo
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.timeout && (config.timeout < 30 || config.timeout > 3600)) {
      newErrors.timeout = 'Timeout deve estar entre 30 e 3600 segundos';
    }

    if (config.retryCount && (config.retryCount < 0 || config.retryCount > 10)) {
      newErrors.retryCount = 'Número de tentativas deve estar entre 0 e 10';
    }

    if (config.retryDelay && (config.retryDelay < 10 || config.retryDelay > 3600)) {
      newErrors.retryDelay = 'Delay entre tentativas deve estar entre 10 e 3600 segundos';
    }

    if (config.webhookUrl && !isValidUrl(config.webhookUrl)) {
      newErrors.webhookUrl = 'URL do webhook inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      return;
    }

    try {
      await onSave(config);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const scheduleOptions = [
    { value: '', label: 'Manual' },
    { value: '0 */6 * * *', label: 'A cada 6 horas' },
    { value: '0 */12 * * *', label: 'A cada 12 horas' },
    { value: '0 0 * * *', label: 'Diariamente' },
    { value: '0 0 * * 0', label: 'Semanalmente' },
    { value: '0 0 1 * *', label: 'Mensalmente' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Crítica', color: 'bg-red-100 text-red-800' }
  ];

  if (!check) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Verificação: {check.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da verificação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Verificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={check.enabled ? 'default' : 'secondary'}>
                      {check.enabled ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Prioridade</Label>
                  <div className="mt-1">
                    <Select
                      value={config.priority || 'medium'}
                      onValueChange={(value) => handleConfigChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={option.color}>
                                {option.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de execução */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configurações de Execução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule">Agendamento</Label>
                  <Select
                    value={config.schedule || ''}
                    onValueChange={(value) => handleConfigChange('schedule', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o agendamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para execução manual
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (segundos)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="30"
                    max="3600"
                    value={config.timeout || 300}
                    onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                    className={errors.timeout ? 'border-red-500' : ''}
                  />
                  {errors.timeout && (
                    <p className="text-xs text-red-500">{errors.timeout}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retryCount">Tentativas em caso de falha</Label>
                  <Input
                    id="retryCount"
                    type="number"
                    min="0"
                    max="10"
                    value={config.retryCount || 3}
                    onChange={(e) => handleConfigChange('retryCount', parseInt(e.target.value))}
                    className={errors.retryCount ? 'border-red-500' : ''}
                  />
                  {errors.retryCount && (
                    <p className="text-xs text-red-500">{errors.retryCount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryDelay">Delay entre tentativas (segundos)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    min="10"
                    max="3600"
                    value={config.retryDelay || 60}
                    onChange={(e) => handleConfigChange('retryDelay', parseInt(e.target.value))}
                    className={errors.retryDelay ? 'border-red-500' : ''}
                  />
                  {errors.retryDelay && (
                    <p className="text-xs text-red-500">{errors.retryDelay}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de correção */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configurações de Correção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="autoFix">Correção Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Corrigir problemas automaticamente quando possível
                  </p>
                </div>
                <Switch
                  id="autoFix"
                  checked={config.autoFix || false}
                  onCheckedChange={(checked: boolean) => handleConfigChange('autoFix', checked)}
                />
              </div>

              {config.autoFix && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Correção Automática Ativada</p>
                      <p className="mt-1">
                        Problemas que podem ser corrigidos automaticamente serão resolvidos
                        sem intervenção manual. Problemas críticos ainda requererão aprovação.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações de notificação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Notificações no Sistema</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações quando problemas forem encontrados
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={config.notifications ?? true}
                  onCheckedChange={(checked: boolean) => handleConfigChange('notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="emailNotifications">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações por email para problemas críticos
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={config.emailNotifications ?? false}
                  onCheckedChange={(checked: boolean) => handleConfigChange('emailNotifications', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL (opcional)</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://api.example.com/webhook"
                  value={config.webhookUrl || ''}
                  onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                  className={errors.webhookUrl ? 'border-red-500' : ''}
                />
                {errors.webhookUrl && (
                  <p className="text-xs text-red-500">{errors.webhookUrl}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  URL para enviar notificações via webhook
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 