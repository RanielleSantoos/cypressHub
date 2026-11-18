import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expect, it } from 'vitest';
import { environment } from '../environments/environment';
import { DashboardComponent } from './dashboard.component';

it('mostra a saúde da API e os totais reais do evologCypress', () => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  const fixture = TestBed.createComponent(DashboardComponent);
  const http = TestBed.inject(HttpTestingController);
  http.expectOne(environment.apiBaseUrl + '/health').flush({ status: 'ok' });
  http.expectOne(environment.apiBaseUrl + '/cypress').flush({
    project: { id: '9700ca86-ea96-4c20-95fb-9522a71f2665', name: 'evologCypress' },
    configured: true,
    specs: 126,
    screens: 110,
  });
  fixture.detectChanges();
  const view: HTMLElement = fixture.nativeElement;
  expect(view.querySelector('.status-ok')?.textContent).toContain('Operacional');
  expect([...view.querySelectorAll('.metric-value')].map((value) => value.textContent?.trim())).toEqual(['126', '110']);
  expect(view.textContent).toContain('Aguardando integração com o Cypress.');
  http.verify();
});
