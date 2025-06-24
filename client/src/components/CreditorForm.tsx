import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Creditor {
  id?: number;
  name: string;
  documentType: 'CPF' | 'CNPJ';
  documentNumber: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  notes?: string;
}

interface CreditorFormProps {
  creditor?: Creditor;
  onSuccess: () => void;
}

const validateDocument = (documentNumber: string, documentType: 'CPF' | 'CNPJ') => {
  const cleanDocument = documentNumber.replace(/\D/g, '');
  
  if (documentType === 'CPF') {
    if (cleanDocument.length !== 11) return false;
    
    // Validação básica de CPF
    if (/^(\d)\1{10}$/.test(cleanDocument)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanDocument.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanDocument.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanDocument.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanDocument.charAt(10))) return false;
    
    return true;
  } else {
    // Validação básica de CNPJ
    if (cleanDocument.length !== 14) return false;
    
    if (/^(\d)\1{13}$/.test(cleanDocument)) return false;
    
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleanDocument.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleanDocument.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return digit1 === parseInt(cleanDocument.charAt(12)) && 
           digit2 === parseInt(cleanDocument.charAt(13));
  }
};

const formatDocument = (documentNumber: string, documentType: 'CPF' | 'CNPJ') => {
  const cleanDocument = documentNumber.replace(/\D/g, '');
  
  if (documentType === 'CPF') {
    return cleanDocument.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else {
    return cleanDocument.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
};

export function CreditorForm({ creditor, onSuccess }: CreditorFormProps) {
  const [formData, setFormData] = useState<Creditor>({
    name: '',
    documentType: 'CPF',
    documentNumber: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (creditor) {
      setFormData({
        id: creditor.id,
        name: creditor.name,
        documentType: creditor.documentType,
        documentNumber: creditor.documentNumber,
        email: creditor.email || '',
        phone: creditor.phone || '',
        address: creditor.address || '',
        contact_person: creditor.contact_person || '',
        notes: creditor.notes || '',
      });
    }
  }, [creditor]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = 'Documento é obrigatório';
    } else if (!validateDocument(formData.documentNumber, formData.documentType)) {
      newErrors.documentNumber = `CPF/CNPJ inválido`;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const formattedDocument = formatDocument(formData.documentNumber, formData.documentType);
      
      const payload = {
        name: formData.name.trim(),
        document_type: formData.documentType,
        document_number: formattedDocument,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        contact_person: formData.contact_person?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      if (creditor?.id) {
        await api.put(`/creditors/${creditor.id}`, payload);
        toast.success('Credor atualizado com sucesso');
      } else {
        await api.post('/creditors', payload);
        toast.success('Credor criado com sucesso');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar credor:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao salvar credor';
      toast.error(errorMessage);
      
      // Exibir erros específicos do backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Creditor, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDocumentChange = (value: string) => {
    // Remover caracteres não numéricos
    const cleanValue = value.replace(/\D/g, '');
    handleInputChange('documentNumber', cleanValue);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {creditor ? 'Editar Credor' : 'Novo Credor'}
        </DialogTitle>
        <DialogDescription>
          {creditor 
            ? 'Atualize as informações do credor'
            : 'Preencha as informações do novo credor'
          }
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Nome do credor"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="documentType">Tipo de Documento *</Label>
            <Select
              value={formData.documentType}
              onValueChange={(value: 'CPF' | 'CNPJ') => handleInputChange('documentType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="documentNumber">Documento *</Label>
            <Input
              id="documentNumber"
              value={formData.documentNumber}
              onChange={(e) => handleDocumentChange(e.target.value)}
              placeholder={formData.documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
              maxLength={formData.documentType === 'CPF' ? 11 : 14}
              className={errors.documentNumber ? 'border-red-500' : ''}
            />
            {errors.documentNumber && <p className="text-red-500 text-sm mt-1">{errors.documentNumber}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="contact_person">Pessoa de Contato</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => handleInputChange('contact_person', e.target.value)}
            placeholder="Nome da pessoa de contato"
          />
        </div>

        <div>
          <Label htmlFor="address">Endereço</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Endereço completo"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Observações adicionais"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? 'Salvando...' : (creditor ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
} 