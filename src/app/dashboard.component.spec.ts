import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expect, it } from 'vitest';
import { environment } from '../environments/environment';
import { DashboardComponent } from './dashboard.component';

it('mostra o status da API e diferencia a contagem zero de uma métrica indisponível', () => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  const fixture = TestBed.createComponent(DashboardComponent);
  const http = TestBed.inject(HttpTestingController);
  http.expectOne(environment.apiBaseUrl + '/health').flush({ status: 'ok' });
  http.expectOne(environment.apiBaseUrl + '/projects').flush([]);
  fixture.detectChanges();
  const view: HTMLElement = fixture.nativeElement;
  expect(view.querySelector('.status-ok')?.textContent).toContain('Operacional');
  expect(view.querySelector('.metric-value')?.textContent?.trim()).toBe('0');
  expect(view.textContent).toContain('Aguardando integração com o Cypress.');
  http.verify();
});
