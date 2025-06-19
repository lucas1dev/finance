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
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/categories', {
        params: { type: typeFilter || undefined }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao buscar categorias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [typeFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoria excluída com sucesso');
      fetchCategories();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCategory(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'Receita';
      case 'expense':
        return 'Despesa';
      default:
        return type;
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
    };

    try {
      if (selectedCategory) {
        await api.put(`/categories/${selectedCategory.id}`, data);
        toast.success('Categoria atualizada com sucesso');
      } else {
        await api.post('/categories', data);
        toast.success('Categoria criada com sucesso');
      }
      handleDialogClose();
      fetchCategories();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedCategory?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  name="type"
                  className="w-full p-2 border rounded-md"
                  defaultValue={selectedCategory?.type || 'expense'}
                  required
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>
              <Button type="submit">
                {selectedCategory ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            className="w-full p-2 border rounded-md"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{getTypeLabel(category.type)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
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