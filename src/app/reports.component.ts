import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { CypressReport, errorMessage, HubApi } from './hub-api';
import { ReportDialogComponent } from './report-dialog.component';

@Component({
  imports: [DatePipe, MatButtonModule],
  template: `
    <section class="page-heading">
      <div>
        <h1>Relatórios</h1>
        <p>Resultados do evologCypress, incluindo execuções manuais.</p>
      </div>
      <button mat-stroked-button type="button" (click)="refresh()" [disabled]="loading()">Atualizar relatórios</button>
    </section>

    @if (loading()) {
      <p class="panel empty-state" role="status">Carregando relatórios…</p>
    } @else if (error()) {
      <p class="notice error-notice" role="alert">{{ error() }}</p>
    } @else if (reports().length) {
      <ul class="report-grid" aria-label="Relatórios disponíveis">
        @for (report of reports(); track report.id) {
          <li class="report-card">
            <button class="report-open" type="button" aria-haspopup="dialog" (click)="open(report)">
              <span class="report-file-icon" aria-hidden="true">
                <span class="nav-icon document-icon"></span>
              </span>
              <span class="report-details">
                <strong>{{ report.path }}</strong>
                <time [attr.datetime]="report.updatedAt">Atualizado em {{ report.updatedAt | date:'dd/MM/yyyy HH:mm' }}</time>
              </span>
              <span class="report-arrow" aria-hidden="true"></span>
            </button>
            <div class="report-card-actions">
              <a mat-button [href]="api.reportDownloadUrl(report.id)" download
                [attr.aria-label]="'Baixar PDF ' + report.path">Baixar PDF</a>
            </div>
          </li>
        }
      </ul>
    } @else {
      <section class="panel inner-empty">
        <h2>Nenhum relatório encontrado</h2>
        <p>Adicione um PDF a <code>cypress/relatorios</code> e atualize a lista.</p>
      </section>
    }
  `,
  styles: `
    .report-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
      gap: 14px;
    }
    .report-card {
      display: flex;
      flex-direction: column;
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--surface);
    }
    .report-card:focus-within, .report-card:hover { border-color: var(--focus); }
    .report-open {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: start;
      flex: 1;
      gap: 12px;
      width: 100%;
      padding: 16px;
      border-radius: 11px 11px 0 0;
      text-align: start;
      cursor: pointer;
    }
    .report-open:hover { background: var(--subtle); }
    .report-file-icon {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: var(--accent-soft);
      color: var(--accent-text);
    }
    .report-details { display: grid; gap: 5px; overflow-wrap: anywhere; }
    .report-details strong { font-size: 15px; font-weight: 650; }
    .report-details time { color: var(--muted); font-size: 12px; }
    .report-arrow {
      align-self: center;
      width: 7px;
      height: 7px;
      margin-inline-end: 3px;
      border: solid var(--muted);
      border-width: 1.5px 1.5px 0 0;
      transform: rotate(45deg);
    }
    .report-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 2px 8px;
      border-top: 1px solid var(--line);
    }
  `,
})
export class ReportsComponent {
  protected readonly api = inject(HubApi);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly reports = signal<CypressReport[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    this.refresh();
  }

  open(report: CypressReport): void {
    this.dialog.open(ReportDialogComponent, {
      data: report,
      panelClass: 'report-dialog',
      width: 'min(1080px, calc(100vw - 24px))',
      maxWidth: 'none',
      maxHeight: 'calc(100dvh - 24px)',
      autoFocus: 'first-heading',
    });
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.cypressReports().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (reports) => this.reports.set(reports.filter((report) => /\.pdf$/i.test(report.path))),
      error: (error: unknown) => this.error.set(errorMessage(error, 'Falha ao consultar os relatórios.')),
    });
  }
}
