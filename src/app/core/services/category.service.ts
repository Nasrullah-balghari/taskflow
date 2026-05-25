import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { TaskService } from './task.service';
import { ToastService } from './toast.service';
import {
  Category, CategoryColor, CATEGORY_COLORS,
  CreateCategoryRequest, UpdateCategoryRequest,
} from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly authService = inject(AuthService);
  private readonly storage     = inject(StorageService);
  private readonly taskService = inject(TaskService);
  private readonly toast       = inject(ToastService);

  private readonly _categories = signal<Category[]>([]);

  /** Read-only signal — components subscribe to this, never write to it. */
  readonly categories = this._categories.asReadonly();

  // ── Computed signals ──────────────────────────────────────────────────────

  readonly defaultCategories = computed(() =>
    this.categories().filter(c => c.isDefault)
  );

  readonly customCategories = computed(() =>
    this.categories().filter(c => !c.isDefault)
  );

  readonly totalCount = computed(() => this.categories().length);

  /** Fast O(1) lookup by ID — used in templates for category badges. */
  readonly categoryMap = computed(() => {
    const map = new Map<string, Category>();
    for (const c of this.categories()) map.set(c.id, c);
    return map;
  });

  // ── Effects ───────────────────────────────────────────────────────────────

  constructor() {
    // EFFECT 1 — Load the correct category list whenever the logged-in user changes.
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        const stored = this.storage.get<Category[]>(`categories:${user.id}`, []);
        this._categories.set(stored);
        if (stored.length === 0) {
          this.seedDefaultCategories();
        }
      } else {
        this._categories.set([]);
      }
    }, { allowSignalWrites: true });

    // EFFECT 2 — Auto-persist categories to LocalStorage whenever the list changes.
    effect(() => {
      const user    = this.authService.currentUser();
      const current = this._categories();
      if (user) {
        this.storage.set(`categories:${user.id}`, current);
      }
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  createCategory(request: CreateCategoryRequest): Category | null {
    const user = this.authService.currentUser();
    if (!user) return null;

    const trimmedName = request.name.trim();
    if (!trimmedName || trimmedName.length > 30) return null;

    if (this.isDuplicateName(trimmedName)) {
      this.toast.error('Name already exists', {
        message: 'Try a different category name',
      });
      return null;
    }

    const now = new Date().toISOString();
    const newCategory: Category = {
      id:        crypto.randomUUID(),
      userId:    user.id,
      name:      trimmedName,
      color:     request.color,
      icon:      request.icon,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    this._categories.update(prev => [...prev, newCategory]);
    this.toast.success('Category created', { message: newCategory.name });
    return newCategory;
  }

  updateCategory(id: string, updates: UpdateCategoryRequest): Category | null {
    const user = this.authService.currentUser();
    if (!user) return null;

    const existing = this._categories().find(c => c.id === id);
    if (!existing || existing.userId !== user.id) return null;

    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (!trimmedName || trimmedName.length > 30) return null;
      if (this.isDuplicateName(trimmedName, id)) return null;
      updates = { ...updates, name: trimmedName };
    }

    const updatedCategory: Category = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this._categories.update(prev =>
      prev.map(c => c.id === id ? updatedCategory : c)
    );
    this.toast.success('Category updated', { message: updatedCategory.name });
    return updatedCategory;
  }

  deleteCategory(id: string): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;

    const existing = this._categories().find(c => c.id === id);
    if (!existing || existing.userId !== user.id) return false;

    if (existing.isDefault) {
      this.toast.warning('Cannot delete default category', {
        message: `${existing.name} is a default category`,
      });
      return false;
    }

    // Count affected tasks before clearing them
    const affectedCount = this.taskService.tasks()
      .filter(t => t.categoryId === id).length;

    // Clear categoryId silently — the category delete toast covers this
    const affectedTasks = this.taskService.tasks().filter(t => t.categoryId === id);
    for (const task of affectedTasks) {
      this.taskService.updateTaskSilent(task.id, { categoryId: undefined });
    }

    this._categories.update(prev => prev.filter(c => c.id !== id));

    this.toast.error('Category deleted', {
      message: affectedCount > 0
        ? `${affectedCount} ${affectedCount === 1 ? 'task' : 'tasks'} now uncategorized`
        : existing.name,
    });

    return true;
  }

  /** Returns a single category by ID, or undefined if it doesn't exist. */
  getCategoryById(id: string): Category | undefined {
    return this._categories().find(c => c.id === id);
  }

  getCategoryColor(id: string | undefined): string {
    if (!id) return CATEGORY_COLORS.gray;
    const category = this.categoryMap().get(id);
    return category ? CATEGORY_COLORS[category.color] : CATEGORY_COLORS.gray;
  }

  getCategoryName(id: string | undefined): string {
    if (!id) return 'No category';
    return this.categoryMap().get(id)?.name ?? 'Unknown';
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private isDuplicateName(name: string, excludeId?: string): boolean {
    const lower = name.toLowerCase();
    return this._categories().some(c =>
      c.name.toLowerCase() === lower && c.id !== excludeId
    );
  }

  private seedDefaultCategories(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    const now = new Date().toISOString();
    const defaults: Category[] = [
      {
        id:        crypto.randomUUID(),
        userId:    user.id,
        name:      'Work',
        color:     'indigo' as CategoryColor,
        icon:      '💼',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id:        crypto.randomUUID(),
        userId:    user.id,
        name:      'Personal',
        color:     'pink' as CategoryColor,
        icon:      '🏠',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    this._categories.set(defaults);
  }
}
