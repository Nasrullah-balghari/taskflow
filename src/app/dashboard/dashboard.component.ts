import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TaskService } from '../core/services/task.service';
import { ModalService } from '../core/services/modal.service';
import { LoadingService } from '../core/services/loading.service';
import { TaskRowComponent } from '../shared/components/task-row/task-row.component';
import { StatCardSkeletonComponent } from '../shared/components/skeletons/stat-card-skeleton/stat-card-skeleton.component';
import { TaskRowSkeletonComponent } from '../shared/components/skeletons/task-row-skeleton/task-row-skeleton.component';
import { RecentActivityComponent } from '../shared/components/recent-activity/recent-activity.component';

@Component({
  selector: 'app-dashboard',
  imports: [TaskRowComponent, RouterLink, StatCardSkeletonComponent, TaskRowSkeletonComponent, RecentActivityComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private readonly authService    = inject(AuthService);
  private readonly taskService    = inject(TaskService);
  private readonly modalService   = inject(ModalService);
  private readonly loadingService = inject(LoadingService);

  readonly isLoading = this.loadingService.isLoadingDashboard;

  // ── Stat bounce signals ───────────────────────────────────────────────────
  readonly bounceTotal     = signal(false);
  readonly bouncePending   = signal(false);
  readonly bounceCompleted = signal(false);
  readonly bounceOverdue   = signal(false);

  constructor() {
    this.loadingService.simulateLoad('dashboard', 350);

    let initTotal = true, initPending = true, initCompleted = true, initOverdue = true;

    effect(() => {
      this.totalCount();
      if (initTotal) { initTotal = false; return; }
      this.bounceTotal.set(true);
      setTimeout(() => this.bounceTotal.set(false), 400);
    }, { allowSignalWrites: true });

    effect(() => {
      this.pendingCount();
      if (initPending) { initPending = false; return; }
      this.bouncePending.set(true);
      setTimeout(() => this.bouncePending.set(false), 400);
    }, { allowSignalWrites: true });

    effect(() => {
      this.completedCount();
      if (initCompleted) { initCompleted = false; return; }
      this.bounceCompleted.set(true);
      setTimeout(() => this.bounceCompleted.set(false), 400);
    }, { allowSignalWrites: true });

    effect(() => {
      this.overdueCount();
      if (initOverdue) { initOverdue = false; return; }
      this.bounceOverdue.set(true);
      setTimeout(() => this.bounceOverdue.set(false), 400);
    }, { allowSignalWrites: true });
  }

  // ── Greeting ──────────────────────────────────────────────────────────────

  readonly firstName = computed(() => {
    const name = this.authService.currentUser()?.name ?? 'Guest';
    return name.split(' ')[0];
  });

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  readonly taskCountMessage = computed(() => {
    const count = this.taskService.todaysTasks().length;
    if (count === 0) return 'No tasks scheduled for today';
    if (count === 1) return 'You have 1 task today';
    return `You have ${count} tasks today`;
  });

  // ── Stat card counts ───────────────────────────────────────────────────────

  readonly totalCount     = this.taskService.totalCount;
  readonly completedCount = this.taskService.completedCount;
  readonly pendingCount   = this.taskService.pendingCount;
  readonly overdueCount   = this.taskService.overdueCount;

  // ── Stat card badges ──────────────────────────────────────────────────────

  readonly totalBadge = computed(() =>
    this.taskService.totalCount() > 0
      ? { label: 'Active', cls: 'badge-green' }
      : { label: 'Empty',  cls: 'badge-gray'  }
  );

  readonly completionRate = computed(() => {
    const total = this.taskService.totalCount();
    if (total === 0) return '0%';
    return Math.round((this.taskService.completedCount() / total) * 100) + '%';
  });

  readonly pendingBadge = computed(() =>
    this.taskService.pendingCount() > 0
      ? { label: 'Active', cls: 'badge-amber' }
      : { label: 'Clear',  cls: 'badge-green' }
  );

  readonly overdueBadge = computed(() =>
    this.taskService.overdueCount() > 0
      ? { label: 'Needs attention', cls: 'badge-red'   }
      : { label: 'On track',        cls: 'badge-green' }
  );

  // ── Productivity Chart ────────────────────────────────────────────────────

  readonly weeklyProductivity = computed(() => {
    const tasks = this.taskService.tasks();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dow = today.getDay(); // 0=Sun … 6=Sat
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return labels.map((label, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dayStart = day.getTime();
      const dayEnd   = dayStart + 86_400_000;

      const count = tasks.filter(t =>
        t.completed &&
        t.completedAt !== undefined &&
        t.completedAt >= dayStart &&
        t.completedAt <  dayEnd
      ).length;

      return { label, count, isToday: day.getTime() === today.getTime() };
    });
  });

  readonly maxCount = computed(() =>
    Math.max(...this.weeklyProductivity().map(d => d.count), 1)
  );

  readonly avgDaily = computed(() => {
    const total = this.weeklyProductivity().reduce((s, d) => s + d.count, 0);
    return (total / 7).toFixed(1);
  });

  barHeightPercent(count: number): number {
    return (count / this.maxCount()) * 100;
  }

  // ── Today's Tasks widget ──────────────────────────────────────────────────

  readonly allTodaysTasks = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.taskService.tasks()
      .filter(t => t.dueDate === today)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.dueTime ?? '99:99').localeCompare(b.dueTime ?? '99:99');
      });
  });

  onAddTaskClick(): void { this.modalService.openAddTaskModal(); }
}
