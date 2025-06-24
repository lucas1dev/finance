/**
 * Gerenciamento de Notificações Administrativas
 * @author Lucas
 *
 * @description
 * Página administrativa para gerenciamento completo de notificações do sistema financeiro.
 * Permite visualizar, filtrar, reprocessar notificações, configurar templates e gerar relatórios.
 *
 * @example
 * // Rota: /admin/notifications
 * // Acesso: Admin
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Trash2, 
  Eye, 
  EyeOff,
  Filter,
  Download,
  Settings,
  BarChart3,
  Search,
  Plus,
  Edit,
  Send,
  AlertTriangle,
  MoreHorizontal,
  Calendar,
  User,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Componente principal de gerenciamento de notificações
 * @returns {JSX.Element} Página de gerenciamento de notificações
 */
export default function AdminNotifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'email' | 'sms' | 'push' | 'system';
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    recipient: string;
    recipientName: string;
    recipientEmail: string;
    createdAt: Date;
    sentAt: Date | null;
    template: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  /**
   * Carrega lista de notificações
   */
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data temporário até implementar o endpoint no backend
      const mockNotifications = [
        {
          id: '1',
          title: 'Boas-vindas ao Sistema',
          message: 'Seja bem-vindo ao sistema financeiro! Sua conta foi criada com sucesso.',
          type: 'email' as const,
          status: 'sent' as const,
          recipient: 'joao@finance.com',
          recipientName: 'João Silva',
          recipientEmail: 'joao@finance.com',
          createdAt: new Date('2025-01-20T10:30:00'),
          sentAt: new Date('2025-01-20T10:31:00'),
          template: 'welcome',
          priority: 'medium' as const
        },
        {
          id: '2',
          title: 'Lembrete de Pagamento',
          message: 'Você tem um pagamento vencendo em 3 dias. Valor: R$ 1.500,00',
          type: 'email' as const,
          status: 'pending' as const,
          recipient: 'maria@finance.com',
          recipientName: 'Maria Santos',
          recipientEmail: 'maria@finance.com',
          createdAt: new Date('2025-01-21T09:15:00'),
          sentAt: null,
          template: 'payment_reminder',
          priority: 'high' as const
        },
        {
          id: '3',
          title: 'Alerta de Segurança',
          message: 'Detectamos um login suspeito na sua conta. Verifique se foi você.',
          type: 'push' as const,
          status: 'sent' as const,
          recipient: 'pedro@finance.com',
          recipientName: 'Pedro Costa',
          recipientEmail: 'pedro@finance.com',
          createdAt: new Date('2025-01-21T14:20:00'),
          sentAt: new Date('2025-01-21T14:21:00'),
          template: 'security_alert',
          priority: 'urgent' as const
        },
        {
          id: '4',
          title: 'Relatório Mensal',
          message: 'Seu relatório financeiro mensal está disponível para download.',
          type: 'email' as const,
          status: 'failed' as const,
          recipient: 'ana@finance.com',
          recipientName: 'Ana Oliveira',
          recipientEmail: 'ana@finance.com',
          createdAt: new Date('2025-01-21T16:45:00'),
          sentAt: null,
          template: 'monthly_report',
          priority: 'low' as const
        },
        {
          id: '5',
          title: 'Manutenção Programada',
          message: 'O sistema estará em manutenção hoje das 02:00 às 04:00.',
          type: 'system' as const,
          status: 'sent' as const,
          recipient: 'all',
          recipientName: 'Todos os Usuários',
          recipientEmail: 'system@finance.com',
          createdAt: new Date('2025-01-21T18:00:00'),
          sentAt: new Date('2025-01-21T18:01:00'),
          template: 'maintenance',
          priority: 'medium' as const
        }
      ];
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(mockNotifications);
      setTotalPages(Math.ceil(mockNotifications.length / 10));
    } catch (err) {
      setError('Erro ao carregar notificações');
      toast.error('Erro ao carregar lista de notificações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, searchTerm, statusFilter, typeFilter, priorityFilter]);

  /**
   * Filtra notificações baseado nos critérios
   */
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  /**
   * Reprocessa notificação
   */
  const reprocessNotification = async (notificationId: string) => {
    try {
      await api.post(`/admin/notifications/${notificationId}/reprocess`);
      toast.success('Notificação reprocessada com sucesso');
      fetchNotifications();
    } catch (err) {
      toast.error('Erro ao reprocessar notificação');
    }
  };

  /**
   * Remove notificação
   */
  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/admin/notifications/${notificationId}`);
      toast.success('Notificação removida com sucesso');
      fetchNotifications();
      setShowDeleteDialog(false);
      setSelectedNotification(null);
    } catch (err) {
      toast.error('Erro ao remover notificação');
    }
  };

  /**
   * Abre diálogo para criar/editar notificação
   */
  const openNotificationDialog = (mode: 'create' | 'edit', notification?: any) => {
    setDialogMode(mode);
    setSelectedNotification(notification || null);
    setShowNotificationDialog(true);
  };

  /**
   * Obtém cor do badge baseado no status
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Obtém cor do badge baseado no tipo
   */
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-purple-100 text-purple-800';
      case 'push': return 'bg-orange-100 text-orange-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Obtém cor do badge baseado na prioridade
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Obtém ícone baseado no tipo
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageCircle className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as notificações do sistema, templates e destinatários
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => openNotificationDialog('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Notificação
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Notificações</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter(n => n.status === 'sent').length}
            </div>
            <p className="text-xs text-muted-foreground">
              85% de taxa de sucesso
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {notifications.filter(n => n.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando envio
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falharam</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter(n => n.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
          <CardDescription>
            Filtre e busque notificações específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar por título, mensagem ou destinatário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="sent">Enviadas</SelectItem>
                  <SelectItem value="failed">Falharam</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Lista de todas as notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinatário</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {notification.recipientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{notification.recipientName}</div>
                        <div className="text-sm text-muted-foreground">{notification.recipientEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {notification.message}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(notification.type)}>
                      <div className="flex items-center space-x-1">
                        {getTypeIcon(notification.type)}
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(notification.status)}>
                      <span className="capitalize">{notification.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(notification.priority)}>
                      <span className="capitalize">{notification.priority}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {notification.createdAt.toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {notification.createdAt.toLocaleTimeString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openNotificationDialog('edit', notification)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => reprocessNotification(notification.id)}>
                          <Send className="h-4 w-4 mr-2" />
                          Reprocessar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedNotification(notification);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação de Remoção */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta notificação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedNotification && deleteNotification(selectedNotification.id)}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Criação/Edição de Notificação */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Nova Notificação' : 'Editar Notificação'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' 
                ? 'Crie uma nova notificação para enviar aos usuários'
                : 'Edite os detalhes da notificação'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input 
                  placeholder="Título da notificação"
                  defaultValue={selectedNotification?.title || ''}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select defaultValue={selectedNotification?.type || 'email'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <textarea 
                className="w-full min-h-[100px] p-3 border border-input rounded-md"
                placeholder="Mensagem da notificação"
                defaultValue={selectedNotification?.message || ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Destinatário</label>
                <Input 
                  placeholder="Email do destinatário"
                  defaultValue={selectedNotification?.recipientEmail || ''}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Select defaultValue={selectedNotification?.priority || 'medium'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
              Cancelar
            </Button>
            <Button>
              {dialogMode === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 