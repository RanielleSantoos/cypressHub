import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { WorkspaceComponent } from './workspace.component';

const apiUrl = environment.apiBaseUrl;
const project = { id: 'project', name: 'evologCypress' };
const workspaceUrl = apiUrl + '/projects/' + project.id + '/workspace';
const screens = [
  { id: 'loads', name: 'Cargas', sourceDirectory: 'cypress/e2e/modETMS/Relatorios/cargas', route: null },
  { id: 'routes', name: 'Rotas', sourceDirectory: 'cypress/e2e/modETMS/Cadastros/rotas', route: null },
  { id: 'driver', name: 'Motoristas', sourceDirectory: 'cypress/e2e/modTracking/Cadastros/motoristas', route: null },
];

function setup(section: 'agenda' | 'telas') {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { data: { section, title: section } } } },
    ],
  });
  const fixture = TestBed.createComponent(WorkspaceComponent);
  const http = TestBed.inject(HttpTestingController);
  http.expectOne(apiUrl + '/cypress').flush({ project });
  http.expectOne(workspaceUrl).flush({ screens, tests: [], schedules: [] });
  fixture.detectChanges();
  return { fixture, http };
}

describe('Exploração de telas e agendamentos', () => {
  it('alterna lista e grade mantendo o filtro de módulo', () => {
    const { fixture, http } = setup('telas');
    const view: HTMLElement = fixture.nativeElement;
    fixture.componentInstance.screenModuleFilter.set('folder:modETMS');
    fixture.detectChanges();
    expect(view.querySelectorAll('.screens-grid a')).toHaveLength(2);
    expect(view.textContent).not.toContain('Motoristas');

    view.querySelector<HTMLButtonElement>('[aria-label="Ver em lista"]')!.click();
    fixture.detectChanges();
    expect(view.querySelectorAll('.screens-list a')).toHaveLength(2);
    expect(view.querySelector('[aria-label="Ver em lista"]')?.getAttribute('aria-pressed')).toBe('true');
    http.verify();
  });

  it('permite combinar telas de menus do mesmo módulo no mesmo registro', () => {
    const { fixture, http } = setup('agenda');
    const view: HTMLElement = fixture.nativeElement;
    const component = fixture.componentInstance;
    component.selectScheduleModule('folder:modETMS');
    component.scheduleMenu.set('Relatorios');
    fixture.detectChanges();
    expect(view.querySelectorAll('.screen-choice input')).toHaveLength(1);
    expect(view.querySelector('.screen-choice')?.textContent).toContain('Cargas');
    view.querySelector<HTMLInputElement>('.screen-choice input')!.click();

    component.scheduleMenu.set('Cadastros');
    fixture.detectChanges();
    expect(view.querySelector('.screen-choice')?.textContent).toContain('Rotas');
    view.querySelector<HTMLInputElement>('.screen-choice input')!.click();
    component.scheduleDate = new Date(Date.now() + 3600000).toISOString();
    component.createSchedule();

    const request = http.expectOne({ method: 'POST', url: workspaceUrl + '/schedules' });
    expect(request.request.body.screenIds).toEqual(['loads', 'routes']);
    request.flush({});
    http.expectOne(workspaceUrl).flush({ screens, tests: [], schedules: [] });
    http.verify();
  });
});
