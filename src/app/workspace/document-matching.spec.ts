import { describe, expect, it } from 'vitest';
import { matchRequirements } from './document-matching';

const screens = [
  { id: 'loan', name: 'Crédito', route: '/credito', sourceDirectory: null },
  { id: 'other', name: 'Perfil', route: '/perfil', sourceDirectory: null },
];
const tests = [
  { id: 'good', name: 'Exibir saldo atualizado', screenId: 'loan', specPath: null, specAvailable: true },
  { id: 'other', name: 'Exibir saldo atualizado no perfil', screenId: 'other', specPath: null, specAvailable: true },
];

describe('Correspondência de requisitos', () => {
  it('reconhece a tela com ou sem acentos e procura no contexto correto', () => {
    const [match] = matchRequirements('- Exibir saldo atualizado na tela de credito.', screens, tests);
    expect(match.screen?.id).toBe('loan');
    expect(match.candidate?.id).toBe('good');
  });

  it('preserva um requisito sem correspondência e ignora linhas vazias', () => {
    const result = matchRequirements('  \n1. Permitir exportar extrato.\n', screens, tests);
    expect(result).toEqual([{ text: 'Permitir exportar extrato.', screen: undefined, candidate: undefined }]);
  });
});
