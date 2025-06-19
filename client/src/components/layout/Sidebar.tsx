import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const routes = [
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
    label: 'Transações',
    icon: Receipt,
    href: '/transactions',
  },
  {
    label: 'Configurações',
    icon: Settings,
    href: '/settings',
  },
];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col gap-y-4 bg-background py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Finance
        </h2>
        <div className="space-y-1">
          {routes.map((route) => (
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