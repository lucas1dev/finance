/**
 * Testes unitários para o validador de documentos (CPF e CNPJ).
 * @author Lucas Santos
 */
const { validateCPF, validateCNPJ } = require('../../utils/documentValidator');

describe('Document Validator', () => {
  describe('validateCPF', () => {
    it('deve validar um CPF válido', () => {
      expect(validateCPF('529.982.247-25')).toBe(true);
    });
    it('deve invalidar um CPF inválido', () => {
      expect(validateCPF('123.456.789-00')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('deve validar um CNPJ válido', () => {
      expect(validateCNPJ('45.723.174/0001-10')).toBe(true);
    });
    it('deve invalidar um CNPJ inválido', () => {
      expect(validateCNPJ('12.345.678/0001-00')).toBe(false);
    });
  });
}); 