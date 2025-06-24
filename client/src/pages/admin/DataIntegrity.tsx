/**
 * Página de Integridade de Dados - Administrativa
 * @author Lucas
 *
 * @description
 * Página administrativa para gerenciar integridade de dados do sistema,
 * incluindo verificações, problemas, correções e relatórios.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Settings,
  Play,
  Pause,
  RefreshCw,
  Download,
  Filter,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  BarChart3,
  Database,
  Wrench,
  Bell
} from 'lucide-react';

// Hooks customizados
import { 
  useIntegrityChecks, 
  useIntegrityIssues, 
  useIntegrityReports,
  useIntegrityNotifications 
} from '@/hooks/useDataIntegrity';

// Componentes customizados
import { DataIntegrityFilters } from '@/components/DataIntegrityFilters';
import { CheckConfigurationModal } from '@/components/CheckConfigurationModal';

// Tipos
import { IntegrityCheck, IntegrityIssue } from '@/lib/dataIntegrityService';

/**
 * Página de Integridade de Dados
 * @returns {JSX.Element} Página de integridade de dados
 */
export function AdminDataIntegrity() {
  // Estado local
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedCheck, setSelectedCheck] = useState<IntegrityCheck | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<number[]>([]);

  // Hooks customizados
  const {
    checks,
    loading: checksLoading,
    error: checksError,
    runningChecks,
    fetchChecks,
    runCheck,
    runAllChecks,
    toggleCheck,
    configureCheck
  } = useIntegrityChecks();

  const {
    issues,
    loading: issuesLoading,
    error: issuesError,
    filters,
    fetchIssues,
    fixIssue,
    fixMultipleIssues,
    updateFilters
  } = useIntegrityIssues();

  const {
    report,
    stats,
    loading: reportsLoading,
    error: reportsError,
    fetchReport,
    fetchStats,
    exportReport
  } = useIntegrityReports();

  const {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useIntegrityNotifications();

  // Dados calculados
  const criticalIssues = useMemo(() => 
    issues.filter(issue => issue.type === 'critical' && !issue.fixed), 
    [issues]
  );

  const warningIssues = useMemo(() => 
    issues.filter(issue => issue.type === 'warning' && !issue.fixed), 
    [issues]
  );

  const activeChecks = useMemo(() => 
    checks.filter(check => check.enabled), 
    [checks]
  );

  const totalIssues = useMemo(() => 
    issues.filter(issue => !issue.fixed).length, 
    [issues]
  );

  // Handlers
  const handleRunCheck = async (checkId: number) => {
    try {
      await runCheck(checkId);
      addNotification({
        type: 'success',
        title: 'Verificação Executada',
        message: 'Verificação concluída com sucesso'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na Verificação',
        message: 'Falha ao executar verificação'
      });
    }
  };

  const handleRunAllChecks = async () => {
    try {
      await runAllChecks();
      addNotification({
        type: 'success',
        title: 'Verificações Executadas',
        message: 'Todas as verificações foram executadas'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro nas Verificações',
        message: 'Falha ao executar verificações'
      });
    }
  };

  const handleFixIssue = async (issueId: number) => {
    try {
      await fixIssue(issueId);
      addNotification({
        type: 'success',
        title: 'Problema Corrigido',
        message: 'Problema corrigido automaticamente'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na Correção',
        message: 'Falha ao corrigir problema'
      });
    }
  };

  const handleFixMultipleIssues = async () => {
    if (selectedIssues.length === 0) return;

    try {
      await fixMultipleIssues(selectedIssues);
      setSelectedIssues([]);
      addNotification({
        type: 'success',
        title: 'Problemas Corrigidos',
        message: `${selectedIssues.length} problemas corrigidos`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na Correção',
        message: 'Falha ao corrigir problemas'
      });
    }
  };

  const handleToggleCheck = async (checkId: number, enabled: boolean) => {
    try {
      await toggleCheck(checkId, enabled);
      addNotification({
        type: 'success',
        title: 'Status Alterado',
        message: `Verificação ${enabled ? 'ativada' : 'desativada'}`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao alterar status da verificação'
      });
    }
  };

  const handleConfigureCheck = async (config: any) => {
    if (!selectedCheck) return;

    try {
      await configureCheck(selectedCheck.id, config);
      addNotification({
        type: 'success',
        title: 'Configuração Salva',
        message: 'Configuração atualizada com sucesso'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao salvar configuração'
      });
    }
  };

  const handleExportReport = async (format: 'csv' | 'pdf' | 'xlsx') => {
    try {
      await exportReport(format);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na Exportação',
        message: 'Falha ao exportar relatório'
      });
    }
  };

  // Renderização condicional de loading
  if (checksLoading && checks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando verificações de integridade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integridade de Dados</h1>
          <p className="text-muted-foreground">
            Monitore e corrija problemas de integridade no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchChecks()}
            disabled={checksLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checksLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleRunAllChecks} disabled={checksLoading}>
            <Play className="h-4 w-4 mr-2" />
            Executar Todas
          </Button>
        </div>
      </div>

      {/* Alertas críticos */}
      {criticalIssues.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalIssues.length} problema(s) crítico(s)</strong> encontrado(s). 
            Recomendamos correção imediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs principais */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="checks" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verificações
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Problemas
            {totalIssues > 0 && (
              <Badge variant="destructive" className="ml-1">
                {totalIssues}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Aba: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verificações Ativas</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeChecks.length}</div>
                <p className="text-xs text-muted-foreground">
                  de {checks.length} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Problemas Críticos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{criticalIssues.length}</div>
                <p className="text-xs text-muted-foreground">
                  Requerem atenção imediata
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avisos</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{warningIssues.length}</div>
                <p className="text-xs text-muted-foreground">
                  Monitoramento recomendado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {checks.length > 0 ? Math.round((activeChecks.length / checks.length) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Verificações funcionando
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ações rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={handleRunAllChecks}
                  disabled={checksLoading}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Play className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Executar Todas</div>
                    <div className="text-sm text-muted-foreground">
                      Executar todas as verificações
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setSelectedTab('issues')}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Wrench className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Corrigir Problemas</div>
                    <div className="text-sm text-muted-foreground">
                      Ver problemas e corrigir
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setSelectedTab('reports')}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <FileText className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Gerar Relatório</div>
                    <div className="text-sm text-muted-foreground">
                      Exportar relatório completo
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Atividades recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checks.slice(0, 5).map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        check.status === 'completed' ? 'bg-green-500' :
                        check.status === 'running' ? 'bg-yellow-500' :
                        check.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <div className="font-medium">{check.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Última execução: {new Date(check.lastRun).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={check.enabled ? 'default' : 'secondary'}>
                        {check.enabled ? 'Ativa' : 'Inativa'}
                      </Badge>
                      {check.issues > 0 && (
                        <Badge variant="destructive">
                          {check.issues} problema{check.issues !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Verificações */}
        <TabsContent value="checks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Verificações de Integridade</h2>
            <Button onClick={handleRunAllChecks} disabled={checksLoading}>
              <Play className="h-4 w-4 mr-2" />
              Executar Todas
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {checks.map((check) => (
              <Card key={check.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{check.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCheck(check);
                          setConfigModalOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCheck(check.id, !check.enabled)}
                        disabled={checksLoading}
                      >
                        {check.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{check.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Status</div>
                      <Badge variant={
                        check.status === 'completed' ? 'default' :
                        check.status === 'running' ? 'secondary' :
                        check.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {check.status === 'completed' ? 'Concluída' :
                         check.status === 'running' ? 'Executando' :
                         check.status === 'failed' ? 'Falhou' : 'Pendente'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Problemas</div>
                      <div className="text-lg font-bold">{check.issues}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Última execução</span>
                      <span>{new Date(check.lastRun).toLocaleString()}</span>
                    </div>
                    {check.nextRun && (
                      <div className="flex justify-between text-sm">
                        <span>Próxima execução</span>
                        <span>{new Date(check.nextRun).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRunCheck(check.id)}
                      disabled={runningChecks.has(check.id)}
                      className="flex-1"
                    >
                      {runningChecks.has(check.id) ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Executando...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Executar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba: Problemas */}
        <TabsContent value="issues" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Problemas de Integridade</h2>
            {selectedIssues.length > 0 && (
              <Button onClick={handleFixMultipleIssues}>
                <Wrench className="h-4 w-4 mr-2" />
                Corrigir Selecionados ({selectedIssues.length})
              </Button>
            )}
          </div>

          {/* Filtros */}
          <DataIntegrityFilters
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={() => updateFilters({})}
            checks={checks.map(c => ({ id: c.id, name: c.name }))}
            categories={Array.from(new Set(issues.map(i => i.category)))}
            loading={issuesLoading}
          />

          {/* Lista de problemas */}
          <div className="space-y-4">
            {issuesLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Carregando problemas...
              </div>
            ) : issues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-32">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum problema encontrado</h3>
                  <p className="text-muted-foreground text-center">
                    Todos os dados estão íntegros ou os filtros aplicados não retornaram resultados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              issues.map((issue) => (
                <Card key={issue.id} className={issue.fixed ? 'opacity-60' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          issue.type === 'critical' ? 'bg-red-500' :
                          issue.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{issue.title}</h3>
                            <Badge variant={
                              issue.type === 'critical' ? 'destructive' :
                              issue.type === 'warning' ? 'secondary' : 'default'
                            }>
                              {issue.type === 'critical' ? 'Crítico' :
                               issue.type === 'warning' ? 'Aviso' : 'Info'}
                            </Badge>
                            {issue.fixed && (
                              <Badge variant="outline" className="text-green-600">
                                Corrigido
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {issue.description}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Categoria:</span> {issue.category}
                            </div>
                            <div>
                              <span className="font-medium">Severidade:</span> {issue.severity}
                            </div>
                            <div>
                              <span className="font-medium">Registros afetados:</span> {issue.affectedRecords}
                            </div>
                            <div>
                              <span className="font-medium">Criado em:</span> {new Date(issue.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {issue.suggestedFix && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-sm font-medium text-blue-800 mb-1">
                                Correção Sugerida:
                              </div>
                              <div className="text-sm text-blue-700">
                                {issue.suggestedFix}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {!issue.fixed && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleFixIssue(issue.id)}
                              disabled={issuesLoading}
                            >
                              <Wrench className="h-4 w-4 mr-2" />
                              Corrigir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedIssues(prev => 
                                  prev.includes(issue.id) 
                                    ? prev.filter(id => id !== issue.id)
                                    : [...prev, issue.id]
                                );
                              }}
                            >
                              {selectedIssues.includes(issue.id) ? 'Desselecionar' : 'Selecionar'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Aba: Relatórios */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Relatórios de Integridade</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportReport('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport('pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport('xlsx')}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>

          {reportsLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              Carregando relatórios...
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estatísticas gerais */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalChecks}</div>
                      <div className="text-sm text-muted-foreground">Total de Verificações</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.activeChecks}</div>
                      <div className="text-sm text-muted-foreground">Verificações Ativas</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.criticalIssues}</div>
                      <div className="text-sm text-muted-foreground">Problemas Críticos</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{stats.warningIssues}</div>
                      <div className="text-sm text-muted-foreground">Avisos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance da semana */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance da Semana</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Verificações executadas</span>
                      <span className="font-medium">{stats.lastWeek.checksRun}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Problemas encontrados</span>
                      <span className="font-medium text-red-600">{stats.lastWeek.issuesFound}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Problemas corrigidos</span>
                      <span className="font-medium text-green-600">{stats.lastWeek.issuesFixed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Taxa de sucesso</span>
                      <span className="font-medium text-blue-600">{stats.lastWeek.successRate}%</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.lastWeek.successRate}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por tipo */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: `${(count / Math.max(...Object.values(stats.byType))) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por categoria */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm">{category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ 
                                width: `${(count / Math.max(...Object.values(stats.byCategory))) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum relatório disponível</h3>
                <p className="text-muted-foreground text-center">
                  Execute algumas verificações para gerar relatórios.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de configuração */}
      <CheckConfigurationModal
        check={selectedCheck}
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        onSave={handleConfigureCheck}
        loading={checksLoading}
      />
    </div>
  );
} 