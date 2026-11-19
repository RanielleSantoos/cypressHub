import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CypressReport, HubApi } from './hub-api';
import { PdfReportPreviewComponent } from './pdf-report-preview.component';

@Component({
  imports: [MatButtonModule, MatDialogModule, PdfReportPreviewComponent],
  template: `
    <h2 mat-dialog-title>{{ report.path }}</h2>
    <mat-dialog-content>
      <hub-pdf-report-preview [url]="api.reportUrl(report.id)" />
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button type="button" mat-dialog-close>Fechar</button>
      <a mat-stroked-button [href]="api.reportUrl(report.id)" target="_blank" rel="noopener noreferrer">
        Abrir em nova aba
      </a>
      <a mat-flat-button [href]="api.reportDownloadUrl(report.id)" download>Baixar PDF</a>
    </mat-dialog-actions>
  `,
  styles: `
    h2 { overflow-wrap: anywhere; }
    mat-dialog-actions { column-gap: 4px; }
  `,
})
export class ReportDialogComponent {
  protected readonly report = inject<CypressReport>(MAT_DIALOG_DATA);
  protected readonly api = inject(HubApi);
}
