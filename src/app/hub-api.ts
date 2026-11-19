import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { CreateSchedule, Screen, TestCase, Workspace } from './workspace/workspace.models';

export interface CypressCatalog {
  project: { id: string; name: string };
  configured: boolean;
  specs: number;
  screens: number;
}

export interface CypressReport {
  id: string;
  path: string;
  updatedAt: string;
}

type ApiError = { messages?: string[] };

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Falha ao conectar à API. Verifique se o backend está em execução.';
    const payload = error.error as ApiError | null;
    if (Array.isArray(payload?.messages) && payload.messages.length) return payload.messages.join(' ');
  }
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class HubApi {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiBaseUrl;
  private readonly options = { timeout: 8000 };

  health() {
    return this.http.get<{ status: 'ok' }>(this.url + '/health', this.options);
  }

  cypressCatalog() {
    return this.http.get<CypressCatalog>(this.url + '/cypress', this.options);
  }

  cypressReports() {
    return this.http.get<CypressReport[]>(this.url + '/cypress/reports', this.options);
  }

  reportUrl(id: string): string {
    return this.url + '/cypress/reports/' + encodeURIComponent(id);
  }

  reportDownloadUrl(id: string): string {
    return this.reportUrl(id) + '?download=true';
  }

  syncCatalog() {
    return this.http.post<CypressCatalog>(this.url + '/cypress/sync', {}, { timeout: 20000 });
  }

  workspace(projectId: string) {
    return this.http.get<Workspace>(this.workspaceUrl(projectId), this.options);
  }

  workspaceScreens(projectId: string) {
    return this.http.get<Screen[]>(this.workspaceUrl(projectId) + '/screens', this.options);
  }

  screenTests(projectId: string, screenId: string) {
    const path = '/screens/' + encodeURIComponent(screenId) + '/tests';
    return this.http.get<TestCase[]>(this.workspaceUrl(projectId) + path, this.options);
  }

  createScreen(projectId: string, screen: { name: string; route: string }) {
    return this.http.post(this.workspaceUrl(projectId) + '/screens', screen, this.options);
  }

  createTest(projectId: string, test: { name: string; screenId?: string }) {
    return this.http.post(this.workspaceUrl(projectId) + '/tests', test, this.options);
  }

  createSchedule(projectId: string, schedule: CreateSchedule) {
    return this.http.post(this.workspaceUrl(projectId) + '/schedules', schedule, this.options);
  }

  removeSchedule(projectId: string, id: string) {
    return this.http.delete<void>(this.workspaceUrl(projectId) + '/schedules/' + encodeURIComponent(id), this.options);
  }

  private workspaceUrl(projectId: string): string {
    return this.url + '/projects/' + encodeURIComponent(projectId) + '/workspace';
  }
}
