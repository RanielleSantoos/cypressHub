import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { environment } from '../environments/environment';
import { ProjectsComponent } from './projects.component';

const url = environment.apiBaseUrl + '/cypress';
const catalog = {
  project: { id: '9700ca86-ea96-4c20-95fb-9522a71f2665', name: 'evologCypress' },
  configured: true,
  specs: 0,
  screens: 0,
};

describe('Integrações do evologCypress', () => {
  it('sincroniza o catálogo da pasta configurada e apresenta a contagem real', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { integrations: true } } } },
      ],
    });
    const fixture = TestBed.createComponent(ProjectsComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne({ method: 'GET', url }).flush(catalog);
    fixture.detectChanges();
    const view: HTMLElement = fixture.nativeElement;
    const button = [...view.querySelectorAll('button')].find((item) => item.textContent?.includes('Sincronizar catálogo'));
    button?.click();
    http.expectOne({ method: 'POST', url: url + '/sync' }).flush({ ...catalog, specs: 126, screens: 110 });
    fixture.detectChanges();
    expect(view.textContent).toContain('evologCypress');
    expect(view.textContent).toContain('Catálogo atualizado com 126 specs disponíveis.');
    http.verify();
  });

  it('indica como configurar a origem antes da sincronização', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { integrations: true } } } },
      ],
    });
    const fixture = TestBed.createComponent(ProjectsComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne({ method: 'GET', url }).flush({ ...catalog, configured: false });
    fixture.detectChanges();
    const view: HTMLElement = fixture.nativeElement;
    expect(view.textContent).toContain('CYPRESS_PROJECT_DIR');
    expect(view.querySelector('button')?.disabled).toBe(true);
    http.verify();
  });
});
