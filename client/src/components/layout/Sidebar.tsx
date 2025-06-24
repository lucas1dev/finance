import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Settings,
  LogOut,
  Users,
  Building2,
  CreditCard,
  Bell,
  FileText,
  Briefcase,
  Shield,
  ListChecks,
  UserCog,
  FileSearch,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Target,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const userRoutes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    label: 'Contas',
    icon: Wallet,
    href: '/accounts',
  },
  {
    label: 'Categorias',
    icon: ListChecks,
    href: '/categories',
  },
  {
    label: 'Transações',
    icon: Receipt,
    href: '/transactions',
  },
  {
    label: 'Clientes',
    icon: Users,
    href: '/customers',
  },
  {
    label: 'Contas a Receber',
    icon: ArrowDownCircle,
    href: '/receivables',
  },
  {
    label: 'Contas a Pagar',
    icon: ArrowUpCircle,
    href: '/payables',
  },
  {
    label: 'Contas Fixas',
    icon: Calendar,
    href: '/fixed-accounts',
  },
  {
    label: 'Credores',
    icon: Building2,
    href: '/creditors',
  },
  {
    label: 'Financiamentos',
    icon: CreditCard,
    href: '/financings',
  },
  {
    label: 'Investimentos',
    icon: DollarSign,
    href: '/investments',
  },
  {
    label: 'Metas de Investimento',
    icon: Target,
    href: '/investment-goals',
  },
  {
    label: 'Fornecedores',
    icon: Briefcase,
    href: '/suppliers',
  },
  {
    label: 'Pagamentos de Recebíveis',
    icon: DollarSign,
    href: '/receivable-payments',
  },
  {
    label: 'Pagamentos de Pagáveis',
    icon: DollarSign,
    href: '/payable-payments',
  },
  {
    label: 'Permissões',
    icon: Shield,
    href: '/permissions',
  },
  {
    label: 'Configurações',
    icon: Settings,
    href: '/settings',
  },
];

const adminRoutes = [
  {
    label: 'Dashboard Admin',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    label: 'Auditoria',
    icon: FileSearch,
    href: '/admin/audit',
  },
  {
    label: 'Jobs Administrativos',
    icon: ListChecks,
    href: '/admin/jobs',
  },
  {
    label: 'Notificações',
    icon: Bell,
    href: '/admin/notifications',
  },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col gap-y-4 bg-background py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Finance
        </h2>
        <div className="space-y-1">
          {userRoutes.map((route) => (
            <Button
              key={route.href}
              variant={location.pathname === route.href ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                location.pathname === route.href && 'bg-muted'
              )}
              asChild
            >
              <Link to={route.href}>
                <route.icon className="mr-2 h-4 w-4" />
                {route.label}
              </Link>
            </Button>
          ))}
        </div>
        {user?.role === 'admin' && (
          <>
            <div className="my-4 border-t border-muted" />
            <div className="space-y-1">
              <div className="px-4 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Administração
              </div>
              {adminRoutes.map((route) => (
                <Button
                  key={route.href}
                  variant={location.pathname === route.href ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    location.pathname === route.href && 'bg-muted'
                  )}
                  asChild
                >
                  <Link to={route.href}>
                    <route.icon className="mr-2 h-4 w-4" />
                    {route.label}
                  </Link>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-auto px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
} 