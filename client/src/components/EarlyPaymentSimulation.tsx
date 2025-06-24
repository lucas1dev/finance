import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Financing {
  id: number;
  name: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  payment_amount: number;
  amortization_type: 'SAC' | 'Price';
  start_date: string;
  current_balance: number;
}

interface SimulationResult {
  current_balance: number;
  payment_amount: number;
  interest_saved: number;
  new_end_date: string;
  months_reduced: number;
  new_payment_amount: number;
  payment_reduction: number;
}

interface EarlyPaymentSimulationProps {
  financing: Financing;
  onClose: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export function EarlyPaymentSimulation({ financing, onClose }: EarlyPaymentSimulationProps) {
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [preference, setPreference] = useState<'reduce_term' | 'reduce_payment'>('reduce_term');
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Informe um valor válido para o pagamento antecipado');
      return;
    }

    if (paymentAmount > financing.current_balance) {
      toast.error('O valor do pagamento não pode ser maior que o saldo devedor');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post(`/financings/${financing.id}/simulate-early-payment`, {
        payment_amount: paymentAmount,
        preference: preference
      });

      setSimulationResult(response.data);
      toast.success('Simulação realizada com sucesso');
    } catch (error: any) {
      console.error('Erro ao simular pagamento antecipado:', error);
      toast.error(error.response?.data?.message || 'Erro ao realizar simulação');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setPaymentAmount(amount);
  };

  const getPreferenceLabel = (pref: string) => {
    return pref === 'reduce_term' ? 'Reduzir Prazo' : 'Reduzir Parcela';
  };

  return (
    <div className="space-y-6">
      {/* Informações do Financiamento */}
      <Card>
        <CardHeader>
          <CardTitle>Financiamento: {financing.name}</CardTitle>
          <CardDescription>Informações atuais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Saldo Devedor</Label>
              <div className="text-lg font-bold">{formatCurrency(financing.current_balance)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Valor da Parcela</Label>
              <div className="text-lg font-bold">{formatCurrency(financing.payment_amount)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Taxa de Juros</Label>
              <div className="text-lg font-bold">{financing.interest_rate}% a.m.</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Sistema</Label>
              <div className="text-lg font-bold">{financing.amortization_type}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Simulação */}
      <Card>
        <CardHeader>
          <CardTitle>Simulação de Pagamento Antecipado</CardTitle>
          <CardDescription>Configure os parâmetros da simulação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="paymentAmount">Valor do Pagamento Antecipado *</Label>
            <Input
              id="paymentAmount"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => handlePaymentAmountChange(e.target.value)}
              placeholder="0,00"
              max={financing.current_balance}
            />
            <p className="text-sm text-gray-500 mt-1">
              Máximo: {formatCurrency(financing.current_balance)}
            </p>
          </div>

          <div>
            <Label htmlFor="preference">Preferência de Aplicação *</Label>
            <Select
              value={preference}
              onValueChange={(value: 'reduce_term' | 'reduce_payment') => setPreference(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reduce_term">Reduzir Prazo (Manter Parcela)</SelectItem>
                <SelectItem value="reduce_payment">Reduzir Parcela (Manter Prazo)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              {preference === 'reduce_term' 
                ? 'O valor será aplicado para reduzir o prazo do financiamento'
                : 'O valor será aplicado para reduzir o valor das parcelas'
              }
            </p>
          </div>

          <Button
            onClick={handleSimulate}
            disabled={isLoading || !paymentAmount || paymentAmount <= 0}
            className="w-full"
          >
            {isLoading ? 'Simulando...' : 'Realizar Simulação'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado da Simulação */}
      {simulationResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Resultado da Simulação</CardTitle>
            <CardDescription className="text-green-600">
              Preferência: {getPreferenceLabel(preference)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Valor Aplicado</Label>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(simulationResult.payment_amount)}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Juros Economizados</Label>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(simulationResult.interest_saved)}
                  </div>
                </div>

                {preference === 'reduce_term' && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Meses Reduzidos</Label>
                      <div className="text-lg font-bold text-blue-600">
                        {simulationResult.months_reduced} meses
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nova Data de Término</Label>
                      <div className="text-lg font-bold text-blue-600">
                        {formatDate(simulationResult.new_end_date)}
                      </div>
                    </div>
                  </>
                )}

                {preference === 'reduce_payment' && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nova Parcela</Label>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(simulationResult.new_payment_amount)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Redução na Parcela</Label>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(simulationResult.payment_reduction)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Saldo Após Pagamento</Label>
                  <div className="text-lg font-bold text-gray-800">
                    {formatCurrency(simulationResult.current_balance)}
                  </div>
                </div>

                <div className="p-4 bg-blue-100 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Resumo dos Benefícios</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Economia de juros: {formatCurrency(simulationResult.interest_saved)}</li>
                    {preference === 'reduce_term' && (
                      <li>• Prazo reduzido em {simulationResult.months_reduced} meses</li>
                    )}
                    {preference === 'reduce_payment' && (
                      <li>• Parcela reduzida em {formatCurrency(simulationResult.payment_reduction)}</li>
                    )}
                    <li>• Saldo devedor reduzido para {formatCurrency(simulationResult.current_balance)}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
} 