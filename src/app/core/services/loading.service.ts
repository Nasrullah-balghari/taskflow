import { Injectable, WritableSignal, signal } from '@angular/core';

type LoadingTarget = 'tasks' | 'dashboard' | 'board' | 'categories';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _isLoadingTasks       = signal(false);
  private readonly _isLoadingDashboard   = signal(false);
  private readonly _isLoadingBoard       = signal(false);
  private readonly _isLoadingCategories  = signal(false);

  readonly isLoadingTasks      = this._isLoadingTasks.asReadonly();
  readonly isLoadingDashboard  = this._isLoadingDashboard.asReadonly();
  readonly isLoadingBoard      = this._isLoadingBoard.asReadonly();
  readonly isLoadingCategories = this._isLoadingCategories.asReadonly();

  simulateLoad(target: LoadingTarget, duration: number = 300): Promise<void> {
    const ref = this.getSignal(target);
    ref.set(true);
    return new Promise(resolve => {
      setTimeout(() => {
        ref.set(false);
        resolve();
      }, duration);
    });
  }

  private getSignal(target: LoadingTarget): WritableSignal<boolean> {
    switch (target) {
      case 'tasks':      return this._isLoadingTasks;
      case 'dashboard':  return this._isLoadingDashboard;
      case 'board':      return this._isLoadingBoard;
      case 'categories': return this._isLoadingCategories;
    }
  }
}
