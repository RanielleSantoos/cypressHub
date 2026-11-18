import { Screen } from './workspace.models';

export interface ScreenModule {
  id: string;
  name: string;
  screens: Screen[];
}

function menuPart(part: string): string {
  return part.replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/^./u, (letter) => letter.toLocaleUpperCase('pt-BR'));
}

export function screenMenu(screen: Screen): string {
  const folders = screen.sourceDirectory?.split('/').slice(3, -1) ?? [];
  return folders.length ? folders.map(menuPart).join(' › ') : 'Telas do módulo';
}

export function groupScreens(screens: Screen[]): ScreenModule[] {
  const modules = new Map<string, ScreenModule>();
  for (const screen of screens) {
    const folder = screen.sourceDirectory?.split('/')[2];
    const id = folder ? 'folder:' + folder : 'manual';
    const name = folder ? folder.replace(/^mod(?=[A-Z])/, '') : 'Telas cadastradas';
    const module = modules.get(id) ?? { id, name, screens: [] };
    module.screens.push(screen);
    modules.set(id, module);
  }
  return [...modules.values()].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
}

export function groupScreenMenus(screens: Screen[]): { name: string; screens: Screen[] }[] {
  const menus = new Map<string, Screen[]>();
  for (const screen of screens) {
    const name = screenMenu(screen);
    const group = menus.get(name) ?? [];
    group.push(screen);
    menus.set(name, group);
  }
  return [...menus.entries()].sort(([left], [right]) => left.localeCompare(right, 'pt-BR'))
    .map(([name, menuScreens]) => ({ name, screens: menuScreens }));
}
