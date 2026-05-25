import { Component, computed, inject } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskService } from '../core/services/task.service';
import { ModalService } from '../core/services/modal.service';
import { LoadingService } from '../core/services/loading.service';
import { Task, TaskStatus } from '../core/models/task.model';
import { BoardCardComponent } from '../shared/components/board-card/board-card.component';
import { BoardCardSkeletonComponent } from '../shared/components/skeletons/board-card-skeleton/board-card-skeleton.component';

@Component({
  selector: 'app-board-view',
  imports: [DragDropModule, BoardCardComponent, BoardCardSkeletonComponent],
  templateUrl: './board-view.component.html',
  styleUrl: './board-view.component.scss'
})
export class BoardViewComponent {
  readonly taskService    = inject(TaskService);
  readonly modalService   = inject(ModalService);
  private readonly loadingService = inject(LoadingService);

  readonly isLoading = this.loadingService.isLoadingBoard;

  constructor() {
    this.loadingService.simulateLoad('board', 350);
  }

  readonly todoTasks       = computed(() => this.taskService.statusGroups().todo);
  readonly inProgressTasks = computed(() => this.taskService.statusGroups().inProgress);
  readonly doneTasks       = computed(() => this.taskService.statusGroups().done);

  readonly TODO_ID        = 'todo-list';
  readonly IN_PROGRESS_ID = 'in-progress-list';
  readonly DONE_ID        = 'done-list';

  // Store task.id in cdkDragData to avoid stale object references on drop
  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) return;
    const taskId    = event.item.data as string;
    const newStatus = this.getStatusFromContainerId(event.container.id);
    if (newStatus && taskId) {
      this.taskService.updateTask(taskId, {
        status:    newStatus,
        completed: newStatus === 'done',
      });
    }
  }

  private getStatusFromContainerId(id: string): TaskStatus | null {
    switch (id) {
      case this.TODO_ID:        return 'todo';
      case this.IN_PROGRESS_ID: return 'in-progress';
      case this.DONE_ID:        return 'done';
      default:                  return null;
    }
  }

  onAddCard(status: TaskStatus): void {
    this.modalService.openAddTaskModal(status);
  }
}
