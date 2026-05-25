import { Component, HostListener, computed, inject } from '@angular/core';
import { ModalService } from '../../../core/services/modal.service';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-delete-confirm-modal',
  imports: [],
  templateUrl: './delete-confirm-modal.component.html',
  styleUrl: './delete-confirm-modal.component.scss'
})
export class DeleteConfirmModalComponent {
  private readonly modalService = inject(ModalService);
  private readonly taskService  = inject(TaskService);

  readonly isOpen = this.modalService.isDeleteConfirmOpen;
  readonly taskId = this.modalService.taskToDelete;

  readonly taskTitle = computed(() => {
    const id = this.taskId();
    if (!id) return '';
    return this.taskService.getTaskById(id)?.title ?? '';
  });

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isOpen()) this.onCancel(); }

  onCancel(): void { this.modalService.closeDeleteConfirm(); }

  onConfirm(): void {
    const id = this.taskId();
    if (id) this.taskService.deleteTask(id);
    this.modalService.closeDeleteConfirm();
  }
}
