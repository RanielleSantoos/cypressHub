import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { AppComponent } from './app/app.component';

const projectPage = () => import('./app/projects.component').then((module) => module.ProjectsComponent);
const operationsPage = () => import('./app/operations.component').then((module) => module.OperationsComponent);

const routes: Routes = [
  { path: '', title: 'Dashboard | Cypress Hub', loadComponent: () => import('./app/dashboard.component').then((module) => module.DashboardComponent) },
  { path: 'projetos', title: 'Projeto | Cypress Hub', loadComponent: projectPage },
  { path: 'integracoes', title: 'Integrações | Cypress Hub', data: { integrations: true }, loadComponent: projectPage },
  { path: 'agenda', redirectTo: 'agendamentos', pathMatch: 'full' },
  { path: 'testes', title: 'Casos de teste | Cypress Hub', loadComponent: () => import('./app/workspace/test-cases.component').then((module) => module.TestCasesComponent) },
  ...[
    ['agendamentos', 'Agendamentos'],
    ['documentacao', 'Documentação'],
    ['telas', 'Telas'],
  ].map(([path, title]) => ({
    path,
    title: title + ' | Cypress Hub',
    data: { section: path === 'agendamentos' ? 'agenda' : path, title },
    loadComponent: () => import('./app/workspace/workspace.component').then((module) => module.WorkspaceComponent),
  })),
  ...[
    ['execucoes', 'Execuções'],
    ['relatorios', 'Relatórios'],
    ['configuracoes', 'Configurações'],
  ].map(([path, title]) => ({
    path,
    title: title + ' | Cypress Hub',
    data: { title },
    loadComponent: operationsPage,
  })),
  { path: '**', redirectTo: '' },
];

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideRouter(routes)],
}).catch((error: unknown) => console.error(error));
