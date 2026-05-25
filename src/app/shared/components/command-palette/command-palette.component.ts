import { Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommandPaletteService } from '../../../core/services/command-palette.service';
import { Command, CommandGroup } from '../../../core/models/command.model';

@Component({
  selector: 'app-command-palette',
  imports: [],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss'
})
export class CommandPaletteComponent {
  private readonly paletteService = inject(CommandPaletteService);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly isOpen = this.paletteService.isOpen;

  readonly searchQuery   = signal<string>('');
  readonly selectedIndex = signal<number>(0);

  readonly filteredCommands = computed<Command[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all   = this.paletteService.allCommands();

    if (!query) {
      return [
        ...all.filter(c => c.group === 'Actions'),
        ...all.filter(c => c.group === 'Navigation').slice(0, 6),
        ...all.filter(c => c.group === 'Tasks').slice(0, 5),
      ];
    }

    const scored = all.map(cmd => {
      let score = 0;
      const titleLower = cmd.title.toLowerCase();

      if (titleLower === query)             score += 100;
      else if (titleLower.startsWith(query)) score += 50;
      else if (titleLower.includes(query))   score += 30;

      for (const kw of cmd.keywords) {
        if (kw.includes(query)) score += 10;
      }

      if (cmd.subtitle?.toLowerCase().includes(query)) score += 5;

      return { cmd, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.cmd)
      .slice(0, 30);
  });

  readonly groupedCommands = computed(() => {
    const groups = new Map<CommandGroup, Command[]>();
    for (const cmd of this.filteredCommands()) {
      if (!groups.has(cmd.group)) groups.set(cmd.group, []);
      groups.get(cmd.group)!.push(cmd);
    }
    const order: CommandGroup[] = ['Actions', 'Tasks', 'Categories', 'Navigation', 'Recent'];
    return order
      .filter(g => groups.has(g))
      .map(g => ({ group: g, commands: groups.get(g)! }));
  });

  readonly flatList = computed<Command[]>(() =>
    this.groupedCommands().flatMap(g => g.commands)
  );

  readonly hasResults = computed(() => this.filteredCommands().length > 0);

  constructor() {
    effect(() => {
      if (this.paletteService.isOpen()) {
        this.searchQuery.set('');
        this.selectedIndex.set(0);
        setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      this.filteredCommands();
      this.selectedIndex.set(0);
    }, { allowSignalWrites: true });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onSelect(cmd: Command): void {
    cmd.execute();
  }

  onKeydown(event: KeyboardEvent): void {
    const list = this.flatList();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.set((this.selectedIndex() + 1) % list.length);
      this.scrollSelectedIntoView();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = this.selectedIndex() - 1;
      this.selectedIndex.set(prev < 0 ? list.length - 1 : prev);
      this.scrollSelectedIntoView();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = list[this.selectedIndex()];
      if (cmd) this.onSelect(cmd);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.paletteService.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.paletteService.close();
    }
  }

  getGlobalIndex(cmd: Command): number {
    return this.flatList().findIndex(c => c.id === cmd.id);
  }

  private scrollSelectedIntoView(): void {
    setTimeout(() => {
      document.querySelector('.palette-result.is-selected')
        ?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }
}
