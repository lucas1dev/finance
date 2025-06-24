/**
 * Página de Gerenciamento de Permissões
 * Permite visualizar, atribuir e remover permissões de usuários do sistema.
 *
 * @module pages/Permissions
 * @description Interface administrativa para controle de permissões, com filtros, busca, ações e relatórios.
 *
 * @example
 * // Navegação para a página
 * <Link to="/permissions">Permissões</Link>
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle
} from '../components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';

/**
 * Mock de permissões e usuários
 * @typedef {Object} Permission
 * @property {string} id - ID da permissão
 * @property {string} name - Nome da permissão
 * @property {string} description - Descrição da permissão
 *
 * @typedef {Object} UserPermission
 * @property {number} userId - ID do usuário
 * @property {string} userName - Nome do usuário
 * @property {string} email - Email do usuário
 * @property {string[]} permissions - Lista de IDs de permissões atribuídas
 */

// Dados mockados para alinhar com os testes
const mockPermissionStats = {
  totalPermissions: 45,
  totalResources: 12,
  totalRoles: 3,
  permissionsByRole: {
    admin: 45,
    manager: 22,
    user: 8,
  },
  permissionsByResource: {
    users: 4,
    transactions: 4,
    accounts: 4,
    categories: 4,
    customers: 4,
    suppliers: 4,
    investments: 4,
    financings: 4,
    jobs: 4,
    'data-integrity': 2,
    audit: 2,
    permissions: 3,
  },
};

const mockPermissions = [
  { id: 'admin', name: 'Administrador', description: 'Acesso total ao sistema' },
  { id: 'finance', name: 'Financeiro', description: 'Gerencia contas, transações e relatórios financeiros' },
  { id: 'supplier', name: 'Fornecedores', description: 'Gerencia cadastro e contratos de fornecedores' },
  { id: 'audit', name: 'Auditoria', description: 'Visualiza e exporta logs de auditoria' },
  { id: 'user', name: 'Usuários', description: 'Gerencia cadastro e permissões de usuários' },
];

const mockSystemPermissions = {
  users: ['read', 'write', 'delete', 'create'],
  transactions: ['read', 'write', 'delete', 'create'],
  accounts: ['read', 'write', 'delete', 'create'],
  categories: ['read', 'write', 'delete', 'create'],
  customers: ['read', 'write', 'delete', 'create'],
  suppliers: ['read', 'write', 'delete', 'create'],
  investments: ['read', 'write', 'delete', 'create'],
  financings: ['read', 'write', 'delete', 'create'],
  jobs: ['read', 'write', 'execute', 'configure'],
  'data-integrity': ['read', 'execute'],
  audit: ['read', 'write'],
  permissions: ['read', 'write', 'assign'],
};

const mockUsersBase = [
  { userId: 1, name: 'João Silva', email: 'joao.silva@email.com', role: 'admin', permissions: 45 },
  { userId: 2, name: 'Maria Santos', email: 'maria.santos@email.com', role: 'manager', permissions: 22 },
  { userId: 3, name: 'Pedro Costa', email: 'pedro.costa@email.com', role: 'user', permissions: 8 },
  { userId: 4, name: 'Ana Oliveira', email: 'ana.oliveira@email.com', role: 'manager', permissions: 22 },
  { userId: 5, name: 'Carlos Ferreira', email: 'carlos.ferreira@email.com', role: 'user', permissions: 8 },
];

/**
 * Componente principal da página de Permissões
 * @returns {JSX.Element} Página de gerenciamento de permissões
 */
