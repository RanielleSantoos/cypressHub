import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription, switchMap } from 'rxjs';
import { errorMessage, HubApi } from '../hub-api';
import { groupScreens, screenMenu } from './screen-groups';
import { Screen, TestCase } from './workspace.models';

@Component({
  imports: [FormsModule, MatButtonModule, RouterLink],
  templateUrl: './test-cases.component.html',
})
export class TestCasesComponent {
  private readonly api = inject(HubApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private projectId = '';
  private caseRequest?: Subscription;

  readonly projectName = signal('');
  readonly screens = signal<Screen[]>([]);
  readonly tests = signal<TestCase[]>([]);
  readonly moduleId = signal<string | null>(null);
  readonly screenId = signal('');
  readonly search = signal('');
  readonly catalogLoading = signal(true);
  readonly casesLoading = signal(false);
  readonly catalogError = signal('');
  readonly casesError = signal('');

  readonly modules = computed(() => groupScreens(this.screens()));
  readonly moduleScreens = computed(() => this.modules().find(({ id }) => id === this.moduleId())?.screens ?? []);
  readonly visibleTests = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('pt-BR');
    return this.tests().filter((test) =>
      [test.name, test.specPath ?? ''].some((value) => value.toLocaleLowerCase('pt-BR').includes(query)),
    );
  });

  constructor() {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.catalogError.set('');
    this.catalogLoading.set(true);
    this.api.cypressCatalog().pipe(
      switchMap(({ project }) => {
        this.projectName.set(project.name);
        this.projectId = project.id;
        return this.api.workspaceScreens(project.id);
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.catalogLoading.set(false)),
    ).subscribe({
      next: (screens) => {
        this.screens.set(screens);
        const screenId = this.route.snapshot.queryParamMap.get('tela');
        const module = this.modules().find((group) => group.screens.some((screen) => screen.id === screenId));
        if (module && screenId) {
          this.moduleId.set(module.id);
          this.selectScreen(screenId);
        }
      },
      error: (error: unknown) => this.catalogError.set(errorMessage(error, 'Falha ao carregar as telas.')),
    });
  }

  selectModule(id: string | null): void {
    this.moduleId.set(id);
    this.selectScreen('');
  }

  screenLabel(screen: Screen): string {
    if (this.moduleScreens().some((other) => other.id !== screen.id && other.name === screen.name)) {
      return [screen.name, screenMenu(screen), screen.route].filter(Boolean).join(' · ');
    }
    return screen.name;
  }

  selectScreen(id: string): void {
    this.caseRequest?.unsubscribe();
    this.screenId.set(this.moduleScreens().some((screen) => screen.id === id) ? id : '');
    this.tests.set([]);
    this.search.set('');
    this.casesError.set('');
    if (!this.screenId()) return;

    this.casesLoading.set(true);
    this.caseRequest = this.api.screenTests(this.projectId, id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.casesLoading.set(false)),
    ).subscribe({
      next: (tests) => this.tests.set(tests),
      error: (error: unknown) => this.casesError.set(errorMessage(error, 'Falha ao consultar os casos da tela.')),
    });
  }
}
