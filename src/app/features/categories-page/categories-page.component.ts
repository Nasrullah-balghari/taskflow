import { Component, computed, inject } from '@angular/core';
import { CategoryService } from '../../core/services/category.service';
import { TaskService } from '../../core/services/task.service';
import { ModalService } from '../../core/services/modal.service';
import { CATEGORY_COLORS } from '../../core/models/category.model';

@Component({
  selector: 'app-categories-page',
  imports: [],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss'
})
export class CategoriesPageComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly taskService     = inject(TaskService);
  private readonly modalService    = inject(ModalService);

  readonly categoriesWithCounts = computed(() => {
    const allTasks = this.taskService.tasks();
    return this.categoryService.categories().map(cat => ({
      ...cat,
      hexColor:       CATEGORY_COLORS[cat.color],
      totalTasks:     allTasks.filter(t => t.categoryId === cat.id).length,
      completedTasks: allTasks.filter(t => t.categoryId === cat.id && t.completed).length,
    }));
  });

  readonly defaultCategories = computed(() =>
    this.categoriesWithCounts().filter(c => c.isDefault)
  );

  readonly customCategories = computed(() =>
    this.categoriesWithCounts().filter(c => !c.isDefault)
  );

  onAddCategory(): void { this.modalService.openCreateCategoryModal(); }

  onEditCategory(id: string, event: Event): void {
    event.stopPropagation();
    this.modalService.openEditCategoryModal(id);
  }

  onDeleteCategory(id: string, event: Event): void {
    event.stopPropagation();
    this.modalService.openDeleteCategoryConfirm(id);
  }

  onCardClick(id: string): void {
    this.modalService.openEditCategoryModal(id);
  }
}
