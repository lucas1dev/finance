import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, Receipt, Tag, Users, FileText } from 'lucide-react';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              Finance
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Home className="h-5 w-5 mr-2" />
              Dashboard
            </Link>
            <Link
              to="/accounts"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/accounts')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Wallet className="h-5 w-5 mr-2" />
              Contas
            </Link>
            <Link
              to="/transactions"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/transactions')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Receipt className="h-5 w-5 mr-2" />
              Transações
            </Link>
            <Link
              to="/categories"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/categories')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Tag className="h-5 w-5 mr-2" />
              Categorias
            </Link>
            <Link
              to="/customers"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/customers')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Users className="h-5 w-5 mr-2" />
              Clientes
            </Link>
            <Link
              to="/receivables"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/receivables')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <FileText className="h-5 w-5 mr-2" />
              Contas a Receber
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 