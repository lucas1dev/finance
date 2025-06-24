import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Teste Simples', () => {
  it('deve renderizar um elemento básico', () => {
    render(<div data-testid="test-element">Teste</div>);
    expect(screen.getByTestId('test-element')).toBeInTheDocument();
  });

  it('deve renderizar texto simples', () => {
    render(<span>Olá Mundo</span>);
    expect(screen.getByText('Olá Mundo')).toBeInTheDocument();
  });
}); 