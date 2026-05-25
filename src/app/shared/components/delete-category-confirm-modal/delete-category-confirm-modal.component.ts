import { Component, HostListener, computed, inject } from '@angular/core';
import { ModalService } from '../../../core/services/modal.service';
import { CategoryService } from '../../../core/services/category.service';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-delete-category-confirm-modal',
  imports: [],
  templateUrl: './delete-category-confirm-modal.component.html',
  styleUrl: './delete-category-confirm-modal.component.scss'
})
export class DeleteCategoryConfirmModalComponent {
  private readonly modalService    = inject(ModalService);
  private readonly categoryService = inject(CategoryService);
  private readonly taskService     = inject(TaskService);

  readonly isOpen     = this.modalService.isDeleteCategoryOpen;
  readonly categoryId = this.modalService.categoryToDelete;

  readonly category = computed(() => {
    const id = this.categoryId();
    return id ? this.categoryService.getCategoryById(id) : undefined;
  });

  readonly categoryName = computed(() => this.category()?.name ?? '');

  readonly affectedTaskCount = computed(() => {
    const id = this.categoryId();
    if (!id) return 0;
    return this.taskService.tasks().filter(t => t.categoryId === id).length;
  });

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isOpen()) this.onCancel(); }

  onCancel(): void  { this.modalService.closeDeleteCategoryConfirm(); }

  onConfirm(): void {
    const id = this.categoryId();
    if (id) this.categoryService.deleteCategory(id);
    this.modalService.closeDeleteCategoryConfirm();
  }
}
