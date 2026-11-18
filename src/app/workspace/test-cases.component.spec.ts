import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { TestCasesComponent } from './test-cases.component';

const apiUrl = environment.apiBaseUrl;
const project = { id: 'project', name: 'evologCypress' };
const workspaceUrl = apiUrl + '/projects/' + project.id + '/workspace';
const screens = [
  { id: 'etms-screen', name: 'Cargas', sourceDirectory: 'cypress/e2e/modETMS/cargas', route: null },
  { id: 'other-screen', name: 'Motoristas', sourceDirectory: 'cypress/e2e/modTracking/cadastros/motoristas', route: null },
];

function setup(screen?: string) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(screen ? { tela: screen } : {}) } } },
    ],
  });
  const fixture = TestBed.createComponent(TestCasesComponent);
  const http = TestBed.inject(HttpTestingController);
  http.expectOne(apiUrl + '/cypress').flush({ project });
  http.expectOne(workspaceUrl + '/screens').flush(screens);
  fixture.detectChanges();
  return { fixture, http };
}

function change(select: HTMLSelectElement, label: string): void {
  const option = [...select.options].find((item) => item.text === label);
  expect(option).toBeDefined();
  select.value = option!.value;
  select.dispatchEvent(new Event('change'));
}

describe('Consulta de casos de teste', () => {
  it('carrega somente o catálogo inicial e consulta os casos após módulo e tela', async () => {
    const { fixture, http } = setup();
    await fixture.whenStable();
    const view: HTMLElement = fixture.nativeElement;
    const [module, screen] = [...view.querySelectorAll('select')];
    expect(module.required).toBe(true);
    expect(screen.required).toBe(true);
    expect(screen.disabled).toBe(true);
    http.expectNone((request) => request.url.endsWith('/tests'));

    change(module, 'ETMS');
    fixture.detectChanges();
    await fixture.whenStable();
    expect([...screen.options].map((option) => option.text)).toEqual(['Selecione a tela', 'Cargas']);
    http.expectNone((request) => request.url.endsWith('/tests'));

    change(screen, 'Cargas');
    http.expectOne(workspaceUrl + '/screens/etms-screen/tests').flush([
      { id: 'case-1', name: 'Consultar carga', screenId: 'etms-screen', specPath: null, specAvailable: true },
    ]);
    fixture.detectChanges();
    expect(view.textContent).toContain('Consultar carga');
    expect(view.querySelectorAll('button')).toHaveLength(0);

    change(module, 'Tracking');
    fixture.detectChanges();
    expect(view.textContent).not.toContain('Consultar carga');
    http.expectNone((request) => request.url.endsWith('/tests'));
    http.verify();
  });

  it('resolve o módulo e consulta a tela quando o usuário abre um cartão', async () => {
    const { fixture, http } = setup('other-screen');
    http.expectOne(workspaceUrl + '/screens/other-screen/tests').flush([]);
    fixture.detectChanges();
    await fixture.whenStable();
    const view: HTMLElement = fixture.nativeElement;
    const [module, screen] = [...view.querySelectorAll('select')];
    expect(module.selectedOptions[0].text).toBe('Tracking');
    expect(screen.selectedOptions[0].text).toBe('Motoristas');
    expect(view.textContent).toContain('Esta tela ainda não tem casos cadastrados.');
    http.verify();
  });
});
