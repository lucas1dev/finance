import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  User,
  Calendar,
  Activity,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  BarChart3,
  Shield,
  Clock
} from 'lucide-react';
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
import auditService, { AuditLog, AuditFilters, AuditStats } from '@/lib/auditService';

/**
 * Sistema de Auditoria Administrativa
 * @author Lucas
 *
 * @description
 * Página para visualizar e filtrar logs de auditoria do sistema, com busca, filtros avançados,
 * exportação de relatórios e visualização de detalhes.
 *
 * @example
 * // Rota: /admin/audit
 * // Acesso: Admin
 */
export default function AdminAudit() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableResources, setAvailableResources] = useState<string[]>([]);
  const [usersWithLogs, setUsersWithLogs] = useState<Array<{id: number, name: string, email: string}>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  /**
   * Carrega logs de auditoria da API
   */
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: AuditFilters = {
        search: searchTerm || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter as 'success' | 'error' : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: currentPage,
        pageSize: 10,
      };

      // Se um usuário específico foi selecionado
      if (userFilter !== 'all') {
        const selectedUser = usersWithLogs.find(u => u.email === userFilter);
        if (selectedUser) {
          filters.userId = selectedUser.id;
        }
      }

      const response = await auditService.getLogs(filters);
      setLogs(response.logs);
      setTotalPages(response.totalPages);
      setTotalLogs(response.total);
    } catch (err) {
      setError('Erro ao carregar logs de auditoria');
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega estatísticas de auditoria
   */
  const fetchStats = async () => {
    try {
      const statsData = await auditService.getStats('month');
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  /**
   * Carrega dados para filtros
   */
  const fetchFilterData = async () => {
    try {
      const [actions, resources, users] = await Promise.all([
        auditService.getAvailableActions(),
        auditService.getAvailableResources(),
        auditService.getUsersWithLogs(),
      ]);
      
      setAvailableActions(actions);
      setAvailableResources(resources);
      setUsersWithLogs(users);
    } catch (err) {
      console.error('Erro ao carregar dados dos filtros:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, searchTerm, userFilter, actionFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchStats();
    fetchFilterData();
  }, []);

  /**
   * Exporta relatório de auditoria
   */
  const exportReport = async () => {
    try {
      const filters: AuditFilters = {
        search: searchTerm || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter as 'success' | 'error' : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      if (userFilter !== 'all') {
        const selectedUser = usersWithLogs.find(u => u.email === userFilter);
        if (selectedUser) {
          filters.userId = selectedUser.id;
        }
      }

      const report = await auditService.exportReport(filters, 'csv');
      
      // Download do arquivo
      const url = window.URL.createObjectURL(report);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Relatório exportado com sucesso');
    } catch (err) {
      toast.error('Erro ao exportar relatório');
    }
  };

  /**
   * Abre diálogo de detalhes
   */
  const openDetailDialog = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  /**
   * Formata data para exibição
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR'),
      full: date.toLocaleString('pt-BR'),
    };
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  if (error && logs.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Auditoria do Sistema</h1>
          <p className="text-muted-foreground">
            Visualize e filtre logs de auditoria, exporte relatórios e veja detalhes de cada ação
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportReport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">logs registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Logs Hoje</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.logsToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">logs hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">ações bem-sucedidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.errorRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">ações com erro</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros Avançados</CardTitle>
          <CardDescription>Busque e filtre logs por usuário, ação, status, período e recurso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar por usuário, ação, recurso ou detalhes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuário</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {usersWithLogs.map(user => (
                    <SelectItem key={user.id} value={user.email}>{user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableActions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">De</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Até</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria ({totalLogs.toLocaleString()})</CardTitle>
          <CardDescription>Lista de ações realizadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && logs.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(log => {
                const formattedDate = formatDate(log.timestamp);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.userName}</span>
                        <span className="text-xs text-muted-foreground">ID: {log.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center text-green-700 bg-green-100 rounded px-2 py-0.5 text-xs font-medium">
                          <CheckCircle className="h-4 w-4 mr-1" /> Sucesso
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-700 bg-red-100 rounded px-2 py-0.5 text-xs font-medium">
                          <XCircle className="h-4 w-4 mr-1" /> Erro
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formattedDate.date}</div>
                      <div className="text-xs text-muted-foreground">{formattedDate.time}</div>
                    </TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openDetailDialog(log)} title="Ver detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({totalLogs.toLocaleString()} logs)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Detalhes */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
            <DialogDescription>
              Informações detalhadas da ação realizada
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-2 py-2">
              <div><strong>Usuário:</strong> {selectedLog.userName} (ID: {selectedLog.userId})</div>
              <div><strong>Ação:</strong> {selectedLog.action}</div>
              <div><strong>Recurso:</strong> {selectedLog.resource}</div>
              <div><strong>Status:</strong> {selectedLog.status === 'success' ? 'Sucesso' : 'Erro'}</div>
              <div><strong>Data:</strong> {formatDate(selectedLog.timestamp).full}</div>
              <div><strong>IP:</strong> {selectedLog.ipAddress}</div>
              <div><strong>Detalhes:</strong> {selectedLog.details}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 