import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ModalService } from '../../../core/services/modal.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category, CategoryColor, CATEGORY_COLORS } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './category-form-modal.component.html',
  styleUrl: './category-form-modal.component.scss'
})
export class CategoryFormModalComponent {
  private readonly modalService    = inject(ModalService);
  private readonly categoryService = inject(CategoryService);
  private readonly fb              = inject(FormBuilder);

  readonly isOpen      = this.modalService.isCategoryFormOpen;
  readonly isEditMode  = this.modalService.isCategoryEditMode;
  readonly editingId   = this.modalService.editingCategoryId;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly availableColors: { value: CategoryColor; hex: string; label: string }[] = [
    { value: 'indigo', hex: '#6366F1', label: 'Indigo' },
    { value: 'pink',   hex: '#EC4899', label: 'Pink'   },
    { value: 'green',  hex: '#10B981', label: 'Green'  },
    { value: 'amber',  hex: '#F59E0B', label: 'Amber'  },
    { value: 'purple', hex: '#8B5CF6', label: 'Purple' },
    { value: 'cyan',   hex: '#06B6D4', label: 'Cyan'   },
    { value: 'red',    hex: '#EF4444', label: 'Red'    },
    { value: 'gray',   hex: '#82828F', label: 'Gray'   },
  ];

  readonly suggestedIcons = [
    '💼', '🏠', '📚', '🏃', '💰', '🎨', '⚡', '🌟',
    '📌', '🎯', '🔥', '💡', '🛒', '🎮', '🍎', '✈️',
  ];

  readonly categoryForm = this.fb.nonNullable.group({
    name:  ['', [Validators.required, Validators.maxLength(30)]],
    color: ['indigo' as CategoryColor],
    icon:  [''],
  });

  // Reactive form snapshot → signals for live preview
  private readonly formSnapshot = toSignal(
    this.categoryForm.valueChanges.pipe(map(() => this.categoryForm.getRawValue())),
    { initialValue: this.categoryForm.getRawValue() }
  );

  readonly previewHex  = computed(() => CATEGORY_COLORS[this.formSnapshot().color]);
  readonly previewBg   = computed(() => this.previewHex() + '22');
  readonly previewName = computed(() => this.formSnapshot().name.trim() || 'Preview');
  readonly previewIcon = computed(() => this.formSnapshot().icon);

  readonly modalTitle          = computed(() => this.isEditMode() ? 'Edit Category'   : 'New Category');
  readonly submitButtonText    = computed(() => this.isEditMode() ? 'Save Changes'    : 'Create Category');
  readonly submitButtonLoading = computed(() => this.isEditMode() ? 'Saving...'       : 'Creating...');

  readonly isEditingDefault = computed(() => {
    const id = this.editingId();
    return id ? (this.categoryService.getCategoryById(id)?.isDefault ?? false) : false;
  });

  constructor() {
    effect(() => {
      const open      = this.modalService.isCategoryFormOpen();
      const editingId = this.modalService.editingCategoryId();

      if (!open) return;

      this.errorMessage.set('');
      if (editingId) {
        const cat = this.categoryService.getCategoryById(editingId);
        if (cat) {
          this.categoryForm.reset({ name: cat.name, color: cat.color, icon: cat.icon ?? '' });
        }
      } else {
        this.categoryForm.reset({ name: '', color: 'indigo', icon: '' });
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isOpen()) this.onClose(); }

  onClose(): void { this.modalService.closeCategoryFormModal(); }

  selectColor(color: CategoryColor): void {
    this.categoryForm.controls.color.setValue(color);
  }

  selectIcon(icon: string): void {
    const current = this.categoryForm.controls.icon.value;
    this.categoryForm.controls.icon.setValue(current === icon ? '' : icon);
  }

  clearIcon(): void { this.categoryForm.controls.icon.setValue(''); }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { name, color, icon } = this.categoryForm.getRawValue();
    const data = { name: name.trim(), color, icon: icon.trim() || undefined };

    let result: Category | null;
    if (this.isEditMode()) {
      const id = this.editingId();
      result = id ? this.categoryService.updateCategory(id, data) : null;
    } else {
      result = this.categoryService.createCategory(data);
    }

    this.isSubmitting.set(false);

    if (result) {
      this.onClose();
    } else {
      this.errorMessage.set(
        this.isEditMode()
          ? 'Could not save — name may already be in use.'
          : 'A category with this name already exists.'
      );
    }
  }
}
