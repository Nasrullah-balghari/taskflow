import { Injectable, signal } from '@angular/core';
import { Toast, ToastOptions, ToastType } from '../models/toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly DEFAULT_DURATION = 4000;
  private readonly MAX_TOASTS = 5;

  success(title: string, options?: ToastOptions): string {
    return this.show('success', title, options);
  }

  error(title: string, options?: ToastOptions): string {
    return this.show('error', title, options);
  }

  warning(title: string, options?: ToastOptions): string {
    return this.show('warning', title, options);
  }

  info(title: string, options?: ToastOptions): string {
    return this.show('info', title, options);
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._toasts.update(prev => prev.filter(t => t.id !== id));
  }

  dismissAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this._toasts.set([]);
  }

  private show(type: ToastType, title: string, options?: ToastOptions): string {
    const toast: Toast = {
      id:          crypto.randomUUID(),
      type,
      title,
      message:     options?.message,
      duration:    options?.duration ?? this.DEFAULT_DURATION,
      action:      options?.action,
      dismissible: options?.dismissible ?? true,
      createdAt:   Date.now(),
    };

    this._toasts.update(prev => [toast, ...prev].slice(0, this.MAX_TOASTS));

    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => this.dismiss(toast.id), toast.duration);
      this.timers.set(toast.id, timer);
    }

    return toast.id;
  }
}