export default function Permissions() {
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState(mockUsersBase);
  const [verifUser, setVerifUser] = useState('');
  const [verifResource, setVerifResource] = useState('');
  const [verifAction, setVerifAction] = useState('');
  const [verifResult, setVerifResult] = useState<string|null>(null);
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  /**
   * Exporta relatório de permissões (mock)
   * @returns {void}
   */
  function handleExport() {
    setLoadingExport(true);
    setTimeout(() => {
      setLoadingExport(false);
      toast.success('Relatório exportado com sucesso');
    }, 900);
  }

  /**
   * Atribui permissão a um usuário (mock)
   * @param {number} userId
   * @returns {void}
   */
  function handleAssign(userId: number) {
    setUsers(prev => prev.map(u => u.userId === userId ? { ...u, permissions: u.permissions + 1 } : u));
    toast.success('Permissão atribuída');
  }

  /**
   * Remove permissão de um usuário (mock)
   * @param {number} userId
   * @returns {void}
   */
  function handleRemove(userId: number) {
    setUsers(prev => prev.map(u => u.userId === userId && u.permissions > 0 ? { ...u, permissions: u.permissions - 1 } : u));
    toast.success('Permissão removida');
  }

  /**
   * Filtro de busca e role para usuários
   */
  const filteredUsers = useMemo(() => {
    let result = users;
    if (roleFilter) result = result.filter(u => u.role === roleFilter);
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
      );
    }
    return result;
  }, [search, users, roleFilter]);

  /**
   * Verifica se o usuário tem permissão (mock)
   * @param {string} userName
   * @param {string} resource
   * @param {string} action
   */
  function handleVerify(userName: string, resource: string, action: string) {
    setLoadingVerify(true);
    setTimeout(() => {
      setLoadingVerify(false);
      // Simulação: admin sempre tem, user nunca tem, manager só para read/write
      const user = users.find(u => u.name === userName);
      let has = false;
      if (user?.role === 'admin') has = true;
      else if (user?.role === 'manager') has = ['read', 'write'].includes(action);
      setVerifResult(has ? 'Permissão concedida' : 'Permissão negada');
    }, 800);
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permissões</h1>
          <p className="text-muted-foreground">Gerencie permissões de usuários e controle de acesso</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(true)} aria-label="Abrir verificação de permissão">Verificar Permissão</Button>
          <Button variant="outline" onClick={handleExport} disabled={loadingExport} aria-label="Exportar relatório">
            {loadingExport ? 'Exportando...' : 'Exportar'}
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total de Permissões</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{mockPermissionStats.totalPermissions}</div>
            <p className="text-xs text-muted-foreground">{mockPermissionStats.totalResources} recursos</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Usuários</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{mockUsersBase.length}</div>
            <p className="text-xs text-muted-foreground">1 administradores</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Roles</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{mockPermissionStats.totalRoles}</div>
            <p className="text-xs text-muted-foreground">admin, manager, user</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Recursos</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{mockPermissionStats.totalResources}</div>
            <p className="text-xs text-muted-foreground">Módulos do sistema</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="check">Verificação</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card">
              <div className="p-4">
                <h2 className="font-semibold text-lg">Permissões por Role</h2>
                <div className="space-y-2 mt-2">
                  {Object.entries(mockPermissionStats.permissionsByRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <Badge variant={role === 'admin' ? 'destructive' : role === 'manager' ? 'default' : 'secondary'}>{role}</Badge>
                      <span className="font-medium">{count} permissões</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card">
              <div className="p-4">
                <h2 className="font-semibold text-lg">Permissões por Recurso</h2>
                <div className="space-y-2 mt-2">
                  {Object.entries(mockPermissionStats.permissionsByResource).map(([resource, count]) => (
                    <div key={resource} className="flex items-center justify-between">
                      <span className="capitalize">{resource}</span>
                      <span className="font-medium">{count} permissões</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="system" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <div className="p-4">
              <h2 className="font-semibold text-lg">Todas as Permissões do Sistema</h2>
              <div className="space-y-4 mt-2">
                {Object.entries(mockSystemPermissions).map(([resource, actions]) => (
                  <div key={resource} className="space-y-1">
                    <h3 className="text-base font-semibold capitalize">{resource}</h3>
                    <div className="flex flex-wrap gap-2">
                      {actions.map(action => (
                        <Badge key={action} variant="outline">{action}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Usuários */}
        <TabsContent value="users" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <div className="p-4">
              <h2 className="font-semibold text-lg">Permissões por Usuário</h2>
              <p className="text-muted-foreground mb-2">{filteredUsers.length} usuários encontrados</p>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input
                  placeholder="Buscar por nome, email ou role..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  data-testid="user-search-input"
                  className="w-full sm:w-80"
                />
                <select
                  className="border rounded p-2 w-full sm:w-48"
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  aria-label="Filtrar por role"
                >
                  <option value="">Todas as roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.userId}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                      <TableCell><span className="font-medium">{user.permissions}</span></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" aria-label={`Atribuir permissão a ${user.name}`} onClick={() => handleAssign(user.userId)}>Atribuir</Button>
                          <Button size="sm" variant="outline" aria-label={`Remover permissão de ${user.name}`} onClick={() => handleRemove(user.userId)} disabled={user.permissions === 0}>Remover</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Verificação */}
        <TabsContent value="check" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <div className="p-4">
              <h2 className="font-semibold text-lg">Verificar Permissão</h2>
              <p className="text-muted-foreground mb-2">Verifique se um usuário tem uma permissão específica</p>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleVerify(verifUser, verifResource, verifAction); }}>
                <div>
                  <label className="block text-sm font-medium mb-1">Usuário</label>
                  <select className="w-full border rounded p-2" value={verifUser} onChange={e => setVerifUser(e.target.value)} required>
                    <option value="">Selecione</option>
                    {users.map(u => (
                      <option key={u.userId}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Recurso</label>
                  <select className="w-full border rounded p-2" value={verifResource} onChange={e => setVerifResource(e.target.value)} required>
                    <option value="">Selecione</option>
                    {Object.keys(mockSystemPermissions).map(resource => (
                      <option key={resource}>{resource}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ação</label>
                  <select className="w-full border rounded p-2" value={verifAction} onChange={e => setVerifAction(e.target.value)} required>
                    <option value="">Selecione</option>
                    <option>read</option>
                    <option>write</option>
                    <option>create</option>
                    <option>delete</option>
                    <option>execute</option>
                    <option>configure</option>
                    <option>assign</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={loadingVerify}>{loadingVerify ? 'Verificando...' : 'Verificar Permissão'}</Button>
              </form>
              <div className="mt-4">
                <h3 className="font-semibold">Resultado da Verificação</h3>
                <p className="text-muted-foreground">{verifResult ? verifResult : 'Nenhuma verificação realizada'}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Verificação Rápida */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Verificação Rápida de Permissão</AlertDialogTitle>
          <p className="text-muted-foreground mb-2">Verifique rapidamente se um usuário tem uma permissão específica</p>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleVerify(verifUser, verifResource, verifAction); setDialogOpen(false); }}>
            <div>
              <label className="block text-sm font-medium mb-1">Usuário</label>
              <select className="w-full border rounded p-2" value={verifUser} onChange={e => setVerifUser(e.target.value)} required>
                <option value="">Selecione</option>
                {users.map(u => (
                  <option key={u.userId}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recurso</label>
              <select className="w-full border rounded p-2" value={verifResource} onChange={e => setVerifResource(e.target.value)} required>
                <option value="">Selecione</option>
                {Object.keys(mockSystemPermissions).map(resource => (
                  <option key={resource}>{resource}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ação</label>
              <select className="w-full border rounded p-2" value={verifAction} onChange={e => setVerifAction(e.target.value)} required>
                <option value="">Selecione</option>
                <option>read</option>
                <option>write</option>
                <option>create</option>
                <option>delete</option>
                <option>execute</option>
                <option>configure</option>
                <option>assign</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loadingVerify}>{loadingVerify ? 'Verificando...' : 'Verificar'}</Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 