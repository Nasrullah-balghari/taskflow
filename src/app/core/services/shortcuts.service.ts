import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from './modal.service';
import { CommandPaletteService } from './command-palette.service';
import { AuthService } from './auth.service';
import { Shortcut, ShortcutCategory } from '../models/shortcut.model';

@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  private readonly router         = inject(Router);
  private readonly modalService   = inject(ModalService);
  private readonly commandPalette = inject(CommandPaletteService);
  private readonly authService    = inject(AuthService);

  private readonly _shortcuts  = signal<Shortcut[]>([]);
  readonly shortcuts = this._shortcuts.asReadonly();

  private readonly _isHelpOpen = signal(false);
  readonly isHelpOpen = this._isHelpOpen.asReadonly();

  private leaderKey: string | null = null;
  private leaderTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly LEADER_TIMEOUT_MS = 1500;

  constructor() {
    this.registerShortcuts();
  }

  openHelp():  void { this._isHelpOpen.set(true); }
  closeHelp(): void { this._isHelpOpen.set(false); }

  readonly getShortcutsByCategory = computed(() => {
    const grouped = new Map<ShortcutCategory, Shortcut[]>();
    for (const s of this._shortcuts()) {
      if (!grouped.has(s.category)) grouped.set(s.category, []);
      grouped.get(s.category)!.push(s);
    }
    const order: ShortcutCategory[] = ['Global', 'Navigation', 'Tasks', 'Modal'];
    return order
      .filter(cat => grouped.has(cat))
      .map(cat => ({ category: cat, shortcuts: grouped.get(cat)! }));
  });

  handleKeydown(event: KeyboardEvent): void {
    const hasModifier = event.ctrlKey || event.metaKey;
    if (this.isTypingInInput() && !hasModifier) return;

    for (const shortcut of this._shortcuts()) {
      if (shortcut.enabled && !shortcut.enabled()) continue;

      if (shortcut.isSequence) {
        if (this.tryMatchSequence(shortcut, event)) {
          event.preventDefault();
          shortcut.handler(event);
          this.clearLeader();
          return;
        }
      } else {
        if (this.tryMatchCombo(shortcut, event)) {
          event.preventDefault();
          shortcut.handler(event);
          return;
        }
      }
    }

    this.maybeSetLeader(event);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private isTypingInInput(): boolean {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return tag === 'input' ||
           tag === 'textarea' ||
           tag === 'select' ||
           (active as HTMLElement).isContentEditable;
  }

  private tryMatchCombo(shortcut: Shortcut, event: KeyboardEvent): boolean {
    const keys = shortcut.keys.map(k => k.toLowerCase());

    const needsCtrl  = keys.includes('ctrl');
    const needsCmd   = keys.includes('cmd');
    const needsShift = keys.includes('shift');
    const needsAlt   = keys.includes('alt');

    const mainKey = keys.find(k => !['ctrl', 'cmd', 'shift', 'alt'].includes(k));
    if (!mainKey) return false;

    const keyMatch = event.key.toLowerCase() === mainKey;
    if (!keyMatch) return false;

    const modifierMatch = (needsCtrl || needsCmd)
      ? (event.ctrlKey || event.metaKey)
      : (!event.ctrlKey && !event.metaKey);

    // Special characters like '?' require Shift on most keyboards — skip shift
    // check when the key itself isn't a letter or digit (shift is implicit).
    const isSpecialChar = mainKey.length === 1 && /[^a-z0-9]/.test(mainKey);
    const shiftMatch = isSpecialChar || (needsShift ? event.shiftKey : !event.shiftKey);
    const altMatch = needsAlt ? event.altKey : !event.altKey;

    return modifierMatch && shiftMatch && altMatch;
  }

  private tryMatchSequence(shortcut: Shortcut, event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    const [first, second] = shortcut.keys.map(k => k.toLowerCase());
    return this.leaderKey === first && event.key.toLowerCase() === second;
  }

  private maybeSetLeader(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

    const key = event.key.toLowerCase();
    const isLeaderKey = this._shortcuts().some(
      s => s.isSequence && s.keys[0].toLowerCase() === key
    );

    if (isLeaderKey) {
      this.leaderKey = key;
      if (this.leaderTimeout) clearTimeout(this.leaderTimeout);
      this.leaderTimeout = setTimeout(() => this.clearLeader(), this.LEADER_TIMEOUT_MS);
    }
  }

  private clearLeader(): void {
    this.leaderKey = null;
    if (this.leaderTimeout) {
      clearTimeout(this.leaderTimeout);
      this.leaderTimeout = null;
    }
  }

  private registerShortcuts(): void {
    this._shortcuts.set([
      // ── Global ─────────────────────────────────────────────────────────
      {
        id:          'palette',
        keys:        ['Ctrl', 'K'],
        description: 'Open command palette',
        category:    'Global',
        handler:     () => this.commandPalette.toggle(),
      },
      {
        id:          'help',
        keys:        ['?'],
        description: 'Show keyboard shortcuts',
        category:    'Global',
        handler:     () => this.openHelp(),
      },
      // ── Tasks ──────────────────────────────────────────────────────────
      {
        id:          'new-task',
        keys:        ['Ctrl', 'N'],
        description: 'Create new task',
        category:    'Tasks',
        handler:     () => this.modalService.openAddTaskModal(),
      },
      // ── Navigation (sequences) ──────────────────────────────────────────
      {
        id:          'goto-dashboard',
        keys:        ['g', 'd'],
        description: 'Go to Dashboard',
        category:    'Navigation',
        isSequence:  true,
        handler:     () => this.router.navigate(['/dashboard']),
      },
      {
        id:          'goto-today',
        keys:        ['g', 't'],
        description: 'Go to Today',
        category:    'Navigation',
        isSequence:  true,
        handler:     () => this.router.navigate(['/today']),
      },
      {
        id:          'goto-upcoming',
        keys:        ['g', 'u'],
        description: 'Go to Upcoming',
        category:    'Navigation',
        isSequence:  true,
        handler:     () => this.router.navigate(['/upcoming']),
      },
      {
        id:          'goto-all',
        keys:        ['g', 'a'],
        description: 'Go to All Tasks',
        category:    'Navigation',
        isSequence:  true,
        handler:     () => this.router.navigate(['/all-tasks']),
      },
      {
        id:          'goto-board',
        keys:        ['g', 'b'],
        description: 'Go to Board View',
        category:    'Navigation',
        isSequence:  true,
        handler:     () => this.router.navigate(['/board-view']),
      },
      {
        id:          'goto-calendar',
        keys:        ['g', 'c'],
        description: 'Go to Calendar',
        category:    'Navigation',
        isSequence:  true,
        handler:     () => this.router.navigate(['/calendar']),
      },
    ]);
  }
}
