import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { TaskService } from '../../core/services/task.service';
import { CategoryService } from '../../core/services/category.service';
import { ModalService } from '../../core/services/modal.service';
import { LoadingService } from '../../core/services/loading.service';
import { CATEGORY_COLORS } from '../../core/models/category.model';
import { TaskRowComponent } from '../../shared/components/task-row/task-row.component';
import { TaskRowSkeletonComponent } from '../../shared/components/skeletons/task-row-skeleton/task-row-skeleton.component';

@Component({
  selector: 'app-category-page',
  imports: [TaskRowComponent, TaskRowSkeletonComponent],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss'
})
export class CategoryPageComponent {
  private readonly route           = inject(ActivatedRoute);
  private readonly router          = inject(Router);
  private readonly taskService     = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  private readonly modalService    = inject(ModalService);
  private readonly loadingService  = inject(LoadingService);

  readonly isLoading = this.loadingService.isLoadingTasks;

  // ── Route param (reactive) ─────────────────────────────────────────────────
  readonly categoryId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('id'))),
    { initialValue: null }
  );

  // ── Filter / search state ──────────────────────────────────────────────────
  readonly activeFilter = signal<'all' | 'pending' | 'completed'>('all');
  readonly searchQuery  = signal('');

  private readonly debouncedSearch = toSignal(
    toObservable(this.searchQuery).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' }
  );

  // ── Derived state ──────────────────────────────────────────────────────────
  readonly currentCategory = computed(() => {
    const id = this.categoryId();
    return id ? this.categoryService.getCategoryById(id) : null;
  });

  readonly pageTitle = computed(() => this.currentCategory()?.name ?? 'Category');

  readonly categoryColorHex = computed(() => {
    const cat = this.currentCategory();
    return cat ? CATEGORY_COLORS[cat.color] : '#82828F';
  });

  readonly categoryTasks = computed(() => {
    const id = this.categoryId();
    if (!id) return [];
    return this.taskService.tasks().filter(t => t.categoryId === id);
  });

  readonly filterCounts = computed(() => {
    const tasks = this.categoryTasks();
    return {
      all:       tasks.length,
      pending:   tasks.filter(t => !t.completed).length,
      completed: tasks.filter(t =>  t.completed).length,
    };
  });

  readonly filteredTasks = computed(() => {
    let tasks = this.categoryTasks();

    const filter = this.activeFilter();
    if (filter === 'pending')   tasks = tasks.filter(t => !t.completed);
    if (filter === 'completed') tasks = tasks.filter(t =>  t.completed);

    const query = (this.debouncedSearch() ?? '').toLowerCase().trim();
    if (query) {
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description?.toLowerCase().includes(query) ?? false)
      );
    }

    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  });

  readonly isEmptyCategory = computed(() => this.categoryTasks().length === 0);

  // ── Redirect if category deleted while viewing ─────────────────────────────
  constructor() {
    effect(() => {
      const id   = this.categoryId();
      const cats = this.categoryService.categories();
      if (id && cats.length > 0 && !this.currentCategory()) {
        this.router.navigate(['/dashboard']);
      }
    });

    effect(() => {
      this.categoryId();
      this.loadingService.simulateLoad('tasks', 250);
    }, { allowSignalWrites: true });
  }

  // ── Methods ────────────────────────────────────────────────────────────────
  setFilter(filter: 'all' | 'pending' | 'completed'): void {
    this.activeFilter.set(filter);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onAddTask(): void {
    const id = this.categoryId();
    if (id) {
      this.modalService.openAddTaskModalWithCategory(id);
    } else {
      this.modalService.openAddTaskModal();
    }
  }
}
