import { Component, computed, input } from '@angular/core';
import { SkeletonBoxComponent } from '../../skeleton-box/skeleton-box.component';

@Component({
  selector: 'app-task-row-skeleton',
  imports: [SkeletonBoxComponent],
  template: `
    @for (i of countArray(); track i) {
      <div class="skeleton-row">
        <app-skeleton-box width="20px" height="20px" borderRadius="5px" />
        <div class="row-content">
          <app-skeleton-box [width]="randomWidth(60, 85)" height="14px" />
          <app-skeleton-box [width]="randomWidth(30, 50)" height="11px" />
        </div>
        <app-skeleton-box width="50px" height="22px" borderRadius="12px" />
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
    }

    .skeleton-row + .skeleton-row { margin-top: 4px; }

    .row-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
  `]
})
export class TaskRowSkeletonComponent {
  count = input<number>(4);

  readonly countArray = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i)
  );

  randomWidth(min: number, max: number): string {
    return `${Math.floor(Math.random() * (max - min) + min)}%`;
  }
}
