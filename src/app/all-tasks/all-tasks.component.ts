import { Component, computed, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TaskService } from '../core/services/task.service';
import { ModalService } from '../core/services/modal.service';
import { LoadingService } from '../core/services/loading.service';
import { TaskRowComponent } from '../shared/components/task-row/task-row.component';
import { TaskRowSkeletonComponent } from '../shared/components/skeletons/task-row-skeleton/task-row-skeleton.component';

type TaskFilter = 'all' | 'today' | 'upcoming' | 'completed' | 'overdue';
type TaskSort   = 'newest' | 'oldest' | 'priority' | 'dueDate' | 'alphabetical';

@Component({
  selector: 'app-all-tasks',
  imports: [TaskRowComponent, TaskRowSkeletonComponent],
  templateUrl: './all-tasks.component.html',
  styleUrl: './all-tasks.component.scss'
})
export class AllTasksComponent {
  private readonly taskService   = inject(TaskService);
  private readonly modalService  = inject(ModalService);
  private readonly loadingService = inject(LoadingService);

  readonly isLoading = this.loadingService.isLoadingTasks;

  constructor() {
    this.loadingService.simulateLoad('tasks', 300);
  }

  readonly totalCount   = this.taskService.totalCount;
  readonly activeFilter = signal<TaskFilter>('all');
  readonly sortBy       = signal<TaskSort>('newest');
  readonly searchQuery  = signal<string>('');

  // Debounced version of searchQuery — filters only run after 300ms idle
  readonly debouncedSearch = toSignal(
    toObservable(this.searchQuery).pipe(
      debounceTime(300),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );

  readonly filterCounts = computed(() => {
    const all   = this.taskService.tasks();
    const today = new Date().toISOString().split('T')[0];
    return {
      all:       all.length,
      today:     all.filter(t => t.dueDate === today && !t.completed).length,
      upcoming:  all.filter(t => !!t.dueDate && t.dueDate > today && !t.completed).length,
      completed: all.filter(t => t.completed).length,
      overdue:   all.filter(t => !!t.dueDate && t.dueDate < today && !t.completed).length,
    };
  });

  readonly filteredTasks = computed(() => {
    const allTasks = this.taskService.tasks();
    const filter   = this.activeFilter();
    const query    = this.debouncedSearch().toLowerCase().trim();
    const sort     = this.sortBy();
    const today    = new Date().toISOString().split('T')[0];

    // Step 1: Filter by category
    let filtered: typeof allTasks;
    switch (filter) {
      case 'today':
        filtered = allTasks.filter(t => t.dueDate === today && !t.completed);
        break;
      case 'upcoming':
        filtered = allTasks.filter(t => !!t.dueDate && t.dueDate > today && !t.completed);
        break;
      case 'completed':
        filtered = allTasks.filter(t => t.completed);
        break;
      case 'overdue':
        filtered = allTasks.filter(t => !!t.dueDate && t.dueDate < today && !t.completed);
        break;
      default:
        filtered = allTasks;
    }

    // Step 2: Search in title and description
    if (query) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description?.toLowerCase().includes(query) ?? false)
      );
    }

    // Step 3: Sort
    const sorted = [...filtered];
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

    switch (sort) {
      case 'newest':
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case 'oldest':
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case 'priority':
        sorted.sort((a, b) =>
          (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
        );
        break;
      case 'dueDate':
        sorted.sort((a, b) =>
          (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
        );
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return sorted;
  });

  setFilter(filter: TaskFilter): void { this.activeFilter.set(filter); }
  setSort(sort: TaskSort): void       { this.sortBy.set(sort); }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void { this.searchQuery.set(''); }
  onAddTask():   void { this.modalService.openAddTaskModal(); }
}
