import {
  Component, ElementRef, HostListener, ViewChild,
  computed, effect, inject, signal
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { ModalService } from '../../../core/services/modal.service';
import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
import { TaskPriority } from '../../../core/models/task.model';

@Component({
  selector: 'app-add-task-modal',
  imports: [ReactiveFormsModule, FormsModule, DatePicker],
  templateUrl: './add-task-modal.component.html',
  styleUrl: './add-task-modal.component.scss'
})
export class AddTaskModalComponent {
  private readonly modalService = inject(ModalService);
  private readonly taskService  = inject(TaskService);
  readonly categoryService      = inject(CategoryService);
  private readonly fb           = inject(FormBuilder);

  @ViewChild('titleInput') titleInputRef!: ElementRef<HTMLInputElement>;

  readonly isOpen        = this.modalService.isAddTaskOpen;
  readonly isEditMode    = this.modalService.isEditMode;
  readonly editingTaskId = this.modalService.editingTaskId;
  readonly isSubmitting  = signal(false);

  // ── PrimeNG DatePicker bindings ────────────────────────────────────────────
  dueDateValue: Date | null = null;
  dueTimeValue: Date | null = null;

  readonly todayISO = computed(() => new Date().toISOString().split('T')[0]);
  readonly tomorrowISO = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Edit Task' : 'Add New Task'
  );
  readonly submitButtonText = computed(() =>
    this.isEditMode() ? 'Save Changes' : 'Add Task'
  );
  readonly submitButtonLoadingText = computed(() =>
    this.isEditMode() ? 'Saving...' : 'Adding...'
  );

  readonly taskForm = this.fb.nonNullable.group({
    title:       ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    priority:    ['medium' as TaskPriority],
    categoryId:  ['' as string],
    dueDate:     [''],
    dueTime:     [''],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => this.titleInputRef?.nativeElement.focus(), 50);
      }
    });

    effect(() => {
      const taskId = this.editingTaskId();
      const open   = this.isOpen();

      if (taskId && open) {
        const task = this.taskService.getTaskById(taskId);
        if (task) {
          this.dueDateValue = this.parseDateStr(task.dueDate ?? '');
          this.dueTimeValue = this.parseTimeStr(task.dueTime ?? '');
          this.taskForm.patchValue({
            title:       task.title,
            description: task.description ?? '',
            priority:    task.priority,
            categoryId:  task.categoryId  ?? '',
            dueDate:     task.dueDate     ?? '',
            dueTime:     task.dueTime     ?? '',
          });
        }
      } else if (open && !taskId) {
        const initialDate       = this.modalService.initialDate();
        const initialCategoryId = this.modalService.initialCategoryId();
        this.dueDateValue = this.parseDateStr(initialDate ?? '');
        this.dueTimeValue = null;
        this.taskForm.reset({
          priority:   'medium',
          dueDate:    initialDate       ?? '',
          categoryId: initialCategoryId ?? '',
        });
      } else if (!open) {
        this.dueDateValue = null;
        this.dueTimeValue = null;
        this.taskForm.reset({ priority: 'medium' });
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isOpen()) this.onClose(); }

  onClose(): void { this.modalService.closeAddTaskModal(); }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.onClose();
  }

  // ── Today / Tomorrow helpers ───────────────────────────────────────────────

  isDueDateToday(): boolean {
    return this.taskForm.controls.dueDate.value === this.todayISO();
  }

  isDueDateTomorrow(): boolean {
    return this.taskForm.controls.dueDate.value === this.tomorrowISO();
  }

  setDueDateToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.dueDateValue = today;
    this.taskForm.controls.dueDate.setValue(this.todayISO());
  }

  setDueDateTomorrow(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    this.dueDateValue = tomorrow;
    this.taskForm.controls.dueDate.setValue(this.tomorrowISO());
  }

  // ── PrimeNG DatePicker change handlers ────────────────────────────────────

  onDateChange(date: Date | null): void {
    this.taskForm.controls.dueDate.setValue(date ? this.toDateStr(date) : '');
  }

  onTimeChange(date: Date | null): void {
    this.taskForm.controls.dueTime.setValue(date ? this.toTimeStr(date) : '');
  }

  // ── Form control helpers ───────────────────────────────────────────────────

  setPriority(priority: TaskPriority): void {
    this.taskForm.controls.priority.setValue(priority);
  }

  setCategory(categoryId: string): void {
    this.taskForm.controls.categoryId.setValue(categoryId);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const { title, description, priority, categoryId, dueDate, dueTime } = this.taskForm.getRawValue();
    const request = {
      title:       title.trim(),
      description: description.trim() || undefined,
      priority,
      categoryId:  categoryId || undefined,
      dueDate:     dueDate    || undefined,
      dueTime:     dueTime    || undefined,
    };

    if (this.isEditMode()) {
      const taskId = this.editingTaskId();
      if (taskId) this.taskService.updateTask(taskId, request);
    } else {
      const created = this.taskService.createTask(request);
      const initialStatus = this.modalService.initialStatus();
      if (created && initialStatus && initialStatus !== 'todo') {
        this.taskService.updateTask(created.id, {
          status:    initialStatus,
          completed: initialStatus === 'done',
        });
      }
    }

    this.isSubmitting.set(false);
    this.onClose();
  }

  // ── Private conversion helpers ─────────────────────────────────────────────

  private toDateStr(d: Date): string {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  }

  private toTimeStr(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private parseDateStr(s: string): Date | null {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private parseTimeStr(s: string): Date | null {
    if (!s) return null;
    const [h, m] = s.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
}
