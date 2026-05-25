import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ModalService } from './modal.service';
import { TaskService } from './task.service';
import { CategoryService } from './category.service';
import { CATEGORY_COLORS } from '../models/category.model';
import { Command, CommandIcon } from '../models/command.model';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly taskService     = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  private readonly modalService    = inject(ModalService);
  private readonly authService     = inject(AuthService);
  private readonly router          = inject(Router);

  private readonly _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  open():   void { this._isOpen.set(true); }
  close():  void { this._isOpen.set(false); }
  toggle(): void { this._isOpen.update(v => !v); }

  readonly allCommands = computed<Command[]>(() => {
    const commands: Command[] = [];
    const tasks = this.taskService.tasks();

    // ── Actions ────────────────────────────────────────────────────────────
    commands.push({
      id:      'action-create-task',
      type:    'action',
      group:   'Actions',
      title:   'Create new task',
      icon:    'plus',
      keywords: ['new', 'add', 'create', 'task'],
      shortcut: 'Ctrl+N',
      execute: () => {
        this.modalService.openAddTaskModal();
        this.close();
      },
    });

    commands.push({
      id:      'action-manage-categories',
      type:    'action',
      group:   'Actions',
      title:   'Manage categories',
      icon:    'folder',
      keywords: ['categories', 'manage', 'tags', 'organize'],
      execute: () => {
        this.router.navigate(['/categories']);
        this.close();
      },
    });

    commands.push({
      id:      'action-logout',
      type:    'action',
      group:   'Actions',
      title:   'Log out',
      icon:    'log-out',
      keywords: ['logout', 'sign out', 'exit'],
      execute: () => {
        this.authService.logout();
        this.close();
      },
    });

    // ── Tasks (top 50) ─────────────────────────────────────────────────────
    for (const task of tasks.slice(0, 50)) {
      const category = task.categoryId
        ? this.categoryService.getCategoryById(task.categoryId)
        : undefined;

      commands.push({
        id:       `task-${task.id}`,
        type:     'task',
        group:    'Tasks',
        title:    task.title,
        subtitle: task.description,
        icon:     'check-square' as CommandIcon,
        keywords: [
          task.title.toLowerCase(),
          task.description?.toLowerCase() ?? '',
          task.priority,
          category?.name.toLowerCase() ?? '',
        ].filter(Boolean),
        execute: () => {
          this.modalService.openEditTaskModal(task.id);
          this.close();
        },
        meta: {
          completed:     task.completed,
          priority:      task.priority,
          categoryColor: category ? CATEGORY_COLORS[category.color] : undefined,
          categoryName:  category?.name,
        },
      });
    }

    // ── Categories ─────────────────────────────────────────────────────────
    for (const cat of this.categoryService.categories()) {
      const taskCount = tasks.filter(
        t => t.categoryId === cat.id && !t.completed
      ).length;

      commands.push({
        id:        `category-${cat.id}`,
        type:      'category',
        group:     'Categories',
        title:     cat.name,
        subtitle:  `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`,
        icon:      'folder' as CommandIcon,
        iconColor: CATEGORY_COLORS[cat.color],
        keywords:  [cat.name.toLowerCase(), 'category', 'filter'],
        execute: () => {
          this.router.navigate(['/category', cat.id]);
          this.close();
        },
      });
    }

    // ── Navigation ─────────────────────────────────────────────────────────
    const navItems: Array<{
      title: string; path: string; icon: CommandIcon;
      keywords: string[]; shortcut?: string;
    }> = [
      { title: 'Dashboard',  path: '/dashboard',  icon: 'home',     keywords: ['home', 'dashboard', 'overview'],         shortcut: 'G D' },
      { title: 'Today',      path: '/today',      icon: 'clock',    keywords: ['today', 'now'],                          shortcut: 'G T' },
      { title: 'Upcoming',   path: '/upcoming',   icon: 'clock',    keywords: ['upcoming', 'future', 'scheduled'] },
      { title: 'All Tasks',  path: '/all-tasks',  icon: 'list',     keywords: ['all', 'list', 'tasks'],                  shortcut: 'G A' },
      { title: 'Board View', path: '/board-view', icon: 'trello',   keywords: ['board', 'kanban', 'columns'],            shortcut: 'G B' },
      { title: 'Calendar',   path: '/calendar',   icon: 'calendar', keywords: ['calendar', 'schedule', 'dates'],         shortcut: 'G C' },
      { title: 'Categories', path: '/categories', icon: 'settings', keywords: ['categories', 'manage', 'settings'] },
    ];

    for (const nav of navItems) {
      commands.push({
        id:       `nav-${nav.path}`,
        type:     'navigation',
        group:    'Navigation',
        title:    nav.title,
        icon:     nav.icon,
        keywords: nav.keywords,
        shortcut: nav.shortcut,
        execute: () => {
          this.router.navigateByUrl(nav.path);
          this.close();
        },
      });
    }

    return commands;
  });
}
