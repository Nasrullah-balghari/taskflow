import { Component, computed, input } from '@angular/core';
import { SkeletonBoxComponent } from '../../skeleton-box/skeleton-box.component';

@Component({
  selector: 'app-board-card-skeleton',
  imports: [SkeletonBoxComponent],
  template: `
    @for (i of countArray(); track i) {
      <div class="skeleton-board-card">
        <div class="card-top">
          <app-skeleton-box width="60px" height="16px" borderRadius="4px" />
        </div>
        <app-skeleton-box [width]="randomWidth(70, 95)" height="14px" />
        <app-skeleton-box [width]="randomWidth(40, 70)" height="11px" />
        <div class="card-footer">
          <app-skeleton-box width="50px" height="18px" borderRadius="999px" />
          <app-skeleton-box width="60px" height="12px" />
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .skeleton-board-card {
      background: white;
      border: 1px solid #E4E4E7;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .skeleton-board-card + .skeleton-board-card { margin-top: 8px; }

    .card-top { margin-bottom: 4px; }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
    }
  `]
})
export class BoardCardSkeletonComponent {
  count = input<number>(3);

  readonly countArray = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i)
  );

  randomWidth(min: number, max: number): string {
    return `${Math.floor(Math.random() * (max - min) + min)}%`;
  }
}
