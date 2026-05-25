import { Component, HostListener, computed, inject } from '@angular/core';
import { ShortcutsService } from '../../../core/services/shortcuts.service';

@Component({
  selector: 'app-shortcuts-help-modal',
  imports: [],
  templateUrl: './shortcuts-help-modal.component.html',
  styleUrl: './shortcuts-help-modal.component.scss'
})
export class ShortcutsHelpModalComponent {
  private readonly shortcutsService = inject(ShortcutsService);

  readonly isOpen          = this.shortcutsService.isHelpOpen;
  readonly shortcutGroups  = this.shortcutsService.getShortcutsByCategory;

  readonly isMac = computed(() =>
    typeof navigator !== 'undefined' &&
    navigator.platform.toLowerCase().includes('mac')
  );

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.onClose();
  }

  onClose(): void {
    this.shortcutsService.closeHelp();
  }

  displayKey(key: string): string {
    const k = key.toLowerCase();
    if (k === 'ctrl' && this.isMac()) return '⌘';
    if (k === 'cmd')                  return '⌘';
    if (k === 'shift')                return '⇧';
    if (k === 'alt')                  return this.isMac() ? '⌥' : 'Alt';
    return key.toUpperCase();
  }
}
