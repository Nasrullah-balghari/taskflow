import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Tooltip } from 'primeng/tooltip';
import { AuthService } from './core/services/auth.service';
import { ModalService } from './core/services/modal.service';
import { TaskService } from './core/services/task.service';
import { CategoryService } from './core/services/category.service';
import { ShortcutsService } from './core/services/shortcuts.service';
import { CategoryColor, CATEGORY_COLORS } from './core/models/category.model';
import { ActivityEvent } from './core/models/task.model';
import { AddTaskModalComponent } from './shared/components/add-task-modal/add-task-modal.component';
import { DeleteConfirmModalComponent } from './shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { CategoryFormModalComponent } from './shared/components/category-form-modal/category-form-modal.component';
import { DeleteCategoryConfirmModalComponent } from './shared/components/delete-category-confirm-modal/delete-category-confirm-modal.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';
import { ShortcutsHelpModalComponent } from './shared/components/shortcuts-help-modal/shortcuts-help-modal.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterLink, RouterLinkActive, RouterOutlet, Tooltip,
    AddTaskModalComponent, DeleteConfirmModalComponent,
    CategoryFormModalComponent, DeleteCategoryConfirmModalComponent,
    ToastContainerComponent, CommandPaletteComponent,
    ShortcutsHelpModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly router          = inject(Router);
  private readonly modalService    = inject(ModalService);
  private readonly taskService     = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  readonly authService             = inject(AuthService);
  readonly shortcutsService        = inject(ShortcutsService);

  sidebarCollapsed = false;
  mobileOpen = false;

  readonly userInitial = computed(() =>
    this.authService.currentUser()?.name.charAt(0).toUpperCase() ?? '?'
  );

  readonly categoriesWithCounts = computed(() => {
    const allTasks = this.taskService.tasks();
    return this.categoryService.categories().map(cat => ({
      ...cat,
      taskCount: allTasks.filter(t => t.categoryId === cat.id && !t.completed).length,
    }));
  });

  getCategoryHex(color: CategoryColor): string {
    return CATEGORY_COLORS[color];
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  readonly searchQuery  = signal('');
  readonly isSearchOpen = signal(false);

  readonly searchResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (q.length < 2) return [];
    return this.taskService.tasks()
      .filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  });

  onSearchInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.searchQuery.set(q);
    this.isSearchOpen.set(q.trim().length >= 2);
    if (this.isBellOpen()) this.isBellOpen.set(false);
  }

  onSearchResultClick(taskId: string): void {
    this.modalService.openEditTaskModal(taskId);
    this.searchQuery.set('');
    this.isSearchOpen.set(false);
  }

  closeSearch(): void {
    setTimeout(() => this.isSearchOpen.set(false), 180);
  }

  // ── Notification bell ──────────────────────────────────────────────────────

  readonly isBellOpen   = signal(false);
  private readonly _lastSeenTs = signal(0);

  readonly unreadCount = computed(() =>
    this.taskService.activityLog().filter(e => e.timestamp > this._lastSeenTs()).length
  );

  readonly bellNotifications = computed(() =>
    this.taskService.activityLog().slice(0, 8)
  );

  toggleBell(): void {
    const willOpen = !this.isBellOpen();
    this.isBellOpen.set(willOpen);
    if (willOpen) {
      this._lastSeenTs.set(Date.now());
      if (this.isSearchOpen()) this.isSearchOpen.set(false);
    }
  }

  closeBell(): void { this.isBellOpen.set(false); }

  bellIconColor(type: ActivityEvent['type']): string {
    return type === 'created' ? 'purple' : type === 'completed' ? 'green' : 'red';
  }

  bellText(event: ActivityEvent): string {
    switch (event.type) {
      case 'created':   return `You created "${event.taskTitle}"`;
      case 'completed': return `"${event.taskTitle}" marked as completed`;
      case 'deleted':   return `"${event.taskTitle}" was deleted`;
    }
  }

  bellTimeAgo(timestamp: number): string {
    const s = Math.floor((Date.now() - timestamp) / 1000);
    if (s < 60)  return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    if (h < 48)  return 'Yesterday';
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.isSearchOpen()) { this.isSearchOpen.set(false); return; }
      if (this.isBellOpen())   { this.isBellOpen.set(false);   return; }
    }
    this.shortcutsService.handleKeydown(event);
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 768) this.mobileOpen = false;
  }

  toggleSidebar() {
    if (window.innerWidth <= 768) {
      this.mobileOpen = !this.mobileOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeMobile() { this.mobileOpen = false; }

  openAddTaskModal() { this.modalService.openAddTaskModal(); }

  onSettings() { this.router.navigate(['/settings']); }
  onHelp()     { this.shortcutsService.openHelp(); }
  onLogout()   { this.authService.logout(); }
}
