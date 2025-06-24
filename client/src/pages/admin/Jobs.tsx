/**
 * Painel de Jobs Administrativos
 * @author Lucas
 *
 * @description
 * Página administrativa para monitoramento, execução e histórico de jobs agendados do sistema.
 * Permite visualizar status, executar, pausar, retomar, filtrar e ver histórico de execuções.
 *
 * @example
 * // Rota: /admin/jobs
 * // Acesso: Admin
 */
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  Filter,
  Search,
  MoreHorizontal,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp
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

export default function AdminJobs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Array<{
    id: string;
    name: string;
    status: 'scheduled' | 'running' | 'paused' | 'failed' | 'completed';
    lastRun: Date | null;
    nextRun: Date | null;
    executions: number;
    lastResult: 'success' | 'error' | null;
    message?: string;
  }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  /**
   * Carrega lista de jobs (mock)
   */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock de jobs
      const mockJobs = [
        {
          id: '1',
          name: 'Enviar Notificações',
          status: 'scheduled' as const,
          lastRun: new Date('2025-06-21T10:00:00Z'),
          nextRun: new Date('2025-06-21T12:00:00Z'),
          executions: 120,
          lastResult: 'success' as const,
        },
        {
          id: '2',
          name: 'Backup Diário',
          status: 'running' as const,
          lastRun: new Date('2025-06-21T09:00:00Z'),
          nextRun: new Date('2025-06-22T09:00:00Z'),
          executions: 365,
          lastResult: 'success' as const,
        },
        {
          id: '3',
          name: 'Verificar Integridade',
          status: 'failed' as const,
          lastRun: new Date('2025-06-21T08:00:00Z'),
          nextRun: new Date('2025-06-21T20:00:00Z'),
          executions: 50,
          lastResult: 'error' as const,
          message: 'Erro de conexão com banco',
        },
        {
          id: '4',
          name: 'Limpar Logs',
          status: 'paused' as const,
          lastRun: new Date('2025-06-20T23:00:00Z'),
          nextRun: null,
          executions: 200,
          lastResult: 'success' as const,
        },
        {
          id: '5',
          name: 'Atualizar Relatórios',
          status: 'completed' as const,
          lastRun: new Date('2025-06-21T07:00:00Z'),
          nextRun: null,
          executions: 80,
          lastResult: 'success' as const,
        },
      ];
      setJobs(mockJobs);
    } catch (err) {
      setError('Erro ao carregar jobs');
      toast.error('Erro ao carregar lista de jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  /**
   * Filtra jobs baseado nos critérios
   */
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /**
   * Executa job manualmente
   */
  const runJob = async (jobId: string) => {
    try {
      toast.success('Job executado manualmente');
    } catch (err) {
      toast.error('Erro ao executar job');
    }
  };

  /**
   * Pausa job
   */
  const pauseJob = async (jobId: string) => {
    try {
      setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: 'paused' } : job));
      toast.success('Job pausado');
    } catch (err) {
      toast.error('Erro ao pausar job');
    }
  };

  /**
   * Retoma job
   */
  const resumeJob = async (jobId: string) => {
    try {
      setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: 'scheduled' } : job));
      toast.success('Job retomado');
    } catch (err) {
      toast.error('Erro ao retomar job');
    }
  };

  /**
   * Remove job
   */
  const deleteJob = async (jobId: string) => {
    try {
      setJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success('Job removido');
    } catch (err) {
      toast.error('Erro ao remover job');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchJobs}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Jobs</h1>
          <p className="text-muted-foreground">
            Monitore, execute e gerencie jobs agendados do sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchJobs}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome do job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="running">Executando</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchJobs}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            <Button variant="outline" onClick={() => setShowHistory((v) => !v)}>
              <History className="h-4 w-4 mr-2" /> Histórico
              {showHistory ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de jobs com falha */}
      {jobs.some(j => j.status === 'failed') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            Existem jobs com falha! Verifique o histórico e logs para detalhes.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs ({filteredJobs.length})</CardTitle>
          <CardDescription>
            Lista de jobs agendados, status atual e ações disponíveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Execução</TableHead>
                <TableHead>Próxima Execução</TableHead>
                <TableHead>Execuções</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      job.status === 'running' ? 'default' :
                      job.status === 'failed' ? 'destructive' :
                      job.status === 'paused' ? 'secondary' :
                      job.status === 'completed' ? 'outline' : 'default'
                    }>
                      {job.status === 'scheduled' && 'Agendado'}
                      {job.status === 'running' && 'Executando'}
                      {job.status === 'paused' && 'Pausado'}
                      {job.status === 'failed' && 'Falhou'}
                      {job.status === 'completed' && 'Concluído'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {job.lastRun ? job.lastRun.toLocaleString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    {job.nextRun ? job.nextRun.toLocaleString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>{job.executions}</TableCell>
                  <TableCell>
                    {job.lastResult === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {job.lastResult === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => runJob(job.id)}>
                          <Play className="h-4 w-4 mr-2" /> Executar
                        </DropdownMenuItem>
                        {job.status === 'running' ? (
                          <DropdownMenuItem onClick={() => pauseJob(job.id)}>
                            <Pause className="h-4 w-4 mr-2" /> Pausar
                          </DropdownMenuItem>
                        ) : job.status === 'paused' ? (
                          <DropdownMenuItem onClick={() => resumeJob(job.id)}>
                            <Play className="h-4 w-4 mr-2" /> Retomar
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteJob(job.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" /> Remover
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

      {/* Histórico de Execuções (mock) */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Execuções</CardTitle>
            <CardDescription>Últimas execuções de jobs do sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Mock de histórico */}
                <TableRow>
                  <TableCell>Verificar Integridade</TableCell>
                  <TableCell>21/06/2025 08:00</TableCell>
                  <TableCell>
                    <Badge variant="destructive">Falhou</Badge>
                  </TableCell>
                  <TableCell>Erro de conexão com banco</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Backup Diário</TableCell>
                  <TableCell>21/06/2025 09:00</TableCell>
                  <TableCell>
                    <Badge variant="default">Executado</Badge>
                  </TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Enviar Notificações</TableCell>
                  <TableCell>21/06/2025 10:00</TableCell>
                  <TableCell>
                    <Badge variant="default">Executado</Badge>
                  </TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 