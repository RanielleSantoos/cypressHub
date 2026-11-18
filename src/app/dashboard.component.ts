import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CypressCatalog, HubApi } from './hub-api';

@Component({
  imports: [MatButtonModule, RouterLink],
  template: `
    <section class="page-heading">
      <div>
        <h1>Dashboard</h1>
        <p>Catálogo e operação do projeto evologCypress.</p>
      </div>
      <a mat-flat-button routerLink="/integracoes">Abrir Integrações</a>
    </section>

    <div class="metric-grid" aria-label="Indicadores do projeto">
      <section class="panel metric">
        <h2>Specs disponíveis</h2>
        @if (catalog(); as data) { <p class="metric-value">{{ data.specs }}</p> }
        @else { <p class="metric-text">{{ catalogLoading() ? 'Carregando…' : 'Indisponível' }}</p> }
      </section>
      <section class="panel metric">
        <h2>Telas catalogadas</h2>
        @if (catalog(); as data) { <p class="metric-value">{{ data.screens }}</p> }
        @else { <p class="metric-text">{{ catalogLoading() ? 'Carregando…' : 'Indisponível' }}</p> }
      </section>
      <section class="panel metric">
        <h2>Saúde da API</h2>
        <div aria-live="polite">
          @switch (health()) {
            @case ('ok') { <p class="metric-text status-ok"><span class="status-dot"></span>Operacional</p> }
            @case ('error') { <p class="metric-text status-error"><span class="status-dot"></span>Indisponível</p> }
            @default { <p class="muted">Verificando…</p> }
          }
        </div>
      </section>
    </div>

    <section class="panel recent-projects">
      <div class="panel-heading">
        <h2>Últimas execuções</h2>
        <a mat-stroked-button routerLink="/execucoes">Ver execuções</a>
      </div>
      <div class="inner-empty">
        <h3>Aguardando integração com o Cypress.</h3>
        <p>O histórico será preenchido a partir dos resultados do worker.</p>
      </div>
    </section>
    <div class="mt-4">
      <button mat-stroked-button type="button" (click)="refresh()"
        [disabled]="health() === 'checking' || catalogLoading()">Atualizar indicadores</button>
    </div>
  `,
})
export class DashboardComponent {
  private readonly api = inject(HubApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly health = signal<'checking' | 'ok' | 'error'>('checking');
  readonly catalogLoading = signal(true);
  readonly catalog = signal<CypressCatalog | null>(null);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.health.set('checking');
    this.catalogLoading.set(true);
    this.api.health().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ status }) => this.health.set(status === 'ok' ? 'ok' : 'error'),
      error: () => this.health.set('error'),
    });
    this.api.cypressCatalog().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.catalogLoading.set(false)),
    ).subscribe({
      next: (catalog) => this.catalog.set(catalog),
      error: () => this.catalog.set(null),
    });
  }
}
