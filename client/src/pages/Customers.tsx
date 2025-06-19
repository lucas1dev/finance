import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { CustomerForm } from '../components/CustomerForm';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

interface Customer {
  id: number;
  name: string;
  document_type: 'CPF' | 'CNPJ';
  document_number: string;
  email?: string;
  phone?: string;
  address?: string;
}

const formatDocument = (documentNumber: string, documentType: 'CPF' | 'CNPJ') => {
  if (!documentNumber) return '-';
  
  return documentType === 'CPF'
    ? documentNumber.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : documentNumber.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      toast.error(error.response?.data?.message || 'Erro ao buscar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await api.delete(`/customers/${id}`);
      toast.success('Cliente excluído com sucesso');
      fetchCustomers();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleEdit = (customer: Customer) => {
    console.log('Cliente selecionado para edição:', customer);
    const mappedCustomer = {
      ...customer,
      documentType: customer.document_type,
      documentNumber: customer.document_number
    };
    console.log('Cliente mapeado:', mappedCustomer);
    setSelectedCustomer(mappedCustomer as any);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCustomer(null);
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = customer.name?.toLowerCase().includes(searchTermLower) || false;
    const documentMatch = customer.document_number?.includes(searchTerm) || false;
    const emailMatch = customer.email?.toLowerCase().includes(searchTermLower) || false;
    const phoneMatch = customer.phone?.includes(searchTerm) || false;

    return nameMatch || documentMatch || emailMatch || phoneMatch;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleDialogClose();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>Novo Cliente</Button>
          </DialogTrigger>
          <CustomerForm
            key={selectedCustomer?.id || 'new'}
            customer={selectedCustomer || undefined}
            onSuccess={() => {
              handleDialogClose();
              fetchCustomers();
            }}
          />
        </Dialog>
      </div>

      <div className="mb-4">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          type="text"
          placeholder="Buscar por nome ou documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>
                  {formatDocument(customer.document_number, customer.document_type)}
                </TableCell>
                <TableCell>{customer.email || '-'}</TableCell>
                <TableCell>{customer.phone || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(customer)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(customer.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 