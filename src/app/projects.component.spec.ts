import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../environments/environment';
import { ProjectsComponent } from './projects.component';

const url = environment.apiBaseUrl + '/projects';
const project = {
  id: '8b9dd631-f090-4c6b-b47c-1df279f8b7af',
  name: 'Portal interno',
  description: null,
  repositoryUrl: 'https://git.example.org/equipe/portal',
  createdAt: '2026-11-17T12:00:00.000Z',
  updatedAt: '2026-11-17T12:00:00.000Z',
};

describe('Projetos', () => {
  let fixture: ComponentFixture<ProjectsComponent>;
  let http: HttpTestingController;
  let view: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(ProjectsComponent);
    http = TestBed.inject(HttpTestingController);
    view = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('mostra carregamento e lista vazia', () => {
    expect(view.textContent).toContain('Carregando projetos');
    http.expectOne({ method: 'GET', url }).flush([]);
    fixture.detectChanges();
    expect(view.textContent).toContain('Nenhum projeto cadastrado');
  });

  it('envia o formulário e recarrega a lista com o projeto salvo', () => {
    http.expectOne({ method: 'GET', url }).flush([]);
    fixture.detectChanges();
    const name = view.querySelector<HTMLInputElement>('input[formControlName="name"]')!;
    name.value = ' Portal interno ';
    name.dispatchEvent(new Event('input'));
    const repository = view.querySelector<HTMLInputElement>('input[formControlName="repositoryUrl"]')!;
    repository.value = project.repositoryUrl;
    repository.dispatchEvent(new Event('input'));
    view.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const create = http.expectOne({ method: 'POST', url });
    expect(JSON.parse(create.request.serializeBody() as string)).toEqual({
      name: project.name,
      repositoryUrl: project.repositoryUrl,
    });
    create.flush(project, { status: 201, statusText: 'Created' });
    http.expectOne({ method: 'GET', url }).flush([project]);
    fixture.detectChanges();
    expect(view.textContent).toContain('Projeto cadastrado.');
    expect(view.querySelector('.project-items')?.textContent).toContain(project.name);
    expect(name.value).toBe('');
  });

  it('exibe falha da API e permite repetir a listagem', () => {
    http.expectOne({ method: 'GET', url }).flush({ messages: ['Banco de dados indisponível.'] }, {
      status: 503,
      statusText: 'Service Unavailable',
    });
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('Banco de dados indisponível.');
    view.querySelector<HTMLButtonElement>('.panel-heading button')!.click();
    http.expectOne({ method: 'GET', url }).flush([project]);
    fixture.detectChanges();
    expect(view.querySelector('[role="alert"]')).toBeNull();
    expect(view.querySelector('.project-items')?.textContent).toContain(project.name);
  });
});
