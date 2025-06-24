import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

/**
 * Props para o componente ChartWrapper
 */
interface ChartWrapperProps {
  /** Título do gráfico */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Estado de carregamento */
  loading?: boolean;
  /** Estado de erro */
  error?: string | null;
  /** Conteúdo do gráfico */
  children: React.ReactNode;
  /** Classes CSS adicionais */
  className?: string;
  /** Altura do gráfico */
  height?: string;
  /** Se o gráfico é responsivo */
  responsive?: boolean;
}

/**
 * Wrapper genérico para todos os gráficos com responsividade, loading states e error handling.
 * @param props - Propriedades do componente
 * @returns Componente de gráfico com wrapper
 * @example
 * <ChartWrapper title="Receitas vs Despesas" loading={isLoading} error={error}>
 *   <LineChart data={chartData} />
 * </ChartWrapper>
 */
export function ChartWrapper({
  title,
  subtitle,
  loading = false,
  error = null,
  children,
  className = '',
  height = '300px',
  responsive = true
}: ChartWrapperProps) {
  return (
    <Card className={`${className} ${responsive ? 'w-full' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </CardTitle>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading && (
          <div 
            className="flex items-center justify-center"
            style={{ height }}
          >
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Carregando dados...</p>
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {!loading && !error && (
          <div 
            className="w-full"
            style={{ height }}
          >
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 