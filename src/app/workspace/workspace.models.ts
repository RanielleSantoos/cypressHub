export interface Screen {
  id: string;
  name: string;
  route: string | null;
  sourceDirectory: string | null;
}

export interface TestCase {
  id: string;
  name: string;
  screenId: string | null;
  specPath: string | null;
  specAvailable: boolean;
}

export type Recurrence = 'ONCE' | 'DAILY' | 'WEEKLY';

export interface CreateSchedule {
  startAt: string;
  recurrence: Recurrence;
  screenIds: string[];
}

export interface Schedule {
  id: string;
  startAt: string;
  recurrence: Recurrence;
  screenId: string | null;
  screenIds: string[];
  testId: string | null;
}

export interface Workspace {
  screens: Screen[];
  tests: TestCase[];
  schedules: Schedule[];
}
