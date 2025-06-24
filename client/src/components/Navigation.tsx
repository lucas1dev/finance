import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  Home, 
  Wallet, 
  Receipt, 
  Tag, 
  Users, 
  FileText, 
  Building2, 
  CreditCard,
  TrendingUp,
  Target,
  Settings,
  LogOut,
  Clock,
  Bell,
  Database,
  Shield,
  Calendar
} from 'lucide-react';
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente de navegação usando Sidebar do Shadcn/UI
 * @author Lucas
 *
 * @description
 * Menu de navegação responsivo com ícones e grupos organizados
 *
 * @returns {JSX.Element} Menu de navegação renderizado
 */
export function Navigation() {
  const location = useLocation();
  const { logout, user, loading } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
  };

  // Se ainda está carregando, não renderiza as opções administrativas
  if (loading) {
    return (
      <SidebarMenu key="loading-menu">
        {/* Dashboard */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive('/')}>
            <Link to="/">
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Verifica se deve renderizar as opções administrativas
  const shouldRenderAdmin = user?.role === 'admin';

  // Chave única baseada no usuário para forçar re-renderização
  const menuKey = user ? `menu-${user.id}-${user.role}` : 'menu-no-user';

  return (
    <SidebarMenu key={menuKey}>
      {/* Dashboard */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/')}>
          <Link to="/">
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Gestão Financeira */}
      <SidebarGroup>
        <SidebarGroupLabel>Gestão Financeira</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/accounts')}>
              <Link to="/accounts">
                <Wallet className="h-4 w-4" />
                <span>Contas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/transactions')}>
              <Link to="/transactions">
                <Receipt className="h-4 w-4" />
                <span>Transações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/categories')}>
              <Link to="/categories">
                <Tag className="h-4 w-4" />
                <span>Categorias</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Relacionamentos */}
      <SidebarGroup>
        <SidebarGroupLabel>Relacionamentos</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/customers')}>
              <Link to="/customers">
                <Users className="h-4 w-4" />
                <span>Clientes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/creditors')}>
              <Link to="/creditors">
                <Building2 className="h-4 w-4" />
                <span>Credores</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Receitas e Despesas */}
      <SidebarGroup>
        <SidebarGroupLabel>Receitas e Despesas</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/receivables')}>
              <Link to="/receivables">
                <FileText className="h-4 w-4" />
                <span>Contas a Receber</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/fixed-accounts')}>
              <Link to="/fixed-accounts">
                <Calendar className="h-4 w-4" />
                <span>Contas Fixas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Investimentos e Financiamentos */}
      <SidebarGroup>
        <SidebarGroupLabel>Investimentos e Financiamentos</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/financings')}>
              <Link to="/financings">
                <CreditCard className="h-4 w-4" />
                <span>Financiamentos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/investments')}>
              <Link to="/investments">
                <TrendingUp className="h-4 w-4" />
                <span>Investimentos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/investment-goals')}>
              <Link to="/investment-goals">
                <Target className="h-4 w-4" />
                <span>Metas de Investimento</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Configurações */}
      <SidebarGroup>
        <SidebarGroupLabel>Configurações</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/settings')}>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Administração - só para admin */}
      {shouldRenderAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/dashboard')}>
                <Link to="/admin/dashboard">
                  <Settings className="h-4 w-4" />
                  <span>Dashboard Administrativo</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/users')}>
                <Link to="/admin/users">
                  <Users className="h-4 w-4" />
                  <span>Usuários</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/jobs')}>
                <Link to="/admin/jobs">
                  <Clock className="h-4 w-4" />
                  <span>Jobs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/notifications')}>
                <Link to="/admin/notifications">
                  <Bell className="h-4 w-4" />
                  <span>Notificações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/dataintegrity')}>
                <Link to="/admin/dataintegrity">
                  <Database className="h-4 w-4" />
                  <span>Integridade de Dados</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/admin/audit')}>
                <Link to="/admin/audit">
                  <Shield className="h-4 w-4" />
                  <span>Auditoria</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </SidebarMenu>
  );
} 