import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Header mobile da aplicação
 * @author Lucas
 *
 * @description
 * Header responsivo com botão de menu para mobile
 *
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.sidebarOpen - Estado do sidebar
 * @param {function} props.setSidebarOpen - Função para controlar o sidebar
 * @returns {JSX.Element} Header mobile renderizado
 */
interface MobileHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function MobileHeader({ sidebarOpen, setSidebarOpen }: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
      <Button
        type="button"
        variant="ghost"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Abrir sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>

      {/* Separador */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Finance</span>
          </div>
        </div>
      </div>
    </div>
  );
} 