import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ModalService } from '../core/services/modal.service';
import { TaskService } from '../core/services/task.service';
import { CategoryService } from '../core/services/category.service';
import { Task } from '../core/models/task.model';

@Component({
  selector: 'app-personal',
  imports: [DecimalPipe],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.scss'
})
export class PersonalComponent {
  readonly modalService         = inject(ModalService);
  readonly categoryService      = inject(CategoryService);
  private readonly taskService  = inject(TaskService);

  readonly activeFilter = signal<'all' | 'active' | 'completed'>('all');

  readonly totalCount     = computed(() => this.taskService.tasks().length);
  readonly completedCount = computed(() => this.taskService.tasks().filter(t => t.completed).length);
  readonly activeCount    = computed(() => this.taskService.tasks().filter(t => !t.completed).length);
  readonly progressPct    = computed(() =>
    this.totalCount() > 0 ? (this.completedCount() / this.totalCount()) * 100 : 0
  );

  readonly filteredTasks = computed(() => {
    const tasks = this.taskService.tasks();
    switch (this.activeFilter()) {
      case 'active':    return tasks.filter(t => !t.completed);
      case 'completed': return tasks.filter(t => t.completed);
      default:          return tasks;
    }
  });

  setFilter(f: 'all' | 'active' | 'completed'): void { this.activeFilter.set(f); }

  toggleTask(task: Task): void { this.taskService.toggleComplete(task.id); }

  onEdit(task: Task): void { this.modalService.openEditTaskModal(task.id); }

  onDelete(task: Task): void { this.modalService.openDeleteConfirm(task.id); }

  formatDueDate(dueDate?: string): string {
    if (!dueDate) return '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [y, mo, d] = dueDate.split('-').map(Number);
    const due = new Date(y, mo - 1, d);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0)  return 'Overdue';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  dueDateStyle(dueDate?: string): string {
    if (!dueDate) return 'none';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [y, mo, d] = dueDate.split('-').map(Number);
    const diff = Math.round((new Date(y, mo - 1, d).getTime() - today.getTime()) / 86400000);
    if (diff < 0)  return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= 3)  return 'upcoming';
    return 'later';
  }
}
