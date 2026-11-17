import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { AppComponent } from './app/app.component';

const routes: Routes = [
  { path: '', title: 'Visão geral | Cypress Hub', loadComponent: () => import('./app/dashboard.component').then((module) => module.DashboardComponent) },
  { path: 'projetos', title: 'Projetos | Cypress Hub', loadComponent: () => import('./app/projects.component').then((module) => module.ProjectsComponent) },
  { path: '**', redirectTo: '' },
];

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideRouter(routes)],
}).catch((error: unknown) => console.error(error));
