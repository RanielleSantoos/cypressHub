import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CypressCatalog, errorMessage, HubApi } from './hub-api';

@Component({
  imports: [MatButtonModule, RouterLink],
  template: `
    <section class="page-heading">
      <div>
        <h1>{{ integrations ? 'Integrações' : 'Projeto' }}</h1>
        <p>{{ integrations ? 'Sincronize os arquivos Cypress da pasta local.' : 'Consulte o catálogo e a configuração do evologCypress.' }}</p>
      </div>
    </section>

    @if (loading()) {
      <p class="panel empty-state" role="status">Carregando o projeto…</p>
    }
    @if (error()) {
      <p class="notice error-notice" role="alert">{{ error() }}</p>
      @if (!catalog()) { <button mat-stroked-button type="button" (click)="refresh()">Tentar novamente</button> }
    }
    @if (catalog(); as data) {
      <section class="panel workspace-panel">
        <div class="panel-heading">
          <h2>{{ data.project.name }}</h2>
          <span class="state-tag">{{ data.configured ? 'Pasta local configurada' : 'Configuração pendente' }}</span>
        </div>
        <dl class="project-summary">
          <div><dt>Origem</dt><dd>Repositório Cypress local</dd></div>
          <div><dt>Specs disponíveis</dt><dd>{{ data.specs }}</dd></div>
          <div><dt>Telas catalogadas</dt><dd>{{ data.screens }}</dd></div>
        </dl>
        @if (integrations) {
          @if (!data.configured) {
            <p class="muted">Defina <code>CYPRESS_PROJECT_DIR</code> no ambiente do backend e reinicie a API.</p>
          } @else {
            <p class="muted">A sincronização importa os specs em <code>cypress/e2e</code> e agrupa as telas pelas pastas do repositório.</p>
          }
          <div class="actions">
            <button mat-flat-button type="button" (click)="sync()" [disabled]="!data.configured || syncing()">
              {{ syncing() ? 'Sincronizando…' : 'Sincronizar catálogo' }}
            </button>
            <a mat-stroked-button routerLink="/testes">Abrir casos de teste</a>
          </div>
          @if (synced()) { <p class="notice success-notice sync-result" role="status">Catálogo atualizado com {{ data.specs }} specs disponíveis.</p> }
        } @else {
          <div class="actions">
            <a mat-flat-button routerLink="/testes">Abrir casos de teste</a>
            <a mat-stroked-button routerLink="/telas">Ver telas</a>
            <a mat-stroked-button routerLink="/integracoes">Configurar integração</a>
          </div>
        }
      </section>
    }
  `,
})
export class ProjectsComponent {
  private readonly api = inject(HubApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly integrations = inject(ActivatedRoute).snapshot.data['integrations'] === true;
  readonly catalog = signal<CypressCatalog | null>(null);
  readonly loading = signal(true);
  readonly syncing = signal(false);
  readonly synced = signal(false);
  readonly error = signal('');

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.error.set('');
    this.loading.set(true);
    this.api.cypressCatalog().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (catalog) => this.catalog.set(catalog),
      error: (error: unknown) => this.error.set(errorMessage(error, 'Falha ao consultar o projeto.')),
    });
  }

  sync(): void {
    if (this.syncing()) return;
    this.error.set('');
    this.synced.set(false);
    this.syncing.set(true);
    this.api.syncCatalog().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.syncing.set(false)),
    ).subscribe({
      next: (catalog) => {
        this.catalog.set(catalog);
        this.synced.set(true);
      },
      error: (error: unknown) => this.error.set(errorMessage(error, 'Falha ao sincronizar o catálogo.')),
    });
  }
}
