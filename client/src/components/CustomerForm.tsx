import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Checkbox } from './ui/checkbox';

const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  documentType: z.enum(['CPF', 'CNPJ'], {
    required_error: 'Tipo de documento é obrigatório',
  }),
  documentNumber: z.string().min(1, 'Número do documento é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  types: z.array(z.enum(['customer', 'supplier'])).min(1, 'Selecione pelo menos um tipo'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: {
    id: number;
    name: string;
    document_type: 'CPF' | 'CNPJ';
    document_number: string;
    email?: string;
    phone?: string;
    address?: string;
    types?: { type: 'customer' | 'supplier' }[];
  };
  onSuccess?: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  console.log('CustomerForm - customer recebido:', customer);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      name: customer.name,
      documentType: customer.document_type,
      documentNumber: customer.document_number,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      types: customer.types?.map(t => t.type) || ['customer'],
    } : {
      name: '',
      documentType: 'CPF',
      documentNumber: '',
      email: '',
      phone: '',
      address: '',
      types: ['customer'],
    },
  });

  // Resetar o formulário quando o customer mudar
  React.useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        documentType: customer.document_type,
        documentNumber: customer.document_number,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        types: customer.types?.map(t => t.type) || ['customer'],
      });
    } else {
      reset({
        name: '',
        documentType: 'CPF',
        documentNumber: '',
        email: '',
        phone: '',
        address: '',
        types: ['customer'],
      });
    }
  }, [customer, reset]);

  const documentType = watch('documentType');
  const selectedTypes = watch('types');

  const formatDocument = (document: string) => {
    return document.replace(/[^\d]/g, '');
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsLoading(true);

      const formattedData = {
        ...data,
        documentNumber: formatDocument(data.documentNumber),
      };

      if (customer) {
        await api.put(`/customers/${customer.id}`, formattedData);
        toast.success('Cliente atualizado com sucesso');
      } else {
        await api.post('/customers', formattedData);
        toast.success('Cliente criado com sucesso');
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (type: 'customer' | 'supplier', checked: boolean) => {
    const currentTypes = selectedTypes || [];
    if (checked) {
      setValue('types', [...currentTypes, type]);
    } else {
      setValue('types', currentTypes.filter(t => t !== type));
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{customer ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        <DialogDescription>
          {customer ? 'Atualize as informações do cliente.' : 'Preencha as informações para cadastrar um novo cliente.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Nome do cliente"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="documentType">Tipo de Documento</Label>
            <Select
              defaultValue={documentType}
              onValueChange={(value) => setValue('documentType', value as 'CPF' | 'CNPJ')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
            {errors.documentType && (
              <p className="text-sm text-red-500">{errors.documentType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentNumber">
              {documentType === 'CPF' ? 'CPF' : 'CNPJ'}
            </Label>
            <Input
              id="documentNumber"
              {...register('documentNumber')}
              placeholder={documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
            />
            {errors.documentNumber && (
              <p className="text-sm text-red-500">{errors.documentNumber.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customer"
                checked={selectedTypes?.includes('customer')}
                onCheckedChange={(checked: boolean) => handleTypeChange('customer', checked)}
              />
              <Label htmlFor="customer">Cliente</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="supplier"
                checked={selectedTypes?.includes('supplier')}
                onCheckedChange={(checked: boolean) => handleTypeChange('supplier', checked)}
              />
              <Label htmlFor="supplier">Fornecedor</Label>
            </div>
          </div>
          {errors.types && (
            <p className="text-sm text-red-500">{errors.types.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="(00) 00000-0000"
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Textarea
            id="address"
            {...register('address')}
            placeholder="Endereço completo"
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : customer ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </form>
    </DialogContent>
  );
} 