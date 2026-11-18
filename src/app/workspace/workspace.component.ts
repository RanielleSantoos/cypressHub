import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Observable, Subscription } from 'rxjs';
import { errorMessage, HubApi } from '../hub-api';
import { matchRequirements, Requirement } from './document-matching';
import { groupScreenMenus, groupScreens } from './screen-groups';
import { Recurrence, Schedule, Workspace } from './workspace.models';

type Section = 'agenda' | 'documentacao' | 'telas';

const descriptions: Record<Section, string> = {
  agenda: 'Planeje as próximas execuções do projeto.',
  documentacao: 'Relacione requisitos a telas e cenários cadastrados.',
  telas: 'Mapeie as telas da aplicação e encontre os testes relacionados.',
};

@Component({
  imports: [DatePipe, FormsModule, MatButtonModule, RouterLink],
  templateUrl: './workspace.component.html',
})
export class WorkspaceComponent {
  private readonly api = inject(HubApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private workspaceRequest?: Subscription;

  readonly section = this.route.snapshot.data['section'] as Section;
  readonly title = this.route.snapshot.data['title'] as string;
  readonly description = descriptions[this.section];
  readonly projectId = signal('');
  readonly projectName = signal('');
  readonly projectLoading = signal(true);
  readonly projectError = signal('');
  readonly workspace = signal<Workspace | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly actionError = signal('');
  readonly success = signal('');
  readonly analyzedText = signal<string | null>(null);
  readonly screenModuleFilter = signal<string | null>(null);
  readonly screenView = signal<'grade' | 'lista'>('grade');
  readonly scheduleModuleId = signal<string | null>(null);
  readonly scheduleMenu = signal<string | null>(null);
  readonly scheduleScreenIds = signal<string[]>([]);

  readonly screenNames = computed(() => new Map(this.workspace()?.screens.map((screen) => [screen.id, screen.name])));
  readonly screenModules = computed(() => groupScreens(this.workspace()?.screens ?? []));
  readonly visibleScreenModules = computed(() => {
    const filter = this.screenModuleFilter();
    return this.screenModules().filter((module) => !filter || module.id === filter);
  });
  readonly visibleScreenCount = computed(() => this.visibleScreenModules().reduce((count, group) => count + group.screens.length, 0));
  readonly scheduleModule = computed(() => this.screenModules().find(({ id }) => id === this.scheduleModuleId()));
  readonly scheduleMenus = computed(() => groupScreenMenus(this.scheduleModule()?.screens ?? []));
  readonly visibleScheduleMenus = computed(() => {
    const filter = this.scheduleMenu();
    return this.scheduleMenus().filter((menu) => !filter || menu.name === filter);
  });
  readonly testsPerScreen = computed(() => {
    const counts = new Map<string, number>();
    for (const test of this.workspace()?.tests ?? []) {
      if (test.screenId) counts.set(test.screenId, (counts.get(test.screenId) ?? 0) + 1);
    }
    return counts;
  });

  readonly requirements = computed(() => {
    const text = this.analyzedText();
    const workspace = this.workspace();
    return text === null || !workspace ? [] : matchRequirements(text, workspace.screens, workspace.tests);
  });

  readonly recurrenceNames: Record<Recurrence, string> = { ONCE: 'Uma vez', DAILY: 'Diária', WEEKLY: 'Semanal' };

  formOpen = false;
  name = '';
  screenRoute = '';
  scheduleDate = '';
  scheduleRecurrence: Recurrence = 'ONCE';
  documentText = '';

  constructor() {
    this.loadProject();
  }

  loadProject(): void {
    this.projectLoading.set(true);
    this.projectError.set('');
    this.api.cypressCatalog().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.projectLoading.set(false)),
    ).subscribe({
      next: ({ project }) => {
        this.projectId.set(project.id);
        this.projectName.set(project.name);
        this.refresh();
      },
      error: (error: unknown) => this.projectError.set(errorMessage(error, 'Falha ao carregar o projeto.')),
    });
  }

  refresh(): void {
    const projectId = this.projectId();
    if (!projectId) return;
    this.workspaceRequest?.unsubscribe();
    this.loading.set(true);
    this.loadError.set('');
    this.workspaceRequest = this.api.workspace(projectId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (workspace) => this.workspace.set(workspace),
      error: (error: unknown) => this.loadError.set(errorMessage(error, 'Falha ao carregar o espaço do projeto.')),
    });
  }

  openForm(): void {
    this.actionError.set('');
    this.success.set('');
    this.name = '';
    this.screenRoute = '';
    this.formOpen = true;
  }

  createTest(requirement: Requirement): void {
    const name = requirement.text.slice(0, 120).trim();
    const screenId = requirement.screen?.id;
    if (!name || this.saving()) return;
    this.mutate(this.api.createTest(this.projectId(), { name, screenId }), 'Teste cadastrado.');
  }

  createScreen(): void {
    const name = this.name.trim();
    const route = this.screenRoute.trim();
    if (!name || !route || this.saving()) return;
    this.mutate(this.api.createScreen(this.projectId(), { name, route }), 'Tela cadastrada.');
  }

  createSchedule(): void {
    const screenIds = this.scheduleScreenIds();
    if (this.saving() || !this.scheduleModule() || !screenIds.length) return;
    const date = new Date(this.scheduleDate);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      this.actionError.set('Informe uma data e hora futuras.');
      return;
    }
    const schedule = { startAt: date.toISOString(), recurrence: this.scheduleRecurrence, screenIds };
    this.mutate(this.api.createSchedule(this.projectId(), schedule), 'Agendamento registrado.', () => {
      this.scheduleDate = '';
      this.scheduleScreenIds.set([]);
    });
  }

  selectScheduleModule(id: string | null): void {
    this.scheduleModuleId.set(id);
    this.scheduleMenu.set(null);
    this.scheduleScreenIds.set([]);
  }

  toggleScheduleScreen(screenId: string, selected: boolean): void {
    this.scheduleScreenIds.update((ids) => {
      if (!selected) return ids.filter((id) => id !== screenId);
      return ids.includes(screenId) ? ids : [...ids, screenId];
    });
  }

  scheduleLabel(schedule: Schedule): string {
    const screenIds = schedule.screenIds ?? [];
    if (screenIds.length) {
      const module = this.screenModules().find((group) => group.screens.some(({ id }) => id === screenIds[0]));
      const name = module?.name ?? 'Telas';
      return name + ' · ' + (screenIds.length === 1 ? '1 tela' : `${screenIds.length} telas`);
    }
    if (schedule.screenId) return this.screenNames().get(schedule.screenId) ?? 'Tela';
    if (schedule.testId) return this.workspace()?.tests.find((test) => test.id === schedule.testId)?.name ?? 'Teste';
    return 'Todos os testes do projeto';
  }

  scheduleScreens(schedule: Schedule): string {
    return (schedule.screenIds ?? []).map((id) => this.screenNames().get(id) ?? 'Tela')
      .sort((first, second) => first.localeCompare(second, 'pt-BR')).join(', ');
  }

  removeSchedule(id: string): void {
    if (this.saving() || !window.confirm('Remover este agendamento?')) return;
    this.mutate(this.api.removeSchedule(this.projectId(), id), 'Agendamento removido.');
  }

  analyze(): void {
    this.actionError.set('');
    this.success.set('');
    this.analyzedText.set(this.documentText);
  }

  private mutate(request: Observable<unknown>, message: string, afterSave?: () => void): void {
    this.saving.set(true);
    this.actionError.set('');
    this.success.set('');
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: () => {
        this.formOpen = false;
        afterSave?.();
        this.success.set(message);
        this.refresh();
      },
      error: (error: unknown) => this.actionError.set(errorMessage(error, 'Falha ao salvar a alteração.')),
    });
  }
}
