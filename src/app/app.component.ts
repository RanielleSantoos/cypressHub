import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'hub-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <div class="workspace">
      <aside class="sidebar">
        <a class="brand" routerLink="/" aria-label="Cypress Hub, página inicial">
          <span class="brand-mark" aria-hidden="true">CH</span>
          <span>Cypress Hub</span>
        </a>
        <nav aria-label="Navegação principal">
          <a routerLink="/" routerLinkActive="active" ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }">
            <span class="nav-icon overview-icon" aria-hidden="true"></span>Visão geral
          </a>
          <a routerLink="/projetos" routerLinkActive="active" ariaCurrentWhenActive="page">
            <span class="nav-icon folder-icon" aria-hidden="true"></span>Projetos
          </a>
        </nav>
      </aside>
      <div class="workspace-main">
        <header class="topbar">
          <span class="topbar-title">Área de trabalho</span>
        </header>
        <main id="conteudo" tabindex="-1" class="content"><router-outlet /></main>
      </div>
    </div>
  `,
})
export class AppComponent {}
