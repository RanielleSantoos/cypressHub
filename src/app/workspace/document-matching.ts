import { Screen, TestCase } from './workspace.models';

export interface Requirement {
  text: string;
  screen?: Screen;
  candidate?: TestCase;
}

const stopWords = new Set(['deve', 'usuario', 'quando', 'entao', 'sistema', 'pode', 'para', 'como', 'pelo', 'pela', 'com', 'uma', 'teste']);

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function terms(text: string): Set<string> {
  return new Set(normalize(text).split(/[^a-z0-9]+/).filter((term) => term.length >= 3 && !stopWords.has(term)));
}

export function matchRequirements(source: string, screens: Screen[], tests: TestCase[]): Requirement[] {
  return source.split(/\r?\n/)
    .map((line) => line.trim().replace(/^(?:[-*•]|\d+[.)])\s*/, ''))
    .filter(Boolean)
    .map((text) => {
      const words = terms(text);
      const normalized = normalize(text);
      const screen = screens.find((item) => {
        const name = terms(item.name);
        return name.size > 0 && [...name].every((word) => words.has(word));
      });
      let candidate: TestCase | undefined;
      let best = 0;

      for (const test of tests) {
        if (screen && test.screenId && test.screenId !== screen.id) continue;
        const name = terms(test.name);
        const matches = [...name].filter((word) => words.has(word)).length;
        const literal = test.name.length >= 5 && name.size > 0 && normalized.includes(normalize(test.name));
        const score = literal ? name.size + 1 : matches >= 2 && matches / name.size >= 0.6 ? matches : 0;
        if (score > best) {
          candidate = test;
          best = score;
        }
      }

      return { text, screen, candidate };
    });
}
