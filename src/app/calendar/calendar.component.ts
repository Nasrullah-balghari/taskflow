import { Component, computed, inject, signal } from '@angular/core';
import { TaskService } from '../core/services/task.service';
import { ModalService } from '../core/services/modal.service';
import { Task } from '../core/models/task.model';

export interface CalendarDay {
  iso: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar',
  imports: [],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  private readonly taskService  = inject(TaskService);
  readonly modalService = inject(ModalService);

  private readonly _currentYear  = signal(new Date().getFullYear());
  private readonly _currentMonth = signal(new Date().getMonth());
  private readonly _selectedISO  = signal(this.todayISO());

  readonly viewMode = signal<'day' | 'week' | 'month'>('month');
  readonly dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  readonly tasksByDate = computed(() => {
    const map = new Map<string, Task[]>();
    for (const task of this.taskService.tasks()) {
      if (task.dueDate) {
        const bucket = map.get(task.dueDate) ?? [];
        map.set(task.dueDate, [...bucket, task]);
      }
    }
    return map;
  });

  readonly calendarDays = computed((): CalendarDay[] => {
    const year        = this._currentYear();
    const month       = this._currentMonth();
    const todayISO    = this.todayISO();
    const selectedISO = this._selectedISO();
    const byDate      = this.tasksByDate();

    const firstOfMonth = new Date(year, month, 1);
    const startCell    = new Date(firstOfMonth);
    startCell.setDate(startCell.getDate() - startCell.getDay());

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startCell);
      d.setDate(startCell.getDate() + i);
      const iso = this.dateToISO(d);
      days.push({
        iso,
        dayNum:         d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday:        iso === todayISO,
        isSelected:     iso === selectedISO,
        tasks:          byDate.get(iso) ?? [],
      });
    }
    return days;
  });

  readonly selectedDayTasks = computed(() =>
    this.tasksByDate().get(this._selectedISO()) ?? []
  );

  readonly selectedDateLabel = computed(() => {
    const [y, mo, d] = this._selectedISO().split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
    });
  });

  readonly monthLabel = computed(() =>
    new Date(this._currentYear(), this._currentMonth(), 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  readonly monthlyProgress = computed(() => {
    const year  = this._currentYear();
    const month = this._currentMonth();
    const monthTasks = this.taskService.tasks().filter(t => {
      if (!t.dueDate) return false;
      const [y, mo] = t.dueDate.split('-').map(Number);
      return y === year && mo - 1 === month;
    });
    if (monthTasks.length === 0) return 0;
    return Math.round((monthTasks.filter(t => t.completed).length / monthTasks.length) * 100);
  });

  readonly monthlyProgressLabel = computed(() => {
    const year  = this._currentYear();
    const month = this._currentMonth();
    const monthTasks = this.taskService.tasks().filter(t => {
      if (!t.dueDate) return false;
      const [y, mo] = t.dueDate.split('-').map(Number);
      return y === year && mo - 1 === month;
    });
    if (monthTasks.length === 0) return 'No tasks scheduled this month.';
    const done = monthTasks.filter(t => t.completed).length;
    const pct  = Math.round((done / monthTasks.length) * 100);
    return `You've completed ${done} of ${monthTasks.length} tasks this month (${pct}%).`;
  });

  prevMonth(): void {
    if (this._currentMonth() === 0) {
      this._currentYear.update(y => y - 1);
      this._currentMonth.set(11);
    } else {
      this._currentMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this._currentMonth() === 11) {
      this._currentYear.update(y => y + 1);
      this._currentMonth.set(0);
    } else {
      this._currentMonth.update(m => m + 1);
    }
  }

  selectDay(day: CalendarDay): void {
    this._selectedISO.set(day.iso);
    if (!day.isCurrentMonth) {
      const [y, mo] = day.iso.split('-').map(Number);
      this._currentYear.set(y);
      this._currentMonth.set(mo - 1);
    }
  }

  setView(mode: 'day' | 'week' | 'month'): void {
    this.viewMode.set(mode);
  }

  onAddTaskForSelectedDay(): void {
    this.modalService.openAddTaskModalWithDate(this._selectedISO());
  }

  formatTime(time: string | undefined): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  private todayISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  private dateToISO(d: Date): string {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  }
}
