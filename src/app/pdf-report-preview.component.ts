import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

@Component({
  selector: 'hub-pdf-report-preview',
  imports: [MatButtonModule],
  template: `
    @if (pageCount() > 1) {
      <nav class="pdf-controls" aria-label="Páginas do PDF">
        <button mat-stroked-button type="button" [disabled]="pageNumber() <= 1" (click)="pageNumber.update(previous)">
          Anterior
        </button>
        <span aria-live="polite">Página {{ pageNumber() }} de {{ pageCount() }}</span>
        <button mat-stroked-button type="button" [disabled]="pageNumber() >= pageCount()" (click)="pageNumber.update(next)">
          Próxima
        </button>
      </nav>
    }
    <section class="pdf-page" aria-label="Visualização do PDF" [attr.aria-busy]="loading()">
      @if (error()) {
        <p class="notice error-notice" role="alert">{{ error() }}</p>
      } @else if (loading()) {
        <p class="empty-state" role="status">Carregando página do PDF…</p>
      }
      <canvas #canvas [hidden]="loading() || !!error()" [attr.aria-label]="'Página ' + pageNumber() + ' do relatório'"></canvas>
    </section>
  `,
  styles: `
    .pdf-controls { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
    .pdf-controls span { color: var(--muted); font-size: 14px; }
    .pdf-page { min-height: 160px; max-height: 72vh; overflow: auto; background: var(--subtle); border: 1px solid var(--line); border-radius: 9px; }
    canvas { max-width: 100%; height: auto; margin: 0 auto; background: #fff; }
    canvas[hidden] { display: none; }
    .pdf-page .notice { margin: 12px; }
  `,
})
export class PdfReportPreviewComponent {
  private readonly dom = inject(DOCUMENT);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly pdf = signal<PDFDocumentProxy | null>(null);

  readonly url = input.required<string>();
  readonly pageNumber = signal(1);
  readonly pageCount = computed(() => this.pdf()?.numPages ?? 0);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly previous = (page: number) => page - 1;
  readonly next = (page: number) => page + 1;

  constructor() {
    effect((onCleanup) => {
      const url = this.url();
      this.pdf.set(null);
      this.pageNumber.set(1);
      this.error.set('');
      this.loading.set(true);

      let active = true;
      let task: PDFDocumentLoadingTask | undefined;
      onCleanup(() => {
        active = false;
        void task?.destroy().catch(() => undefined);
      });
      void import('pdfjs-dist').then(async ({ getDocument, GlobalWorkerOptions }) => {
        if (!active) return;
        GlobalWorkerOptions.workerSrc = new URL('assets/pdfjs/pdf.worker.min.mjs', this.dom.baseURI).href;
        task = getDocument({ url, disableRange: true });
        const pdf = await task.promise;
        if (active) this.pdf.set(pdf);
      }).catch(() => {
        if (!active) return;
        this.error.set('Não foi possível carregar este PDF. Tente abrir em nova aba.');
        this.loading.set(false);
      });
    });

    effect((onCleanup) => {
      const pdf = this.pdf();
      const pageNumber = this.pageNumber();
      const canvas = this.canvas()?.nativeElement;
      if (!pdf || !canvas) return;

      this.error.set('');
      this.loading.set(true);
      let active = true;
      let rendering: RenderTask | undefined;
      onCleanup(() => {
        active = false;
        rendering?.cancel();
      });
      void pdf.getPage(pageNumber).then(async (page) => {
        if (!active) return;
        const ratio = Math.min(this.dom.defaultView?.devicePixelRatio ?? 1, 2);
        const viewport = page.getViewport({ scale: 1.3 * ratio });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${viewport.width / ratio}px`;
        rendering = page.render({ canvas, viewport });
        await rendering.promise;
        if (active) this.loading.set(false);
      }).catch(() => {
        if (!active) return;
        this.error.set('Não foi possível renderizar esta página do PDF.');
        this.loading.set(false);
      });
    });
  }
}
