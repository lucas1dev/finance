import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor monetário no padrão brasileiro (R$ 0,00)
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado
 * @example
 * formatCurrency(1234.56) // 'R$ 1.234,56'
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata uma data no padrão brasileiro (dd/mm/yyyy)
 * @param {string} dateString - Data em formato ISO ou string
 * @returns {string} Data formatada
 * @example
 * formatDate('2024-01-15') // '15/01/2024'
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata um CPF no padrão brasileiro (000.000.000-00)
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado
 * @example
 * formatCPF('12345678900') // '123.456.789-00'
 */
export function formatCPF(cpf: string): string {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Aplica a máscara
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um CNPJ no padrão brasileiro (00.000.000/0000-00)
 * @param {string} cnpj - CNPJ sem formatação
 * @returns {string} CNPJ formatado
 * @example
 * formatCNPJ('12345678000190') // '12.345.678/0001-90'
 */
export function formatCNPJ(cnpj: string): string {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Aplica a máscara
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
