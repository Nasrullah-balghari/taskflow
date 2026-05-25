import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { Toast } from '../../../core/models/toast.model';

@Component({
  selector: 'app-toast-container',
  imports: [],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss'
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  onDismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  onActionClick(toast: Toast, event: Event): void {
    event.stopPropagation();
    if (toast.action) {
      toast.action.handler();
      this.toastService.dismiss(toast.id);
    }
  }
}
