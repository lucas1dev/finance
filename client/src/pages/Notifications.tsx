/**
 * Página de gerenciamento de notificações.
 * Permite visualizar, filtrar e gerenciar todas as notificações do usuário.
 * 
 * @returns {JSX.Element} Página de notificações.
 * @example
 * <Notifications />
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'payment_due' | 'payment_overdue' | 'reminder' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isActive: boolean;
  createdAt: string;
  dueDate?: string;
  relatedType?: string;
  relatedId?: number;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'payment_due': return '⏰';
    case 'payment_overdue': return '🚨';
    case 'reminder': return '📝';
    case 'system': return '⚙️';
    default: return '📢';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'payment_due': return 'Vencimento';
    case 'payment_overdue': return 'Atraso';
    case 'reminder': return 'Lembrete';
    case 'system': return 'Sistema';
    default: return type;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
};

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    isRead: '',
    type: '',
    priority: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [isRunningJob, setIsRunningJob] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const [notificationsResponse, statsResponse] = await Promise.all([
        api.get(`/notifications?${params}`),
        api.get('/notifications/stats')
      ]);
      
      setNotifications(notificationsResponse.data.notifications || []);
      setStats(statsResponse.data);
      setPagination(prev => ({
        ...prev,
        total: notificationsResponse.data.pagination?.totalItems || 0,
      }));
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error);
      toast.error(error.response?.data?.message || 'Erro ao buscar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobStatus = async () => {
    try {
      const response = await api.get('/notifications/jobs/status');
      setJobStatus(response.data.data);
    } catch (error: any) {
      console.error('Erro ao buscar status dos jobs:', error);
    }
  };

  const runJob = async (jobType: string) => {
    try {
      setIsRunningJob(true);
      let endpoint = '';
      
      switch (jobType) {
        case 'all':
          endpoint = '/notifications/jobs/run';
          break;
        case 'payment-check':
          endpoint = '/notifications/jobs/payment-check';
          break;
        case 'general-reminders':
          endpoint = '/notifications/jobs/general-reminders';
          break;
        case 'cleanup':
          endpoint = '/notifications/jobs/cleanup';
          break;
        default:
          throw new Error('Tipo de job inválido');
      }

      const response = await api.post(endpoint);
      toast.success(response.data.message || 'Job executado com sucesso');
      
      // Recarregar notificações e status dos jobs
      await Promise.all([fetchNotifications(), fetchJobStatus()]);
    } catch (error: any) {
      console.error('Erro ao executar job:', error);
      toast.error(error.response?.data?.message || 'Erro ao executar job');
    } finally {
      setIsRunningJob(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchJobStatus();
  }, [pagination.page, filters]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      toast.success('Notificação marcada como lida');
    } catch (error: any) {
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) {
      toast.error('Selecione pelo menos uma notificação');
      return;
    }

    try {
      await Promise.all(
        selectedNotifications.map(id => api.patch(`/notifications/${id}/read`))
      );
      
      setNotifications(prev => 
        prev.map(notif => 
          selectedNotifications.includes(notif.id) 
            ? { ...notif, isRead: true } 
            : notif
        )
      );
      setSelectedNotifications([]);
      toast.success(`${selectedNotifications.length} notificação(ões) marcada(s) como lida(s)`);
    } catch (error: any) {
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setSelectedNotifications([]);
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error: any) {
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação?')) {
      return;
    }

    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success('Notificação excluída com sucesso');
    } catch (error: any) {
      toast.error('Erro ao excluir notificação');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(notifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, id]);
    } else {
      setSelectedNotifications(prev => prev.filter(n => n !== id));
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notificações</h1>
        <div className="flex gap-2">
          {selectedNotifications.length > 0 && (
            <Button onClick={handleMarkSelectedAsRead} variant="outline">
              Marcar selecionadas como lidas ({selectedNotifications.length})
            </Button>
          )}
          <Button onClick={handleMarkAllAsRead} variant="outline">
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Não lidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span>{getTypeLabel(type)}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.byPriority).map(([priority, count]) => (
                  <div key={priority} className="flex justify-between text-sm">
                    <span className="capitalize">{priority}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controle de Jobs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔧</span>
            Controle de Jobs de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status dos Jobs</Label>
              <div className="text-sm text-gray-600">
                {jobStatus?.status === 'active' ? (
                  <span className="text-green-600">● Ativo</span>
                ) : (
                  <span className="text-red-600">● Inativo</span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Verificação de Pagamentos</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => runJob('payment-check')}
                  disabled={isRunningJob}
                  className="flex-1"
                >
                  {isRunningJob ? 'Executando...' : 'Executar'}
                </Button>
                <div className="text-xs text-gray-500">
                  {jobStatus?.jobs?.find((j: any) => j.name === 'payment_check')?.schedule}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lembretes Gerais</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => runJob('general-reminders')}
                  disabled={isRunningJob}
                  className="flex-1"
                >
                  {isRunningJob ? 'Executando...' : 'Executar'}
                </Button>
                <div className="text-xs text-gray-500">
                  {jobStatus?.jobs?.find((j: any) => j.name === 'general_reminders')?.schedule}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Limpeza</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runJob('cleanup')}
                  disabled={isRunningJob}
                  className="flex-1"
                >
                  {isRunningJob ? 'Executando...' : 'Limpar'}
                </Button>
                <div className="text-xs text-gray-500">
                  {jobStatus?.jobs?.find((j: any) => j.name === 'cleanup')?.schedule}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => runJob('all')}
              disabled={isRunningJob}
              className="w-full"
            >
              {isRunningJob ? 'Executando todos os jobs...' : 'Executar Todos os Jobs'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar por título ou mensagem..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={filters.isRead} onValueChange={(value) => handleFilterChange('isRead', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="false">Não lidas</SelectItem>
              <SelectItem value="true">Lidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="payment_due">Vencimento</SelectItem>
              <SelectItem value="payment_overdue">Atraso</SelectItem>
              <SelectItem value="reminder">Lembrete</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="text-center py-8">Carregando notificações...</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id} className={!notification.isRead ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onCheckedChange={(checked) => handleSelectNotification(notification.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      <span className="text-sm">{getTypeLabel(notification.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{notification.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(notification.priority)}>
                      {notification.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(notification.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={notification.isRead ? 'secondary' : 'default'}>
                      {notification.isRead ? 'Lida' : 'Não lida'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Marcar como lida
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {pagination.page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 