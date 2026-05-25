import { Component, computed, inject, input } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ModalService } from '../../../core/services/modal.service';
import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-row',
  imports: [TitleCasePipe],
  templateUrl: './task-row.component.html',
  styleUrl: './task-row.component.scss'
})
export class TaskRowComponent {
  private readonly modalService   = inject(ModalService);
  private readonly taskService    = inject(TaskService);
  private readonly categoryService = inject(CategoryService);

  task     = input.required<Task>();
  showDate = input<boolean>(false);

  readonly categoryName = computed(() => {
    const id = this.task().categoryId;
    return id ? this.categoryService.getCategoryName(id) : null;
  });

  readonly categoryColor = computed(() =>
    this.categoryService.getCategoryColor(this.task().categoryId)
  );

  readonly isOverdue = computed(() => {
    const t = this.task();
    if (!t.dueDate || t.completed) return false;
    const [y, mo, d] = t.dueDate.split('-').map(Number);
    const due   = new Date(y, mo - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  });

  onRowClick(): void { this.modalService.openEditTaskModal(this.task().id); }

  onToggle(event: Event): void {
    event.stopPropagation();
    this.taskService.toggleComplete(this.task().id);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.modalService.openEditTaskModal(this.task().id);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.modalService.openDeleteConfirm(this.task().id);
  }

  formatTime(time: string | undefined): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${period}`;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    const [y, mo, d] = date.split('-').map(Number);
    const target    = new Date(y, mo - 1, d);
    const today     = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    if (target.getTime() === today.getTime())     return 'Today';
    if (target.getTime() === tomorrow.getTime())  return 'Tomorrow';
    if (target.getTime() === yesterday.getTime()) return 'Yesterday';

    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
