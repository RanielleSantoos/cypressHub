import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { errorMessage, HubApi, Project } from './hub-api';

function requiredName(control: AbstractControl<string>) {
  return control.value.trim() ? null : { required: true };
}

@Component({
  imports: [DatePipe, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="page-heading">
      <div>
        <h1>Projetos</h1>
        <p>Cadastre e consulte os projetos da sua equipe.</p>
      </div>
    </section>
    <div class="projects-grid">
      <section class="panel project-form" aria-labelledby="create-title">
        <h2 id="create-title">Novo projeto</h2>
        <form [formGroup]="form" #projectForm="ngForm" (ngSubmit)="save(projectForm)">
          <mat-form-field appearance="outline">
            <mat-label>Nome</mat-label>
            <input matInput formControlName="name" maxlength="120" required>
            <mat-error>Informe um nome de até 120 caracteres.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Descrição</mat-label>
            <textarea matInput formControlName="description" maxlength="1000" rows="3"></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>URL do repositório</mat-label>
            <input matInput type="url" formControlName="repositoryUrl" maxlength="2048" placeholder="https://">
            <mat-error>Informe uma URL HTTP ou HTTPS.</mat-error>
          </mat-form-field>
          @if (saveError()) {
            <p class="notice error-notice" role="alert">{{ saveError() }}</p>
          }
          <button mat-flat-button type="submit" [disabled]="saving() || loading()">
            {{ saving() ? 'Cadastrando…' : 'Cadastrar projeto' }}
          </button>
          <div aria-live="polite">
            @if (saved()) { <p class="notice success-notice">Projeto cadastrado.</p> }
          </div>
        </form>
      </section>
      <section class="panel project-list" aria-labelledby="list-title">
        <div class="panel-heading">
          <h2 id="list-title">Projetos cadastrados</h2>
          <button mat-stroked-button type="button" (click)="load()" [disabled]="loading() || saving()">Atualizar</button>
        </div>
        @if (loading()) {
          <p class="empty-state" role="status">Carregando projetos…</p>
        } @else if (listError()) {
          <p class="notice error-notice" role="alert">{{ listError() }}</p>
        } @else if (projects().length === 0) {
          <div class="empty-state">
            <span class="empty-icon folder-icon" aria-hidden="true"></span>
            <h3>Nenhum projeto cadastrado</h3>
            <p>Preencha o formulário para adicionar seu primeiro projeto.</p>
          </div>
        } @else {
          <ul class="project-items">
            @for (project of projects(); track project.id) {
              <li>
                <div class="project-title">
                  <h3>{{ project.name }}</h3>
                  <time [attr.datetime]="project.createdAt">{{ project.createdAt | date:'dd/MM/yyyy' }}</time>
                </div>
                @if (project.description) { <p>{{ project.description }}</p> }
                @if (project.repositoryUrl) {
                  <a [href]="project.repositoryUrl" target="_blank" rel="noopener noreferrer">Abrir repositório</a>
                }
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
})
export class ProjectsComponent {
  private readonly api = inject(HubApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly builder = inject(FormBuilder).nonNullable;

  readonly form = this.builder.group({
    name: ['', [requiredName, Validators.maxLength(120)]],
    description: ['', Validators.maxLength(1000)],
    repositoryUrl: ['', [Validators.pattern(/^\s*(?:https?:\/\/\S+)?\s*$/i), Validators.maxLength(2048)]],
  });

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly listError = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly saved = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.listError.set('');
    this.api.listProjects().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (projects) => this.projects.set(projects),
      error: (error: unknown) => this.listError.set(errorMessage(error, 'Falha ao carregar projetos.')),
    });
  }

  save(projectForm: FormGroupDirective): void {
    if (this.saving() || this.loading()) return;
    this.saved.set(false);
    this.saveError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, description, repositoryUrl } = this.form.getRawValue();
    this.saving.set(true);
    this.form.disable();
    this.api.createProject({
      name: name.trim(),
      description: description.trim() || undefined,
      repositoryUrl: repositoryUrl.trim() || undefined,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.saving.set(false);
        this.form.enable();
      }),
    ).subscribe({
      next: () => {
        projectForm.resetForm();
        this.saved.set(true);
        this.load();
      },
      error: (error: unknown) => this.saveError.set(errorMessage(error, 'Falha ao cadastrar o projeto.')),
    });
  }
}
