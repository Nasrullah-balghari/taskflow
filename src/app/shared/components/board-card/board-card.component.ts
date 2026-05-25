import { Component, computed, inject, input } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Task } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { ModalService } from '../../../core/services/modal.service';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-board-card',
  imports: [TitleCasePipe],
  templateUrl: './board-card.component.html',
  styleUrl: './board-card.component.scss'
})
export class BoardCardComponent {
  private readonly taskService     = inject(TaskService);
  private readonly modalService    = inject(ModalService);
  private readonly categoryService = inject(CategoryService);

  task = input.required<Task>();

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
    const due = new Date(y, mo - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  });

  onCardClick(): void {
    this.modalService.openEditTaskModal(this.task().id);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.modalService.openEditTaskModal(this.task().id);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.modalService.openDeleteConfirm(this.task().id);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    const [y, mo, d] = date.split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
