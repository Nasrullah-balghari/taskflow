import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { ToastService } from './toast.service';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest, ActivityEvent } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly authService = inject(AuthService);
  private readonly storage     = inject(StorageService);
  private readonly toast       = inject(ToastService);

  private readonly _tasks       = signal<Task[]>([]);
  private readonly _activityLog = signal<ActivityEvent[]>([]);

  /** Read-only signals — components subscribe to these, never write to them. */
  readonly tasks       = this._tasks.asReadonly();
  readonly activityLog = this._activityLog.asReadonly();

  private _seeding = false;

  // ── Computed signals ──────────────────────────────────────────────────────

  readonly totalCount = computed(() => this.tasks().length);

  readonly completedCount = computed(() =>
    this.tasks().filter(t => t.completed).length
  );

  /** Incomplete tasks that are not yet overdue (no dueDate counts as pending). */
  readonly pendingCount = computed(() => {
    const today = this.getTodayISO();
    return this.tasks().filter(t =>
      !t.completed && (!t.dueDate || t.dueDate >= today)
    ).length;
  });

  /** Incomplete tasks whose dueDate has already passed. */
  readonly overdueCount = computed(() => {
    const today = this.getTodayISO();
    return this.tasks().filter(t =>
      !t.completed && !!t.dueDate && t.dueDate < today
    ).length;
  });

  readonly highPriorityCount = computed(() =>
    this.tasks().filter(t => t.priority === 'high' && !t.completed).length
  );

  /** Incomplete tasks due today, sorted by dueTime ascending (no time → end). */
  readonly todaysTasks = computed(() => {
    const today = this.getTodayISO();
    return this.tasks()
      .filter(t => t.dueDate === today && !t.completed)
      .sort((a, b) => {
        if (!a.dueTime && !b.dueTime) return 0;
        if (!a.dueTime) return 1;
        if (!b.dueTime) return -1;
        return a.dueTime.localeCompare(b.dueTime);
      });
  });

  /** Incomplete tasks due after today, sorted by dueDate ascending. */
  readonly upcomingTasks = computed(() => {
    const today = this.getTodayISO();
    return this.tasks()
      .filter(t => !!t.dueDate && t.dueDate > today && !t.completed)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
  });

  /** All tasks grouped by status — for Board View. */
  readonly statusGroups = computed(() => {
    const all = this.tasks();
    return {
      todo:       all.filter(t => t.status === 'todo'),
      inProgress: all.filter(t => t.status === 'in-progress'),
      done:       all.filter(t => t.status === 'done'),
    };
  });

  // ── Effects ───────────────────────────────────────────────────────────────

  constructor() {
    // EFFECT 1 — Load the correct task list whenever the logged-in user changes.
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        const stored = this.storage.get<Task[]>(`tasks:${user.id}`, []);
        this._tasks.set(stored);
        if (stored.length === 0) {
          this.seedDemoData();
        }
      } else {
        this._tasks.set([]);
      }
    }, { allowSignalWrites: true });

    // EFFECT 2 — Auto-persist tasks to LocalStorage whenever the list changes.
    effect(() => {
      const user         = this.authService.currentUser();
      const currentTasks = this._tasks();
      if (user) {
        this.storage.set(`tasks:${user.id}`, currentTasks);
      }
    });

    // EFFECT 3 — Load activity log for the current user.
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        const stored = this.storage.get<ActivityEvent[]>(`activity:${user.id}`, []);
        this._activityLog.set(stored);
      } else {
        this._activityLog.set([]);
      }
    }, { allowSignalWrites: true });

    // EFFECT 4 — Auto-persist activity log whenever it changes.
    effect(() => {
      const user = this.authService.currentUser();
      const log  = this._activityLog();
      if (user) {
        this.storage.set(`activity:${user.id}`, log);
      }
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  createTask(request: CreateTaskRequest): Task | null {
    const user = this.authService.currentUser();
    if (!user) return null;

    const now: string = new Date().toISOString();

    const newTask: Task = {
      id:          crypto.randomUUID(),
      userId:      user.id,
      title:       request.title,
      description: request.description,
      completed:   false,
      priority:    request.priority,
      status:      'todo',
      categoryId:  request.categoryId,
      dueDate:     request.dueDate,
      dueTime:     request.dueTime,
      createdAt:   now,
      updatedAt:   now,
    };

    this._tasks.update(prev => [...prev, newTask]);

    if (!this._seeding) {
      this.toast.success('Task created', { message: newTask.title });
      this.logActivity('created', newTask.title, newTask.categoryId);
    }

    return newTask;
  }

  updateTask(id: string, updates: UpdateTaskRequest): Task | null {
    const updated = this._applyUpdate(id, updates);
    if (updated) {
      this.toast.success('Task updated', { message: updated.title });
    }
    return updated;
  }

  deleteTask(id: string): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;

    const existing = this._tasks().find(t => t.id === id);
    if (!existing || existing.userId !== user.id) return false;

    this._tasks.update(prev => prev.filter(t => t.id !== id));
    this.toast.error('Task deleted', { message: existing.title });
    this.logActivity('deleted', existing.title);
    return true;
  }

  toggleComplete(id: string): Task | null {
    const task = this.getTaskById(id);
    if (!task) return null;

    const updated = this._applyUpdate(id, { completed: !task.completed });
    if (updated?.completed) {
      this.toast.success('Task completed', { message: updated.title, duration: 2500 });
      this.logActivity('completed', updated.title, updated.categoryId);
    }
    return updated;
  }

  moveTaskToStatus(id: string, status: TaskStatus): Task | null {
    const updated = this._applyUpdate(id, { status, completed: status === 'done' });
    if (updated) {
      const labels: Record<TaskStatus, string> = {
        'todo':        'To Do',
        'in-progress': 'In Progress',
        'done':        'Done',
      };
      this.toast.info(`Moved to ${labels[status]}`, { message: updated.title, duration: 2500 });
    }
    return updated;
  }

  /** Returns a single task by ID, or undefined if it doesn't exist. */
  getTaskById(id: string): Task | undefined {
    return this._tasks().find(t => t.id === id);
  }

  /** Clears all tasks for the current user from memory and storage. */
  clearAllTasks(): void {
    const user = this.authService.currentUser();
    this._tasks.set([]);
    if (user) {
      this.storage.remove(`tasks:${user.id}`);
    }
  }

  /**
   * Applies a partial update without firing a toast.
   * Used internally by toggleComplete, moveTaskToStatus, and CategoryService
   * so those callers can control their own toast messaging.
   */
  updateTaskSilent(id: string, updates: UpdateTaskRequest): Task | null {
    return this._applyUpdate(id, updates);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _applyUpdate(id: string, updates: UpdateTaskRequest): Task | null {
    const user = this.authService.currentUser();
    if (!user) return null;

    const existing = this._tasks().find(t => t.id === id);
    if (!existing || existing.userId !== user.id) return null;

    const now: string = new Date().toISOString();

    let completedAt: number | undefined = existing.completedAt;
    if (updates.completed === true && !existing.completed) {
      completedAt = Date.now();
    } else if (updates.completed === false) {
      completedAt = undefined;
    }

    const updatedTask: Task = {
      ...existing,
      ...updates,
      updatedAt: now,
      completedAt,
    };

    this._tasks.update(prev => prev.map(t => t.id === id ? updatedTask : t));
    return updatedTask;
  }

  private logActivity(type: ActivityEvent['type'], taskTitle: string, categoryId?: string): void {
    const event: ActivityEvent = {
      id:        crypto.randomUUID(),
      type,
      taskTitle,
      categoryId,
      timestamp: Date.now(),
    };
    this._activityLog.update(prev => [event, ...prev].slice(0, 20));
  }

  private seedDemoData(): void {
    const today    = this.getTodayISO();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    const demos: CreateTaskRequest[] = [
      {
        title:       'Review marketing campaign assets',
        priority:    'high',
        dueDate:     today,
        dueTime:     '09:00',
        description: 'Q4 campaign needs sign-off before launch',
      },
      {
        title:       'Client sync for Project Horizon',
        priority:    'medium',
        dueDate:     today,
        dueTime:     '11:30',
        description: 'Weekly status update',
      },
      {
        title:       'Update technical documentation',
        priority:    'low',
        dueDate:     today,
        dueTime:     '14:00',
        description: 'API endpoints need versioning notes',
      },
      {
        title:       'Team weekly retrospective',
        priority:    'high',
        dueDate:     today,
        dueTime:     '16:00',
        description: 'Discuss sprint outcomes and improvements',
      },
      {
        title:       'Plan Q1 product roadmap',
        priority:    'high',
        dueDate:     tomorrowISO,
        dueTime:     '10:00',
        description: 'Prepare draft for stakeholder review',
      },
    ];

    this._seeding = true;
    demos.forEach(d => this.createTask(d));
    this._seeding = false;
  }

  private getTodayISO(): string {
    return new Date().toISOString().split('T')[0];
  }
}
