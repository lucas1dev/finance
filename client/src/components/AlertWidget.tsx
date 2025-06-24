import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  X,
  Bell,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';
import { DashboardAlert } from '../lib/dashboardService';

/**
 * Interface para as props do componente
 */
interface AlertWidgetProps {
  alerts: DashboardAlert[];
  loading?: boolean;
  onMarkAsRead?: (alertId: number) => void;
  maxAlerts?: number;
}

/**
 * Função para obter o ícone baseado no tipo de alerta
 * @param type - Tipo do alerta
 * @returns Componente de ícone
 */
const getAlertIcon = (type: DashboardAlert['type']) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'error':
      return <XCircle className="h-4 w-4" />;
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    case 'info':
      return <Info className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

/**
 * Função para obter a cor baseada no tipo de alerta
 * @param type - Tipo do alerta
 * @returns Classes CSS para a cor
 */
const getAlertColor = (type: DashboardAlert['type']) => {
  switch (type) {
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    case 'error':
      return 'border-red-200 bg-red-50 text-red-800';
    case 'success':
      return 'border-green-200 bg-green-50 text-green-800';
    case 'info':
      return 'border-blue-200 bg-blue-50 text-blue-800';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-800';
  }
};

/**
 * Função para obter a cor do badge de prioridade
 * @param priority - Prioridade do alerta
 * @returns Classes CSS para a cor do badge
 */
const getPriorityColor = (priority: DashboardAlert['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

/**
 * Função para formatar a data do alerta
 * @param dateString - Data em formato string
 * @returns Data formatada
 */
const formatAlertDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Agora mesmo';
  } else if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  }
};

/**
 * Componente de alerta individual
 */
interface AlertItemProps {
  alert: DashboardAlert;
  onMarkAsRead?: (alertId: number) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onMarkAsRead }) => {
  return (
    <Alert className={`${getAlertColor(alert.type)} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getAlertIcon(alert.type)}
          <div className="flex-1">
            <AlertTitle className="flex items-center gap-2">
              {alert.title}
              <Badge 
                variant="secondary" 
                className={`text-xs ${getPriorityColor(alert.priority)}`}
              >
                {alert.priority === 'high' ? 'Alta' : 
                 alert.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              {alert.message}
            </AlertDescription>
            <div className="mt-2 text-xs opacity-75">
              {formatAlertDate(alert.date)}
            </div>
          </div>
        </div>
        {onMarkAsRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkAsRead(alert.id)}
            className="ml-2 h-6 w-6 p-0 hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

/**
 * Componente principal de alertas
 */
export const AlertWidget: React.FC<AlertWidgetProps> = ({ 
  alerts, 
  loading = false, 
  onMarkAsRead,
  maxAlerts = 5 
}) => {
  const displayedAlerts = alerts.slice(0, maxAlerts);
  const hasMoreAlerts = alerts.length > maxAlerts;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas
            <Badge variant="secondary" className="ml-auto">
              <div className="h-3 w-6 bg-gray-200 rounded animate-pulse"></div>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas
            <Badge variant="secondary" className="ml-auto">
              0
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-sm">Nenhum alerta pendente</p>
            <p className="text-xs mt-1">Tudo está em ordem!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertas
          <Badge variant="secondary" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedAlerts.map((alert) => (
          <AlertItem 
            key={alert.id} 
            alert={alert} 
            onMarkAsRead={onMarkAsRead}
          />
        ))}
        
        {hasMoreAlerts && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" className="text-xs">
              Ver mais {alerts.length - maxAlerts} alertas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertWidget; 