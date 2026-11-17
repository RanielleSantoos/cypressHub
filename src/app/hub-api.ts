import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  repositoryUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProject {
  name: string;
  description?: string;
  repositoryUrl?: string;
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

  listProjects() {
    return this.http.get<Project[]>(this.url + '/projects', this.options);
  }

  createProject(project: CreateProject) {
    return this.http.post<Project>(this.url + '/projects', project, this.options);
  }
}
