import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const activeOptions: IsActiveMatchOptions = {
  paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored',
};

@Component({
  selector: 'hub-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgTemplateOutlet],
  template: `
    <ng-template #brandLogo>
      <span class="brand-logo" aria-hidden="true">
        <span class="brand-asset"></span>
        <span class="brand-lettering"></span>
      </span>
    </ng-template>
    <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <div class="workspace" (keydown.escape)="menuOpen.set(false)">
      <header class="mobile-bar">
        <button class="menu-toggle" type="button" aria-controls="menu-principal" [attr.aria-expanded]="menuOpen()"
          (click)="menuOpen.update(toggle)"><span aria-hidden="true">☰</span> Menu</button>
        <a class="mobile-brand" routerLink="/" aria-label="Cypress Hub, página inicial" (click)="menuOpen.set(false)">
          <ng-container [ngTemplateOutlet]="brandLogo" />
        </a>
      </header>
      @if (menuOpen()) {
        <button class="menu-backdrop" type="button" aria-label="Fechar menu" (click)="menuOpen.set(false)"></button>
      }
      <aside id="menu-principal" class="sidebar" [class.sidebar-open]="menuOpen()">
        <a class="brand" routerLink="/" aria-label="Cypress Hub, página inicial" (click)="menuOpen.set(false)">
          <ng-container [ngTemplateOutlet]="brandLogo" />
        </a>

        <nav aria-label="Navegação principal">
          @for (item of primaryLinks; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" ariaCurrentWhenActive="page"
              [routerLinkActiveOptions]="activeOptions" (click)="menuOpen.set(false)">
              <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>{{ item.label }}
            </a>
          }
          <p class="nav-label">Automação</p>
          @for (item of workspaceLinks; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" ariaCurrentWhenActive="page"
              [routerLinkActiveOptions]="activeOptions" (click)="menuOpen.set(false)">
              <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>{{ item.label }}
            </a>
          }
        </nav>

        <button class="theme-toggle" type="button" (click)="toggleTheme()" [attr.aria-pressed]="dark()">
          <span aria-hidden="true">{{ dark() ? '☀' : '☾' }}</span> {{ dark() ? 'Tema claro' : 'Tema escuro' }}
        </button>
      </aside>
      <div class="workspace-main">
        <main id="conteudo" tabindex="-1" class="content"><router-outlet /></main>
      </div>
    </div>
  `,
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);

  readonly menuOpen = signal(false);
  readonly dark = signal(this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false);
  readonly activeOptions = activeOptions;
  readonly toggle = (open: boolean) => !open;

  readonly primaryLinks = [
    { path: '/', label: 'Dashboard', icon: 'overview-icon' },
    { path: '/projetos', label: 'evologCypress', icon: 'folder-icon' },
  ];

  readonly workspaceLinks = [
    { path: '/testes', label: 'Casos de teste', icon: 'test-icon' },
    { path: '/telas', label: 'Telas', icon: 'screen-icon' },
    { path: '/documentacao', label: 'Documentação', icon: 'document-icon' },
    { path: '/execucoes', label: 'Execuções', icon: 'play-icon' },
    { path: '/agendamentos', label: 'Agendamentos', icon: 'calendar-icon' },
    { path: '/relatorios', label: 'Relatórios', icon: 'report-icon' },
    { path: '/integracoes', label: 'Integrações', icon: 'connection-icon' },
    { path: '/configuracoes', label: 'Configurações', icon: 'settings-icon' },
  ];

  toggleTheme(): void {
    this.dark.update(this.toggle);
    this.document.documentElement.dataset['theme'] = this.dark() ? 'dark' : 'light';
  }
}
