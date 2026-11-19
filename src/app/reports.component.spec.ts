import { OverlayContainer } from '@angular/cdk/overlay';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
import { environment } from '../environments/environment';
import { PdfReportPreviewComponent } from './pdf-report-preview.component';
import { ReportDialogComponent } from './report-dialog.component';
import { ReportsComponent } from './reports.component';

@Component({ selector: 'hub-pdf-report-preview', template: '', host: { '[attr.data-url]': 'url()' } })
class PdfReportPreviewStub {
  readonly url = input.required<string>();
}

it('exibe somente PDFs na grade e abre a prévia e o download do relatório escolhido', () => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  TestBed.overrideComponent(ReportDialogComponent, {
    remove: { imports: [PdfReportPreviewComponent] },
    add: { imports: [PdfReportPreviewStub] },
  });
  const fixture = TestBed.createComponent(ReportsComponent);
  const http = TestBed.inject(HttpTestingController);
  const url = environment.apiBaseUrl + '/cypress/reports';
  http.expectOne(url).flush([
    { id: 'html-id', path: 'index.html', updatedAt: '2026-11-18T13:00:00Z' },
    { id: 'pdf-id', path: 'Registro Inicial Carga.pdf', updatedAt: '2026-11-18T12:00:00Z' },
    { id: 'older-id', path: 'Outro relatório.PDF', updatedAt: '2026-11-18T11:00:00Z' },
  ]);
  fixture.detectChanges();
  const view: HTMLElement = fixture.nativeElement;
  const overlay = TestBed.inject(OverlayContainer).getContainerElement();
  expect(view.querySelector('h1')?.textContent).toBe('Relatórios');
  expect(view.textContent).not.toContain('index.html');
  expect(overlay.querySelector('hub-pdf-report-preview')).toBeNull();

  const cards = view.querySelectorAll('.report-grid li');
  expect(Array.from(cards, (card) => card.querySelector('strong')?.textContent?.trim()))
    .toEqual(['Registro Inicial Carga.pdf', 'Outro relatório.PDF']);
  expect(cards[0].querySelector('a[download]')?.getAttribute('href')).toBe(url + '/pdf-id?download=true');

  cards[1].querySelector('button')!.click();
  TestBed.tick();
  const dialog = overlay.querySelector('[role="dialog"]');
  expect(dialog?.querySelector('h2')?.textContent).toBe('Outro relatório.PDF');
  expect(dialog?.querySelector('hub-pdf-report-preview')?.getAttribute('data-url')).toBe(url + '/older-id');
  expect(dialog?.querySelector('a[download]')?.getAttribute('href')).toBe(url + '/older-id?download=true');
  http.verify();
});
