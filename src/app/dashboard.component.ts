import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { errorMessage, HubApi } from './hub-api';

type Health = 'checking' | 'ok' | 'error';
type ProjectCount = number | 'loading' | 'error';

@Component({
  imports: [MatButtonModule, RouterLink],
  template: `
    <section class="page-heading">
      <div>
        <h1>Visão geral</h1>
        <p>Projetos cadastrados e disponibilidade da API do Cypress Hub.</p>
      </div>
      <a mat-flat-button routerLink="/projetos">Gerenciar projetos</a>
    </section>

    <div class="grid gap-4 md:grid-cols-3">
      <section class="panel metric" aria-labelledby="projects-label">
        <h2 id="projects-label">Projetos cadastrados</h2>
        <div aria-live="polite">
          @switch (projectCount()) {
            @case ('loading') { <p class="muted">Carregando…</p> }
            @case ('error') {
              <p class="metric-text">Indisponível</p>
              <p class="muted">{{ projectsError() }}</p>
            }
            @default { <p class="metric-value">{{ projectCount() }}</p> }
          }
        </div>
      </section>
      <section class="panel metric" aria-labelledby="api-label">
        <h2 id="api-label">Saúde da API</h2>
        <div aria-live="polite">
          @switch (health()) {
            @case ('ok') { <p class="metric-text status-ok"><span class="status-dot"></span>Operacional</p> }
            @case ('error') { <p class="metric-text status-error"><span class="status-dot"></span>Indisponível</p> }
            @default { <p class="muted">Verificando…</p> }
          }
        </div>
      </section>
      <section class="panel metric" aria-labelledby="runs-label">
        <h2 id="runs-label">Execuções Cypress</h2>
        <p class="metric-text">Indisponível</p>
        <p class="muted">Aguardando integração com o Cypress.</p>
      </section>
    </div>
    <div class="mt-4">
      <button mat-stroked-button type="button" (click)="refresh()"
        [disabled]="health() === 'checking' || projectCount() === 'loading'">Atualizar indicadores</button>
    </div>
  `,
})
export class DashboardComponent {
  private readonly api = inject(HubApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly health = signal<Health>('checking');
  readonly projectCount = signal<ProjectCount>('loading');
  readonly projectsError = signal('');

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.health.set('checking');
    this.projectCount.set('loading');
    this.api.health().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ status }) => this.health.set(status === 'ok' ? 'ok' : 'error'),
      error: () => this.health.set('error'),
    });
    this.api.listProjects().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (projects) => this.projectCount.set(projects.length),
      error: (error: unknown) => {
        this.projectsError.set(errorMessage(error, 'Falha ao consultar os projetos.'));
        this.projectCount.set('error');
      },
    });
  }
}
