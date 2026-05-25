import { Injectable, computed, signal } from '@angular/core';
import { TaskStatus } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class ModalService {

  private readonly _isAddTaskOpen       = signal(false);
  private readonly _editingTaskId       = signal<string | null>(null);
  private readonly _isDeleteConfirmOpen = signal(false);
  private readonly _taskToDelete        = signal<string | null>(null);
  private readonly _initialStatus             = signal<TaskStatus | null>(null);
  private readonly _initialDate               = signal<string | null>(null);
  private readonly _initialCategoryId         = signal<string | null>(null);
  private readonly _isCategoryFormOpen        = signal(false);
  private readonly _editingCategoryId         = signal<string | null>(null);
  private readonly _isDeleteCategoryOpen      = signal(false);
  private readonly _categoryToDelete          = signal<string | null>(null);

  readonly isAddTaskOpen             = this._isAddTaskOpen.asReadonly();
  readonly editingTaskId             = this._editingTaskId.asReadonly();
  readonly isDeleteConfirmOpen       = this._isDeleteConfirmOpen.asReadonly();
  readonly taskToDelete              = this._taskToDelete.asReadonly();
  readonly initialStatus             = this._initialStatus.asReadonly();
  readonly initialDate               = this._initialDate.asReadonly();
  readonly initialCategoryId         = this._initialCategoryId.asReadonly();
  readonly isCategoryFormOpen        = this._isCategoryFormOpen.asReadonly();
  readonly editingCategoryId         = this._editingCategoryId.asReadonly();
  readonly isDeleteCategoryOpen      = this._isDeleteCategoryOpen.asReadonly();
  readonly categoryToDelete          = this._categoryToDelete.asReadonly();

  readonly isEditMode         = computed(() => this._editingTaskId() !== null);
  readonly isCategoryEditMode = computed(() => this._editingCategoryId() !== null);

  openAddTaskModal(initialStatus?: TaskStatus): void {
    this._editingTaskId.set(null);
    this._initialStatus.set(initialStatus ?? null);
    this._isAddTaskOpen.set(true);
  }

  openEditTaskModal(taskId: string): void {
    this._editingTaskId.set(taskId);
    this._isAddTaskOpen.set(true);
  }

  openAddTaskModalWithDate(dueDate: string): void {
    this._editingTaskId.set(null);
    this._initialStatus.set(null);
    this._initialDate.set(dueDate);
    this._isAddTaskOpen.set(true);
  }

  openAddTaskModalWithCategory(categoryId: string): void {
    this._editingTaskId.set(null);
    this._initialStatus.set(null);
    this._initialDate.set(null);
    this._initialCategoryId.set(categoryId);
    this._isAddTaskOpen.set(true);
  }

  closeAddTaskModal(): void {
    this._isAddTaskOpen.set(false);
    this._editingTaskId.set(null);
    this._initialStatus.set(null);
    this._initialDate.set(null);
    this._initialCategoryId.set(null);
  }

  openDeleteConfirm(taskId: string): void {
    this._taskToDelete.set(taskId);
    this._isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this._isDeleteConfirmOpen.set(false);
    this._taskToDelete.set(null);
  }

  openCreateCategoryModal(): void {
    this._editingCategoryId.set(null);
    this._isCategoryFormOpen.set(true);
  }

  openEditCategoryModal(categoryId: string): void {
    this._editingCategoryId.set(categoryId);
    this._isCategoryFormOpen.set(true);
  }

  closeCategoryFormModal(): void {
    this._isCategoryFormOpen.set(false);
    this._editingCategoryId.set(null);
  }

  openDeleteCategoryConfirm(categoryId: string): void {
    this._categoryToDelete.set(categoryId);
    this._isDeleteCategoryOpen.set(true);
  }

  closeDeleteCategoryConfirm(): void {
    this._isDeleteCategoryOpen.set(false);
    this._categoryToDelete.set(null);
  }
}
