import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Calendar,
  ArrowRight,
  Plus,
  Minus,
  ArrowRightLeft,
  CreditCard,
  Wallet
} from 'lucide-react';
import { RecentTransaction } from '../lib/dashboardService';

/**
 * Interface para as props do componente
 */
interface ActivityFeedProps {
  transactions: RecentTransaction[];
  loading?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

/**
 * Função para formatar valores monetários
 * @param value - Valor a ser formatado
 * @returns String formatada em reais
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Função para formatar a data da transação
 * @param dateString - Data em formato string
 * @returns Data formatada
 */
const formatTransactionDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Agora mesmo';
  } else if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  } else if (diffInHours < 48) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

/**
 * Função para obter o ícone baseado no tipo de transação
 * @param type - Tipo da transação
 * @returns Componente de ícone
 */
const getTransactionIcon = (type: RecentTransaction['type']) => {
  switch (type) {
    case 'income':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'expense':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <DollarSign className="h-4 w-4 text-gray-600" />;
  }
};

/**
 * Função para obter a cor baseada no tipo de transação
 * @param type - Tipo da transação
 * @returns Classes CSS para a cor
 */
const getTransactionColor = (type: RecentTransaction['type']) => {
  switch (type) {
    case 'income':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'expense':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

/**
 * Função para obter o ícone da categoria
 * @param category - Nome da categoria
 * @returns Componente de ícone
 */
const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('transferência') || categoryLower.includes('transfer')) {
    return <ArrowRightLeft className="h-3 w-3" />;
  } else if (categoryLower.includes('cartão') || categoryLower.includes('card')) {
    return <CreditCard className="h-3 w-3" />;
  } else if (categoryLower.includes('conta') || categoryLower.includes('account')) {
    return <Wallet className="h-3 w-3" />;
  } else {
    return <DollarSign className="h-3 w-3" />;
  }
};

/**
 * Componente de transação individual
 */
interface TransactionItemProps {
  transaction: RecentTransaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center space-x-3 flex-1">
        <div className={`p-2 rounded-full ${getTransactionColor(transaction.type)}`}>
          {getTransactionIcon(transaction.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {transaction.description}
            </p>
            <Badge variant="outline" className="text-xs">
              {transaction.category}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTransactionDate(transaction.date)}
            </span>
            <span className="text-xs text-gray-500">
              {transaction.account}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${
          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
        }`}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </span>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

/**
 * Componente principal do feed de atividades
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  transactions, 
  loading = false, 
  maxItems = 5,
  onViewAll 
}) => {
  const displayedTransactions = transactions.slice(0, maxItems);
  const hasMoreTransactions = transactions.length > maxItems;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atividades Recentes
            <Badge variant="secondary" className="ml-auto">
              <div className="h-3 w-6 bg-gray-200 rounded animate-pulse"></div>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atividades Recentes
            <Badge variant="secondary" className="ml-auto">
              0
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">Nenhuma atividade recente</p>
            <p className="text-xs mt-1">Suas transações aparecerão aqui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Atividades Recentes
          <Badge variant="secondary" className="ml-auto">
            {transactions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedTransactions.map((transaction) => (
          <TransactionItem 
            key={transaction.id} 
            transaction={transaction} 
          />
        ))}
        
        {hasMoreTransactions && (
          <div className="text-center pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={onViewAll}
            >
              Ver mais {transactions.length - maxItems} atividades
            </Button>
          </div>
        )}
        
        {!hasMoreTransactions && onViewAll && (
          <div className="text-center pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={onViewAll}
            >
              Ver todas as transações
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed; 